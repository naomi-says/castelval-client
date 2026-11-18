/* Site access gate — the browser's native "Sign in" box (HTTP Basic Auth).
 *
 * Runs BEFORE everything else (pages, scripts, images and the API), so nothing of the portal is
 * served until the right username + password are entered. The browser then remembers them for the
 * rest of the session and attaches them to every request automatically.
 *
 *   SITE_GATE=off        turn the gate off (default: on)
 *   SITE_USER=…          username                      (default: client_demo)
 *   SITE_PASSWORD=…      password; if unset, a random one is generated once, saved in
 *                        server/data/site-password.txt and printed in the server console.
 *
 * Use it over HTTPS: Basic Auth sends the credentials in a (base64) header on every request.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { DATA } from './api.js'

const ENABLED = (process.env.SITE_GATE || 'on').toLowerCase() !== 'off'
const USER = process.env.SITE_USER || 'client_demo'
const PW_FILE = path.join(DATA, 'site-password.txt')
const REALM = 'Castelval client demo'

function loadPassword() {
  if (process.env.SITE_PASSWORD) return process.env.SITE_PASSWORD
  try {
    return fs.readFileSync(PW_FILE, 'utf8').trim()
  } catch {
    const pw = crypto.randomBytes(9).toString('base64url')
    fs.writeFileSync(PW_FILE, pw + '\n', { mode: 0o600 })
    return pw
  }
}
const PASSWORD = ENABLED ? loadPassword() : ''

export const gateInfo = () => ({
  enabled: ENABLED,
  user: USER,
  password: PASSWORD,
  source: process.env.SITE_PASSWORD ? 'SITE_PASSWORD' : PW_FILE
})

/* constant-time comparison (hash first so the length does not leak either) */
const sha = s => crypto.createHash('sha256').update(String(s)).digest()
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b))

/* 20 wrong attempts from one address in a minute → 429 for the rest of that minute */
const fails = new Map()
const locked = ip => {
  const f = fails.get(ip)
  return !!f && f.n >= 20 && Date.now() - f.t < 60_000
}
const noteFail = ip => {
  const f = fails.get(ip)
  fails.set(ip, !f || Date.now() - f.t > 60_000 ? { n: 1, t: Date.now() } : { n: f.n + 1, t: Date.now() })
}

const PAGE = title =>
  `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>${title}</title>` +
  `<body style="font:16px system-ui;margin:12vh auto;max-width:28em;padding:0 1em;color:#1b2433"><h1 style="font-size:20px">${title}</h1>` +
  `<p>Reload the page and enter your username and password to continue.</p>`

/* Returns true when it has answered the request itself (= blocked); false = let it through. */
export function gate(req, res) {
  if (!ENABLED) return false

  const h = req.headers.authorization || ''
  const ip = req.socket.remoteAddress || 'unknown'
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  }

  if (locked(ip)) {
    res.writeHead(429, { ...headers, 'Retry-After': '60' }).end(PAGE('Too many attempts'))
    return true
  }

  if (h.startsWith('Basic ')) {
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8')
    const i = decoded.indexOf(':')
    const user = i < 0 ? decoded : decoded.slice(0, i)
    const pass = i < 0 ? '' : decoded.slice(i + 1)
    const okUser = same(user, USER)
    const okPass = same(pass, PASSWORD)
    if (okUser && okPass) {
      fails.delete(ip)
      return false
    }
    noteFail(ip) // only a wrong guess counts; the first "no credentials yet" request does not
  }

  res
    .writeHead(401, { ...headers, 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` })
    .end(PAGE('Authentication required'))
  return true
}
