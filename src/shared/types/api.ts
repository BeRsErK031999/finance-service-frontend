export interface ApiError {
  message: string
  statusCode?: number
  details?: unknown
  isNetworkError?: boolean
}
