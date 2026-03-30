import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim() || '/api'
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || ''
  const shouldProxyApi = apiBaseUrl.startsWith('/') && apiProxyTarget.length > 0

  return {
    plugins: [react()],
    server: shouldProxyApi
      ? {
          proxy: {
            [apiBaseUrl]: {
              target: apiProxyTarget,
              changeOrigin: true,
              rewrite: (path) =>
                apiBaseUrl === '/'
                  ? path
                  : path.startsWith(apiBaseUrl)
                    ? path.slice(apiBaseUrl.length) || '/'
                    : path,
            },
          },
        }
      : undefined,
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
  }
})
