import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth': 'http://localhost:3001',
      '/send-email': 'http://localhost:3001',
      '/email-stats': 'http://localhost:3001',
      '/email-lists': 'http://localhost:3001',
      '/update-email-lists': 'http://localhost:3001',
      '/prospect-lists': 'http://localhost:3001',
      '/campaigns': 'http://localhost:3001',
      '/validate-emails': 'http://localhost:3001',
      '/settings': 'http://localhost:3001'
    }
  }
})