import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { plannedPaymentKeys } from '../../planned-payment/api/planned-payment.query'
import type { ApiError } from '../../../shared/types/api'
import type {
  ActualPayment,
  ActualPaymentListResponse,
  CreateActualPaymentRequest,
} from '../model/types'
import {
  archiveActualPayment,
  createActualPayment,
  listActualPayments,
  type ActualPaymentListQuery,
} from './actual-payment.api'

export const actualPaymentKeys = {
  all: ['actual-payments'] as const,
  lists: () => [...actualPaymentKeys.all, 'list'] as const,
  list: (query: ActualPaymentListQuery = {}) =>
    [...actualPaymentKeys.lists(), normalizeActualPaymentListQuery(query)] as const,
}

export function useActualPayments(query: ActualPaymentListQuery = {}) {
  const normalizedQuery = normalizeActualPaymentListQuery(query)

  return useQuery<ActualPaymentListResponse, ApiError>({
    enabled: Object.keys(normalizedQuery).length > 0,
    queryKey: actualPaymentKeys.list(normalizedQuery),
    queryFn: () => listActualPayments(normalizedQuery),
  })
}

export function useCreateActualPayment() {
  const queryClient = useQueryClient()

  return useMutation<ActualPayment, ApiError, CreateActualPaymentRequest>({
    mutationFn: (payload: CreateActualPaymentRequest) =>
      createActualPayment(payload),
    onSuccess: (actualPayment) => {
      void queryClient.invalidateQueries({
        queryKey: actualPaymentKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(actualPayment.projectFinanceId),
      })
    },
  })
}

export function useArchiveActualPayment() {
  const queryClient = useQueryClient()

  return useMutation<ActualPayment, ApiError, string>({
    mutationFn: (id: string) => archiveActualPayment(id),
    onSuccess: (actualPayment) => {
      void queryClient.invalidateQueries({
        queryKey: actualPaymentKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(actualPayment.projectFinanceId),
      })
    },
  })
}

function normalizeActualPaymentListQuery(query: ActualPaymentListQuery) {
  return {
    ...(query.plannedPaymentId
      ? { plannedPaymentId: query.plannedPaymentId }
      : {}),
    ...(query.projectFinanceId
      ? { projectFinanceId: query.projectFinanceId }
      : {}),
  }
}
