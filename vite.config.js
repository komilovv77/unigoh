import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/unigoh/' : '/',
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    open: true
  }
})
