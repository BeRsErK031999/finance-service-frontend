import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  ActualPayment,
  ActualPaymentListResponse,
  CreateActualPaymentRequest,
} from '../model/types'

export interface ActualPaymentListQuery {
  plannedPaymentId?: string
  projectFinanceId?: string
}

export async function listActualPayments(
  query: ActualPaymentListQuery = {},
): Promise<ActualPaymentListResponse> {
  return requestWithParsedError(
    apiClient.get<ActualPaymentListResponse>('/actual-payments', {
      params: normalizeActualPaymentListQuery(query),
    }),
  )
}

export async function createActualPayment(
  payload: CreateActualPaymentRequest,
): Promise<ActualPayment> {
  return requestWithParsedError(
    apiClient.post<ActualPayment>('/actual-payments', payload),
  )
}

export async function archiveActualPayment(id: string): Promise<ActualPayment> {
  return requestWithParsedError(
    apiClient.post<ActualPayment>(`/actual-payments/${id}/archive`),
  )
}

function normalizeActualPaymentListQuery(query: ActualPaymentListQuery) {
  return {
    ...(query.plannedPaymentId
      ? { plannedPaymentId: query.plannedPaymentId }
      : {}),
    ...(query.projectFinanceId
      ? { projectFinanceId: query.projectFinanceId }
      : {}),
  }
}

async function requestWithParsedError<T>(
  request: Promise<AxiosResponse<T>>,
): Promise<T> {
  try {
    const response = await request

    return response.data
  } catch (error) {
    throw parseApiError(error)
  }
}
