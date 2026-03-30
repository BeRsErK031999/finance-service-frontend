import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().min(1).default('http://localhost:3000'),
  VITE_CURRENT_USER_ID: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length === 0 ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
})

const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_CURRENT_USER_ID: import.meta.env.VITE_CURRENT_USER_ID,
})

export const appConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL,
  currentUserId: env.VITE_CURRENT_USER_ID ?? null,
} as const

export type AppConfig = typeof appConfig
