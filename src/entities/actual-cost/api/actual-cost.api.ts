import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  ActualCost,
  ActualCostListResponse,
  CreateActualCostRequest,
} from '../model/types'

export interface ActualCostListQuery {
  plannedCostId?: string
  projectFinanceId?: string
}

export async function listActualCosts(
  query: ActualCostListQuery = {},
): Promise<ActualCostListResponse> {
  return requestWithParsedError(
    apiClient.get<ActualCostListResponse>('/actual-costs', {
      params: normalizeActualCostListQuery(query),
    }),
  )
}

export async function createActualCost(
  payload: CreateActualCostRequest,
): Promise<ActualCost> {
  return requestWithParsedError(apiClient.post<ActualCost>('/actual-costs', payload))
}

export async function archiveActualCost(id: string): Promise<ActualCost> {
  return requestWithParsedError(
    apiClient.post<ActualCost>(`/actual-costs/${id}/archive`),
  )
}

function normalizeActualCostListQuery(query: ActualCostListQuery) {
  return {
    ...(query.plannedCostId ? { plannedCostId: query.plannedCostId } : {}),
    ...(query.projectFinanceId ? { projectFinanceId: query.projectFinanceId } : {}),
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
