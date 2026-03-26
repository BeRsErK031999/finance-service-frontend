import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  CreateSectionFinancePlanRequest,
  SectionFinancePlan,
  SectionFinancePlanListResponse,
} from '../model/types'
import {
  archiveSectionFinancePlan,
  createSectionFinancePlan,
  getSectionFinancePlans,
} from './section-finance-plan.api'

export const sectionFinancePlanKeys = {
  all: ['section-finance-plans'] as const,
  list: (projectFinanceId: string) =>
    [...sectionFinancePlanKeys.all, 'list', projectFinanceId] as const,
}

export function useSectionFinancePlans(projectFinanceId?: string) {
  return useQuery<SectionFinancePlanListResponse, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: sectionFinancePlanKeys.list(projectFinanceId ?? ''),
    queryFn: () => getSectionFinancePlans(projectFinanceId ?? ''),
  })
}

export function useCreateSectionFinancePlan() {
  const queryClient = useQueryClient()

  return useMutation<
    SectionFinancePlan,
    ApiError,
    CreateSectionFinancePlanRequest
  >({
    mutationFn: (payload: CreateSectionFinancePlanRequest) =>
      createSectionFinancePlan(payload),
    onSuccess: (sectionFinancePlan) => {
      void queryClient.invalidateQueries({
        queryKey: sectionFinancePlanKeys.list(sectionFinancePlan.projectFinanceId),
      })
    },
  })
}

export function useArchiveSectionFinancePlan() {
  const queryClient = useQueryClient()

  return useMutation<SectionFinancePlan, ApiError, string>({
    mutationFn: (id: string) => archiveSectionFinancePlan(id),
    onSuccess: (sectionFinancePlan) => {
      void queryClient.invalidateQueries({
        queryKey: sectionFinancePlanKeys.list(sectionFinancePlan.projectFinanceId),
      })
    },
  })
}
