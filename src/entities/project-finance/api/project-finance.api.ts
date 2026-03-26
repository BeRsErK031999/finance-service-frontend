import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  CreateProjectFinanceRequest,
  ProjectFinance,
  ProjectFinanceListQuery,
  ProjectFinanceListResponse,
} from '../model/types'

export async function listProjectFinances(
  query: ProjectFinanceListQuery = {},
): Promise<ProjectFinanceListResponse> {
  return requestWithParsedError(
    apiClient.get<ProjectFinanceListResponse>('/project-finances', {
      params: query,
    }),
  )
}

export async function getProjectFinanceById(
  projectFinanceId: string,
): Promise<ProjectFinance> {
  return requestWithParsedError(
    apiClient.get<ProjectFinance>(`/project-finances/${projectFinanceId}`),
  )
}

export async function createProjectFinance(
  payload: CreateProjectFinanceRequest,
): Promise<ProjectFinance> {
  return requestWithParsedError(
    apiClient.post<ProjectFinance>('/project-finances', payload),
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
