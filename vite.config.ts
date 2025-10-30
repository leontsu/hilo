import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [
    react(),
    crx({ 
      manifest,
      browser: 'chrome'
    })
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
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  }
})