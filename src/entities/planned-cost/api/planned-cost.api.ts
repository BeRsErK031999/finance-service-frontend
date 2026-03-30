import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  CreatePlannedCostRequest,
  PlannedCost,
  PlannedCostListQuery,
  PlannedCostListResponse,
  UpdatePlannedCostRequest,
} from '../model/types'

export async function listPlannedCosts(
  query: PlannedCostListQuery = {},
): Promise<PlannedCostListResponse> {
  return requestWithParsedError(
    apiClient.get<PlannedCostListResponse>('/planned-costs', {
      params: query,
    }),
  )
}

export async function createPlannedCost(
  payload: CreatePlannedCostRequest,
): Promise<PlannedCost> {
  return requestWithParsedError(
    apiClient.post<PlannedCost>('/planned-costs', payload),
  )
}

export async function archivePlannedCost(id: string): Promise<PlannedCost> {
  return requestWithParsedError(
    apiClient.post<PlannedCost>(`/planned-costs/${id}/archive`),
  )
}

export async function updatePlannedCost(
  id: string,
  payload: UpdatePlannedCostRequest,
): Promise<PlannedCost> {
  return requestWithParsedError(
    apiClient.patch<PlannedCost>(`/planned-costs/${id}`, payload),
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
