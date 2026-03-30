import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { projectFinanceQueryKeys } from '../../project-finance/api/project-finance.query'
import type { ApiError } from '../../../shared/types/api'
import type {
  CreateProjectFinanceMemberRequest,
  ProjectFinanceAvailableMemberListResponse,
  ProjectFinanceMember,
  ProjectFinanceMemberListResponse,
  UpdateProjectFinanceMemberAccessRequest,
} from '../model/types'
import {
  createProjectFinanceMember,
  getProjectFinanceAvailableMembers,
  getProjectFinanceMembers,
  removeProjectFinanceMember,
  updateProjectFinanceMemberAccess,
} from './project-finance-member.api'

export const projectFinanceMemberQueryKeys = {
  all: ['project-finance-members'] as const,
  available: (projectFinanceId: string) =>
    [...projectFinanceMemberQueryKeys.all, 'available', projectFinanceId] as const,
  list: (projectFinanceId: string) =>
    [...projectFinanceMemberQueryKeys.all, 'list', projectFinanceId] as const,
}

export function useProjectFinanceAvailableMembersQuery(projectFinanceId?: string) {
  return useQuery<ProjectFinanceAvailableMemberListResponse, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: projectFinanceMemberQueryKeys.available(projectFinanceId ?? ''),
    queryFn: () => getProjectFinanceAvailableMembers(projectFinanceId ?? ''),
  })
}

export function useProjectFinanceMembersQuery(projectFinanceId?: string) {
  return useQuery<ProjectFinanceMemberListResponse, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: projectFinanceMemberQueryKeys.list(projectFinanceId ?? ''),
    queryFn: () => getProjectFinanceMembers(projectFinanceId ?? ''),
  })
}

export function useCreateProjectFinanceMemberMutation(projectFinanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<ProjectFinanceMember, ApiError, CreateProjectFinanceMemberRequest>({
    mutationFn: (payload: CreateProjectFinanceMemberRequest) =>
      createProjectFinanceMember(projectFinanceId, payload),
    onSuccess: () => {
      void invalidateProjectFinanceMemberQueries(queryClient, projectFinanceId)
    },
  })
}

export function useUpdateProjectFinanceMemberAccessMutation(
  projectFinanceId: string,
) {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectFinanceMember,
    ApiError,
    {
      memberId: string
      payload: UpdateProjectFinanceMemberAccessRequest
    }
  >({
    mutationFn: ({ memberId, payload }) =>
      updateProjectFinanceMemberAccess(projectFinanceId, memberId, payload),
    onSuccess: () => {
      void invalidateProjectFinanceMemberQueries(queryClient, projectFinanceId)
    },
  })
}

export function useRemoveProjectFinanceMemberMutation(projectFinanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<ProjectFinanceMember, ApiError, string>({
    mutationFn: (memberId: string) =>
      removeProjectFinanceMember(projectFinanceId, memberId),
    onSuccess: () => {
      void invalidateProjectFinanceMemberQueries(queryClient, projectFinanceId)
    },
  })
}

async function invalidateProjectFinanceMemberQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectFinanceId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: projectFinanceMemberQueryKeys.available(projectFinanceId),
    }),
    queryClient.invalidateQueries({
      queryKey: projectFinanceMemberQueryKeys.list(projectFinanceId),
    }),
    queryClient.invalidateQueries({
      queryKey: projectFinanceQueryKeys.access(projectFinanceId),
    }),
    queryClient.invalidateQueries({
      queryKey: projectFinanceQueryKeys.globalAccess(),
    }),
  ])
}
