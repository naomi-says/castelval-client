/* Branding API — zero dependencies (Node built-ins only).
 *
 *   GET    /api/branding            public   current settings (+ logo url)
 *   POST   /api/branding/login      public   { password } -> { token }
 *   PUT    /api/branding            admin    replace settings   (admin = header  X-Studio-Token: <token>)
 *   POST   /api/branding/logo       admin    raw image body (png/jpeg/webp/gif/svg, <= 2 MB)
 *   DELETE /api/branding/logo       admin    remove the custom logo (back to the bundled one)
 *   GET    /api/branding/logo       public   the custom logo file
 *
 * Data lives in server/data (git-ignored): branding.json, the logo file, the admin password
 * and the token-signing secret. Set BRAND_ADMIN_PASSWORD to choose the password yourself;
 * otherwise a random one is generated once and printed in the server console.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const DATA = process.env.BRAND_DATA_DIR || path.join(HERE, 'data')
const FILE = path.join(DATA, 'branding.json')
const PW_FILE = path.join(DATA, 'admin-password.txt')
const SECRET_FILE = path.join(DATA, 'secret.key')
const MAX_LOGO = 2 * 1024 * 1024
const MAX_JSON = 20 * 1024
const TOKEN_TTL = 8 * 60 * 60 * 1000

export const DEFAULTS = {
  name: 'CASTELVAL',
  tagline: 'FINANCE',
  showLogo: true,
  showName: true,
  logoScale: 1,
  logoTone: 'auto', // 'auto' = follows the header colour, 'original' = untouched colours
  preset: 'castelval',
  colors: { header: null, button: null, background: null, light: null, highlight: null, title: null },
  logoFile: null, // file name inside DATA, null = bundled logo
  logoVersion: 0
}

const COLOR_KEYS = Object.keys(DEFAULTS.colors)
const HEX = /^#[0-9a-f]{6}$/i
const LOGO_TYPES = {
  png: { mime: 'image/png', ext: 'png' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  webp: { mime: 'image/webp', ext: 'webp' },
  gif: { mime: 'image/gif', ext: 'gif' },
  svg: { mime: 'image/svg+xml', ext: 'svg' }
}

fs.mkdirSync(DATA, { recursive: true })

/* ---------- secrets ---------- */
function readOrCreate(file, make) {
  try {
    return fs.readFileSync(file, 'utf8').trim()
  } catch {
    const v = make()
    fs.writeFileSync(file, v + '\n', { mode: 0o600 })
    return v
  }
}
const SECRET = readOrCreate(SECRET_FILE, () => crypto.randomBytes(32).toString('hex'))
const ADMIN_PASSWORD =
  process.env.BRAND_ADMIN_PASSWORD ||
  readOrCreate(PW_FILE, () => {
    const pw = crypto.randomBytes(9).toString('base64url')
    return pw
  })
export const passwordSource = process.env.BRAND_ADMIN_PASSWORD ? 'BRAND_ADMIN_PASSWORD' : PW_FILE
export const adminPassword = ADMIN_PASSWORD

/* ---------- storage ---------- */
function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return sanitize(raw, { keepInternal: true })
  } catch {
    return structuredClone(DEFAULTS)
  }
}
function save(s) {
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2))
  fs.renameSync(tmp, FILE)
}

/* Validate & normalise settings coming from the client (never trust the body). */
function sanitize(src, { keepInternal = false } = {}) {
  const o = src && typeof src === 'object' ? src : {}
  const str = (v, d, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : d)
  const out = structuredClone(DEFAULTS)
  out.name = str(o.name, DEFAULTS.name, 40)
  out.tagline = str(o.tagline, DEFAULTS.tagline, 40)
  out.showLogo = o.showLogo !== false
  out.showName = o.showName !== false
  const sc = Number(o.logoScale)
  out.logoScale = Number.isFinite(sc) ? Math.min(2.5, Math.max(0.4, Math.round(sc * 100) / 100)) : 1
  out.logoTone = o.logoTone === 'original' ? 'original' : 'auto'
  out.preset = str(o.preset, 'castelval', 24).replace(/[^a-z0-9-]/gi, '') || 'custom'
  const c = o.colors && typeof o.colors === 'object' ? o.colors : {}
  for (const k of COLOR_KEYS) out.colors[k] = typeof c[k] === 'string' && HEX.test(c[k]) ? c[k].toLowerCase() : null
  if (keepInternal) {
    out.logoFile = typeof o.logoFile === 'string' && /^logo\.(png|jpg|webp|gif|svg)$/.test(o.logoFile) ? o.logoFile : null
    out.logoVersion = Number.isFinite(o.logoVersion) ? o.logoVersion : 0
  }
  return out
}

const publicView = s => {
  const { logoFile, logoVersion, ...rest } = s
  return { ...rest, logoUrl: logoFile ? `/api/branding/logo?v=${logoVersion}` : null }
}

