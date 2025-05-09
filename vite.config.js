import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',      // importante si sirves desde carpeta
  plugins: [react()],
  build: {
    outDir: 'docs',    // <- aquí
    emptyOutDir: true, // limpia docs/ antes de compilar
  }
})
