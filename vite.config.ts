import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        popup: 'src/ui/popup.html',
        options: 'src/ui/options.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  }
})