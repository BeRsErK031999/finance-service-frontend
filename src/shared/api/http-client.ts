import axios from 'axios'

import { appConfig } from '../config/env'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10_000,
  timeoutErrorMessage: 'Request timed out. Please try again.',
  headers: {
    Accept: 'application/json',
  },
})
