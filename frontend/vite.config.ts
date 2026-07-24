import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLan = mode === 'lan'

  // HTTPS config for LAN mode — uses mkcert certs
  const httpsConfig = isLan
    ? {
        key: fs.readFileSync('d:/stream/certs/key.pem'),
        cert: fs.readFileSync('d:/stream/certs/cert.pem')
      }
    : undefined

  return {
    plugins: [
      vue(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: isLan ? '0.0.0.0' : 'localhost',
      https: httpsConfig
    }
  }
})
