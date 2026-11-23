import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Photos, logo and rendered product posters live in ../assets.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@assets': fileURLToPath(new URL('../assets', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
})
