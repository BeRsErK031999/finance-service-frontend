import axios, { AxiosError } from 'axios'

import type { ApiError } from '../types/api'

const DEFAULT_ERROR_MESSAGE =
  'Request failed. Please try again or contact support if the issue persists.'

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          code?: unknown
          details?: unknown
          error?: unknown
          message?: unknown
        }
      | undefined

    const message =
      typeof responseData?.message === 'string'
        ? responseData.message
        : typeof responseData?.error === 'string'
          ? responseData.error
          : error.message || DEFAULT_ERROR_MESSAGE

    return {
      code: typeof responseData?.code === 'string' ? responseData.code : undefined,
      message:
        error.code === AxiosError.ECONNABORTED
          ? 'Request timed out. Please try again.'
          : message,
      statusCode: error.response?.status,
      details: responseData?.details,
      isNetworkError: !error.response,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
  }
}
