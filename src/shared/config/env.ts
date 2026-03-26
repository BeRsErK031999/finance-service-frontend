import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().min(1).default('http://localhost:3000'),
})

const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
})

export const appConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL,
} as const

export type AppConfig = typeof appConfig
