import axios, { AxiosHeaders } from 'axios'

import { appConfig } from '../config/env'
import { getCurrentRequestUserId } from '../auth/mock-auth'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10_000,
  timeoutErrorMessage: 'Request timed out. Please try again.',
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers)
  const currentUserId = getCurrentRequestUserId()

  if (currentUserId === null) {
    headers.delete('x-user-id')
  } else {
    headers.set('x-user-id', currentUserId)
  }

  config.headers = headers

  return config
})
