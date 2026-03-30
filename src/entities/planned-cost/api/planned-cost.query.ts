import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  ChangePlannedCostStatusRequest,
  CreatePlannedCostRequest,
  PlannedCost,
  PlannedCostListResponse,
  UpdatePlannedCostRequest,
} from '../model/types'
import {
  archivePlannedCost,
  changePlannedCostStatus,
  createPlannedCost,
  listPlannedCosts,
  updatePlannedCost,
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

export function useUpdatePlannedCost(id: string) {
  const queryClient = useQueryClient()

  return useMutation<PlannedCost, ApiError, UpdatePlannedCostRequest>({
    mutationFn: (payload: UpdatePlannedCostRequest) => updatePlannedCost(id, payload),
    onSuccess: (plannedCost) => {
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(plannedCost.projectFinanceId),
      })
    },
  })
}

export function useChangePlannedCostStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation<PlannedCost, ApiError, ChangePlannedCostStatusRequest>({
    mutationFn: (payload: ChangePlannedCostStatusRequest) =>
      changePlannedCostStatus(id, payload),
    onSuccess: (plannedCost) => {
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(plannedCost.projectFinanceId),
      })
      void queryClient.invalidateQueries({
        queryKey: ['actual-costs', 'list'],
      })
    },
  })
}
