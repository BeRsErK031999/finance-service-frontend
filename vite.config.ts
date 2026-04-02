import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_API_BASE_URL = '/api'
const DEFAULT_API_PROXY_TARGET = 'http://localhost:13002'
const PROXY_HEALTHCHECK_PATH = '/health'
const PROXY_HEALTHCHECK_TIMEOUT_MS = 1_000

const normalizeProxyTargets = (targets: Array<string | undefined>): string[] => {
  const normalizedTargets = targets
    .map((target) => target?.trim())
    .filter((target): target is string => Boolean(target))

  return [...new Set(normalizedTargets)]
}

const isProxyTargetAvailable = async (target: string): Promise<boolean> => {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    PROXY_HEALTHCHECK_TIMEOUT_MS,
  )

  try {
    const healthcheckUrl = new URL(PROXY_HEALTHCHECK_PATH, target)
    const response = await fetch(healthcheckUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

const resolveApiProxyTarget = async (targets: string[]): Promise<string> => {
  for (const target of targets) {
    if (await isProxyTargetAvailable(target)) {
      return target
    }
  }

  return targets[0] ?? ''
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
  const apiProxyTargets = normalizeProxyTargets([
    env.VITE_API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
    env.VITE_API_PROXY_FALLBACK_TARGET,
  ])
  const shouldProxyApi =
    apiBaseUrl.startsWith('/') && apiProxyTargets.length > 0
  const apiProxyTarget = shouldProxyApi
    ? await resolveApiProxyTarget(apiProxyTargets)
    : ''

  if (
    shouldProxyApi &&
    apiProxyTarget.length > 0 &&
    apiProxyTarget !== apiProxyTargets[0]
  ) {
    console.info(
      `[vite] primary API proxy target ${apiProxyTargets[0]} is unavailable, falling back to ${apiProxyTarget}`,
    )
  }

  return {
    plugins: [react()],
    server: shouldProxyApi
      ? {
          proxy: {
            [apiBaseUrl]: {
              target: apiProxyTarget,
              changeOrigin: true,
              rewrite: (path: string) =>
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
          manualChunks(id: string) {
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
