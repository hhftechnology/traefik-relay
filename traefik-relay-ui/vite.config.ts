import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Configure the dev server to proxy API requests to our Go backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // Generate source maps for better debugging
    sourcemap: true,
  }
})