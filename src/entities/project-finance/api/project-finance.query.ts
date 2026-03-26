import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  CreateProjectFinanceRequest,
  ProjectFinance,
  ProjectFinanceListQuery,
  ProjectFinanceListResponse,
} from '../model/types'
import {
  createProjectFinance,
  getProjectFinanceById,
  listProjectFinances,
} from './project-finance.api'

export const projectFinanceQueryKeys = {
  all: ['project-finances'] as const,
  lists: () => [...projectFinanceQueryKeys.all, 'list'] as const,
  list: (query: ProjectFinanceListQuery = {}) =>
    [...projectFinanceQueryKeys.lists(), query] as const,
  details: () => [...projectFinanceQueryKeys.all, 'detail'] as const,
  detail: (projectFinanceId: string) =>
    [...projectFinanceQueryKeys.details(), projectFinanceId] as const,
}

export function useProjectFinanceListQuery(query: ProjectFinanceListQuery = {}) {
  return useQuery<ProjectFinanceListResponse, ApiError>({
    queryKey: projectFinanceQueryKeys.list(query),
    queryFn: () => listProjectFinances(query),
  })
}

export function useProjectFinanceDetailsQuery(projectFinanceId?: string) {
  return useQuery<ProjectFinance, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: projectFinanceQueryKeys.detail(projectFinanceId ?? ''),
    queryFn: () => getProjectFinanceById(projectFinanceId ?? ''),
  })
}

export function useCreateProjectFinanceMutation() {
  const queryClient = useQueryClient()

  return useMutation<ProjectFinance, ApiError, CreateProjectFinanceRequest>({
    mutationFn: (payload: CreateProjectFinanceRequest) =>
      createProjectFinance(payload),
    onSuccess: (projectFinance) => {
      queryClient.setQueryData(
        projectFinanceQueryKeys.detail(projectFinance.id),
        projectFinance,
      )
      void queryClient.invalidateQueries({
        queryKey: projectFinanceQueryKeys.lists(),
      })
    },
  })
}
