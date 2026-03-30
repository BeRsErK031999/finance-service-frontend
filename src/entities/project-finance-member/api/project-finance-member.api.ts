import type { AxiosResponse } from 'axios'

import { apiClient } from '../../../shared/api/http-client'
import { parseApiError } from '../../../shared/api/parse-api-error'
import type {
  ProjectFinanceAvailableMemberListResponse,
  CreateProjectFinanceMemberRequest,
  ProjectFinanceMember,
  ProjectFinanceMemberListResponse,
  UpdateProjectFinanceMemberAccessRequest,
} from '../model/types'

export async function getProjectFinanceMembers(
  projectFinanceId: string,
): Promise<ProjectFinanceMemberListResponse> {
  return requestWithParsedError(
    apiClient.get<ProjectFinanceMemberListResponse>(
      `/project-finances/${projectFinanceId}/members`,
    ),
  )
}

export async function getProjectFinanceAvailableMembers(
  projectFinanceId: string,
): Promise<ProjectFinanceAvailableMemberListResponse> {
  return requestWithParsedError(
    apiClient.get<ProjectFinanceAvailableMemberListResponse>(
      `/project-finances/${projectFinanceId}/available-members`,
    ),
  )
}

export async function createProjectFinanceMember(
  projectFinanceId: string,
  payload: CreateProjectFinanceMemberRequest,
): Promise<ProjectFinanceMember> {
  return requestWithParsedError(
    apiClient.post<ProjectFinanceMember>(
      `/project-finances/${projectFinanceId}/members`,
      payload,
    ),
  )
}

export async function updateProjectFinanceMemberAccess(
  projectFinanceId: string,
  memberId: string,
  payload: UpdateProjectFinanceMemberAccessRequest,
): Promise<ProjectFinanceMember> {
  return requestWithParsedError(
    apiClient.patch<ProjectFinanceMember>(
      `/project-finances/${projectFinanceId}/members/${memberId}`,
      payload,
    ),
  )
}

export async function removeProjectFinanceMember(
  projectFinanceId: string,
  memberId: string,
): Promise<ProjectFinanceMember> {
  return requestWithParsedError(
    apiClient.delete<ProjectFinanceMember>(
      `/project-finances/${projectFinanceId}/members/${memberId}`,
    ),
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
