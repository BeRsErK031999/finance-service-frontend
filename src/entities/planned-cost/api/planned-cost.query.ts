import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  CreatePlannedCostRequest,
  PlannedCost,
  PlannedCostListResponse,
} from '../model/types'
import {
  archivePlannedCost,
  createPlannedCost,
  listPlannedCosts,
} from './planned-cost.api'

export const plannedCostKeys = {
  all: ['planned-costs'] as const,
  lists: () => [...plannedCostKeys.all, 'list'] as const,
  list: (projectFinanceId: string) =>
    [...plannedCostKeys.lists(), projectFinanceId] as const,
}

export function usePlannedCosts(projectFinanceId?: string) {
  return useQuery<PlannedCostListResponse, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: plannedCostKeys.list(projectFinanceId ?? ''),
    queryFn: () =>
      listPlannedCosts({
        projectFinanceId: projectFinanceId ?? '',
      }),
  })
}

export function useCreatePlannedCost() {
  const queryClient = useQueryClient()

  return useMutation<PlannedCost, ApiError, CreatePlannedCostRequest>({
    mutationFn: (payload: CreatePlannedCostRequest) => createPlannedCost(payload),
    onSuccess: (plannedCost) => {
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(plannedCost.projectFinanceId),
      })
    },
  })
}

export function useArchivePlannedCost() {
  const queryClient = useQueryClient()

  return useMutation<PlannedCost, ApiError, string>({
    mutationFn: (id: string) => archivePlannedCost(id),
    onSuccess: (plannedCost) => {
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(plannedCost.projectFinanceId),
      })
    },
  })
}
