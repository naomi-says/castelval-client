/* Mounts the site gate + branding API inside Vite's dev and preview servers,
   so a single `npm run dev` is enough (no second terminal). */
import { handleApi, passwordSource, adminPassword } from './api.js'
import { gate, gateInfo } from './gate.js'

const mount = server => {
  server.middlewares.use((req, res, next) => {
    if (gate(req, res)) return // site login first: nothing is served until it passes
    handleApi(req, res).then(done => done || next(), next)
  })
}

export default function brandingApi() {
  return {
    name: 'castelval-branding-api',
    configureServer(server) {
      mount(server)
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer.address()
        const port = typeof addr === 'object' && addr ? addr.port : server.config.server.port
        setTimeout(() => {
          const g = gateInfo()
          console.log(
            g.enabled
              ? `\n  Site login      → user: ${g.user}   password: ${g.password}  [${g.source}]`
              : '\n  Site login      → OFF (SITE_GATE=off)'
          )
          console.log(`  Brand studio    → http://localhost:${port}/admin/branding`)
          console.log(
            `  Studio password → ${process.env.BRAND_ADMIN_PASSWORD ? '(from BRAND_ADMIN_PASSWORD)' : adminPassword}  [${passwordSource}]\n`
          )
        }, 50)
      })
    },
    configurePreviewServer: mount
  }
}
