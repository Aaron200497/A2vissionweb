import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // add this so Vite knows your repo’s sub-path on GH-Pages
  base: '/A2vissionweb/',
  build: {
    outDir: 'docs',     // emit to `docs/` so GH-Pages can serve it
    emptyOutDir: true,
  },
  plugins: [react()],
});
