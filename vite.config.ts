import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/plotting_position_uncertainty/',  // GitHub Pages path
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
})
