import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  CreatePlannedPaymentRequest,
  PlannedPayment,
  PlannedPaymentListQuery,
  PlannedPaymentListResponse,
  UpdatePlannedPaymentRequest,
} from '../model/types'

export async function listPlannedPayments(
  query: PlannedPaymentListQuery = {},
): Promise<PlannedPaymentListResponse> {
  return requestWithParsedError(
    apiClient.get<PlannedPaymentListResponse>('/planned-payments', {
      params: query,
    }),
  )
}

export async function createPlannedPayment(
  payload: CreatePlannedPaymentRequest,
): Promise<PlannedPayment> {
  return requestWithParsedError(
    apiClient.post<PlannedPayment>('/planned-payments', payload),
  )
}

export async function archivePlannedPayment(id: string): Promise<PlannedPayment> {
  return requestWithParsedError(
    apiClient.post<PlannedPayment>(`/planned-payments/${id}/archive`),
  )
}

export async function updatePlannedPayment(
  id: string,
  payload: UpdatePlannedPaymentRequest,
): Promise<PlannedPayment> {
  return requestWithParsedError(
    apiClient.patch<PlannedPayment>(`/planned-payments/${id}`, payload),
  )
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
