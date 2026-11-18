import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import brandingApi from './server/vite-plugin.js'

export default defineConfig({
  plugins: [react(), brandingApi()],
  server: { port: 5173, strictPort: false },
})
