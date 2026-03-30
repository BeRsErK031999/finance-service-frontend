import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiError } from '../../../shared/types/api'
import type {
  ChangePlannedPaymentStatusRequest,
  CreatePlannedPaymentRequest,
  PlannedPayment,
  PlannedPaymentListResponse,
  UpdatePlannedPaymentRequest,
} from '../model/types'
import {
  archivePlannedPayment,
  changePlannedPaymentStatus,
  createPlannedPayment,
  listPlannedPayments,
  updatePlannedPayment,
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

export function useUpdatePlannedPayment(id: string) {
  const queryClient = useQueryClient()

  return useMutation<PlannedPayment, ApiError, UpdatePlannedPaymentRequest>({
    mutationFn: (payload: UpdatePlannedPaymentRequest) =>
      updatePlannedPayment(id, payload),
    onSuccess: (plannedPayment) => {
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(plannedPayment.projectFinanceId),
      })
    },
  })
}

export function useChangePlannedPaymentStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation<PlannedPayment, ApiError, ChangePlannedPaymentStatusRequest>({
    mutationFn: (payload: ChangePlannedPaymentStatusRequest) =>
      changePlannedPaymentStatus(id, payload),
    onSuccess: (plannedPayment) => {
      void queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(plannedPayment.projectFinanceId),
      })
      void queryClient.invalidateQueries({
        queryKey: ['actual-payments', 'list'],
      })
    },
  })
}
