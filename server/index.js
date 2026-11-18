/* Production server: serves the built portal (dist/) and the branding API from one process,
 * behind the site login (see gate.js).
 *   npm run build && npm start        (PORT=3000 by default)
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi, passwordSource, adminPassword } from './api.js'
import { gate, gateInfo } from './gate.js'

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 3000
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/ not found — run "npm run build" first.')
  process.exit(1)
}

http
  .createServer(async (req, res) => {
    if (gate(req, res)) return // site login first: nothing is served until it passes
    if (await handleApi(req, res)) return
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = path.join(DIST, pathname)
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end()
      return
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html') // SPA fallback
    const ext = path.extname(file)
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
    })
    fs.createReadStream(file).pipe(res)
  })
  .listen(PORT, () => {
    const g = gateInfo()
    console.log(`Castelval portal  → http://localhost:${PORT}`)
    console.log(
      g.enabled ? `Site login        → user: ${g.user}   password: ${g.password}  [${g.source}]` : 'Site login        → OFF (SITE_GATE=off)'
    )
    console.log(`Brand studio      → http://localhost:${PORT}/admin/branding`)
    console.log(`Studio password   → ${process.env.BRAND_ADMIN_PASSWORD ? '(from BRAND_ADMIN_PASSWORD)' : adminPassword}  [${passwordSource}]`)
  })