/* ---------- auth ---------- */
const sign = payload => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
const makeToken = () => {
  const exp = String(Date.now() + TOKEN_TTL)
  return `${exp}.${sign(exp)}`
}
const eq = (a, b) => {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}
function isAdmin(req) {
  // NOT the Authorization header: that one carries the site gate's Basic credentials (see gate.js)
  const t = String(req.headers['x-studio-token'] || '')
  const [exp, sig] = t.split('.')
  return !!(exp && sig && Number(exp) > Date.now() && eq(sig, sign(exp)))
}

/* tiny brute-force guard: 5 failures / IP -> locked for a minute */
const fails = new Map()
function locked(ip) {
  const f = fails.get(ip)
  return !!f && f.n >= 5 && Date.now() - f.t < 60_000
}
function noteFail(ip) {
  const f = fails.get(ip)
  fails.set(ip, !f || Date.now() - f.t > 60_000 ? { n: 1, t: Date.now() } : { n: f.n + 1, t: Date.now() })
}

/* ---------- helpers ---------- */
const send = (res, code, body, headers = {}) => {
  const isBuf = Buffer.isBuffer(body)
  res.writeHead(code, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(isBuf ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
    ...headers
  })
  res.end(isBuf ? body : JSON.stringify(body))
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', c => {
      size += c.length
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/* Detect the real image type from the first bytes (the Content-Type header is not trusted). */
function sniff(buf) {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buf.length > 6 && /^GIF8[79]a/.test(buf.toString('ascii', 0, 6))) return 'gif'
  const head = buf.toString('utf8', 0, 600).trimStart().toLowerCase()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    const text = buf.toString('utf8').toLowerCase()
    if (/<script|javascript:|\son\w+\s*=|<foreignobject|<iframe|<embed|<object/.test(text)) return 'unsafe-svg'
    return 'svg'
  }
  return null
}

function removeLogoFiles() {
  for (const t of Object.values(LOGO_TYPES)) {
    try {
      fs.unlinkSync(path.join(DATA, `logo.${t.ext}`))
    } catch {
      /* not there */
    }
  }
}

/* ---------- handler ---------- */
export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://x')
  const p = url.pathname.replace(/\/+$/, '')
  if (!p.startsWith('/api/branding')) return false

  const ip = req.socket.remoteAddress || 'unknown'
  try {
    if (p === '/api/branding' && req.method === 'GET') {
      send(res, 200, publicView(load()))
      return true
    }

    if (p === '/api/branding/login' && req.method === 'POST') {
      if (locked(ip)) return send(res, 429, { error: 'Too many attempts. Try again in a minute.' }), true
      const body = JSON.parse((await readBody(req, 1024)).toString() || '{}')
      if (typeof body.password === 'string' && eq(body.password, ADMIN_PASSWORD)) {
        fails.delete(ip)
        send(res, 200, { token: makeToken(), expiresIn: TOKEN_TTL })
      } else {
        noteFail(ip)
        send(res, 401, { error: 'Wrong password.' })
      }
      return true
    }

    if (p === '/api/branding/logo' && req.method === 'GET') {
      const s = load()
      if (!s.logoFile) return send(res, 404, { error: 'No custom logo' }), true
      const buf = fs.readFileSync(path.join(DATA, s.logoFile))
      const type = Object.values(LOGO_TYPES).find(t => t.ext === s.logoFile.split('.')[1])
      send(res, 200, buf, {
        'Content-Type': type.mime,
        'Cache-Control': 'public, max-age=31536000, immutable', // url carries ?v=<version>
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox"
      })
      return true
    }

    /* everything below needs the admin token */
    if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' }), true

    if (p === '/api/branding' && req.method === 'PUT') {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString() || '{}')
      const cur = load()
      const next = sanitize(body)
      next.logoFile = cur.logoFile
      next.logoVersion = cur.logoVersion
      save(next)
      send(res, 200, publicView(next))
      return true
    }

    if (p === '/api/branding/logo' && req.method === 'POST') {
      const buf = await readBody(req, MAX_LOGO)
      const kind = sniff(buf)
      if (kind === 'unsafe-svg') return send(res, 400, { error: 'This SVG contains scripts and was rejected.' }), true
      if (!kind) return send(res, 400, { error: 'Unsupported file. Use PNG, JPG, WEBP, GIF or SVG.' }), true
      removeLogoFiles()
      const name = `logo.${LOGO_TYPES[kind].ext}`
      fs.writeFileSync(path.join(DATA, name), buf)
      const cur = load()
      cur.logoFile = name
      cur.logoVersion = Date.now()
      save(cur)
      send(res, 200, publicView(cur))
      return true
    }

    if (p === '/api/branding/logo' && req.method === 'DELETE') {
      removeLogoFiles()
      const cur = load()
      cur.logoFile = null
      cur.logoVersion = Date.now()
      save(cur)
      send(res, 200, publicView(cur))
      return true
    }

    send(res, 405, { error: 'Method not allowed' })
    return true
  } catch (e) {
    const status = e.status || (e instanceof SyntaxError ? 400 : 500)
    send(res, status, { error: status === 413 ? 'File too large (2 MB max).' : status === 400 ? 'Bad request.' : 'Server error.' })
    return true
  }
}
