import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('@mui') ||
            id.includes('@emotion') ||
            id.includes('@popperjs')
          ) {
            return 'mui'
          }

          if (
            id.includes('react') ||
            id.includes('scheduler') ||
            id.includes('@tanstack')
          ) {
            return 'react-vendor'
          }

          if (id.includes('axios') || id.includes('zod')) {
            return 'data-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
