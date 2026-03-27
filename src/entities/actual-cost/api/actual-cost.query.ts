import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { plannedCostKeys } from '../../planned-cost/api/planned-cost.query'
import type { ApiError } from '../../../shared/types/api'
import type {
  ActualCost,
  ActualCostListResponse,
  CreateActualCostRequest,
} from '../model/types'
import {
  archiveActualCost,
  createActualCost,
  listActualCosts,
  type ActualCostListQuery,
} from './actual-cost.api'

export const actualCostKeys = {
  all: ['actual-costs'] as const,
  lists: () => [...actualCostKeys.all, 'list'] as const,
  list: (query: ActualCostListQuery = {}) =>
    [...actualCostKeys.lists(), normalizeActualCostListQuery(query)] as const,
}

export function useActualCosts(query: ActualCostListQuery = {}) {
  const normalizedQuery = normalizeActualCostListQuery(query)

  return useQuery<ActualCostListResponse, ApiError>({
    enabled: Object.keys(normalizedQuery).length > 0,
    queryKey: actualCostKeys.list(normalizedQuery),
    queryFn: () => listActualCosts(normalizedQuery),
  })
}

export function useCreateActualCost() {
  const queryClient = useQueryClient()

  return useMutation<ActualCost, ApiError, CreateActualCostRequest>({
    mutationFn: (payload: CreateActualCostRequest) => createActualCost(payload),
    onSuccess: (actualCost) => {
      void queryClient.invalidateQueries({
        queryKey: actualCostKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(actualCost.projectFinanceId),
      })
    },
  })
}

export function useArchiveActualCost() {
  const queryClient = useQueryClient()

  return useMutation<ActualCost, ApiError, string>({
    mutationFn: (id: string) => archiveActualCost(id),
    onSuccess: (actualCost) => {
      void queryClient.invalidateQueries({
        queryKey: actualCostKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: plannedCostKeys.list(actualCost.projectFinanceId),
      })
    },
  })
}

function normalizeActualCostListQuery(query: ActualCostListQuery) {
  return {
    ...(query.plannedCostId ? { plannedCostId: query.plannedCostId } : {}),
    ...(query.projectFinanceId ? { projectFinanceId: query.projectFinanceId } : {}),
  }
}
