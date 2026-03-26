export interface ApiError {
  code?: string
  message: string
  statusCode?: number
  details?: unknown
  isNetworkError?: boolean
}

export interface ApiValidationIssue {
  code: string
  message: string
  path: Array<string | number>
}

export interface ApiValidationErrorDetails {
  issues: ApiValidationIssue[]
}
