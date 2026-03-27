import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  CreatePlannedPaymentRequest,
  PlannedPayment,
  PlannedPaymentListResponse,
} from '../model/types'
import {
  archivePlannedPayment,
  createPlannedPayment,
  listPlannedPayments,
} from './planned-payment.api'

export const plannedPaymentKeys = {
  all: ['planned-payments'] as const,
  lists: () => [...plannedPaymentKeys.all, 'list'] as const,
  list: (projectFinanceId: string) =>
    [...plannedPaymentKeys.lists(), projectFinanceId] as const,
}

export function usePlannedPayments(projectFinanceId?: string) {
  return useQuery<PlannedPaymentListResponse, ApiError>({
    enabled: Boolean(projectFinanceId),
    queryKey: plannedPaymentKeys.list(projectFinanceId ?? ''),
    queryFn: () =>
      listPlannedPayments({
        projectFinanceId: projectFinanceId ?? '',
      }),
  })
}

export function useCreatePlannedPayment() {
  const queryClient = useQueryClient()

  return useMutation<PlannedPayment, ApiError, CreatePlannedPaymentRequest>({
    mutationFn: (payload: CreatePlannedPaymentRequest) =>
      createPlannedPayment(payload),
    onSuccess: (plannedPayment) => {
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(plannedPayment.projectFinanceId),
      })
    },
  })
}

export function useArchivePlannedPayment() {
  const queryClient = useQueryClient()

  return useMutation<PlannedPayment, ApiError, string>({
    mutationFn: (id: string) => archivePlannedPayment(id),
    onSuccess: (plannedPayment) => {
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(plannedPayment.projectFinanceId),
      })
    },
  })
}
