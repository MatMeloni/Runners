import path from 'path'
import { fileURLToPath } from 'url'

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')

  const vitePort = env.VITE_PORT
  const apiBase = env.API_BASE_URL

  if (!vitePort) {
    throw new Error('Defina VITE_PORT no .env na raiz do repositório (veja .env.example).')
  }
  if (!apiBase) {
    throw new Error('Defina API_BASE_URL no .env na raiz do repositório (veja .env.example).')
  }

  return {
    plugins: [react()],
    envDir: repoRoot,
    server: {
      port: Number(vitePort),
      proxy: {
        '/api': { target: apiBase, changeOrigin: true },
        '/health': { target: apiBase, changeOrigin: true },
      },
    },
  }
})
