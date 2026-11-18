/* Mounts the branding API inside Vite's dev and preview servers,
   so a single `npm run dev` is enough (no second terminal). */
import { handleApi, passwordSource, adminPassword } from './api.js'

const mount = server => {
  server.middlewares.use((req, res, next) => {
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
          console.log(`\n  Brand studio   → http://localhost:${port}/admin/branding`)
          console.log(
            `  Studio password → ${process.env.BRAND_ADMIN_PASSWORD ? '(from BRAND_ADMIN_PASSWORD)' : adminPassword}  [${passwordSource}]\n`
          )
        }, 50)
      })
    },
    configurePreviewServer: mount
  }
}
