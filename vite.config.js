// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/A2vissionweb/',    // el nombre de tu repo
  plugins: [react()]
})
