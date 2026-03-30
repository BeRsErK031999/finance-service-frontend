import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  CreateSectionFinancePlanRequest,
  SectionFinancePlan,
  SectionFinancePlanListResponse,
  UpdateSectionFinancePlanRequest,
} from '../model/types'

export async function getSectionFinancePlans(
  projectFinanceId: string,
): Promise<SectionFinancePlanListResponse> {
  return requestWithParsedError(
    apiClient.get<SectionFinancePlanListResponse>('/section-finance-plans', {
      params: {
        projectFinanceId,
      },
    }),
  )
}

export async function createSectionFinancePlan(
  payload: CreateSectionFinancePlanRequest,
): Promise<SectionFinancePlan> {
  return requestWithParsedError(
    apiClient.post<SectionFinancePlan>('/section-finance-plans', payload),
  )
}

export async function archiveSectionFinancePlan(
  id: string,
): Promise<SectionFinancePlan> {
  return requestWithParsedError(
    apiClient.post<SectionFinancePlan>(`/section-finance-plans/${id}/archive`),
  )
}

export async function updateSectionFinancePlan(
  id: string,
  payload: UpdateSectionFinancePlanRequest,
): Promise<SectionFinancePlan> {
  return requestWithParsedError(
    apiClient.patch<SectionFinancePlan>(`/section-finance-plans/${id}`, payload),
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
