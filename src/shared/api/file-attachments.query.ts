import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { plannedCostKeys } from '../../entities/planned-cost/api/planned-cost.query'
import { plannedPaymentKeys } from '../../entities/planned-payment/api/planned-payment.query'
import type { ApiError } from '../types/api'
import type {
  FileAttachment,
  FileAttachmentListResponse,
  FileDownloadDescriptor,
} from '../types/file-attachment'
import {
  deleteFileAttachment,
  getFileDownloadDescriptor,
  listPlannedCostFiles,
  listPlannedPaymentFiles,
  uploadFileAttachment,
} from './file-attachments.api'

export interface PlannedPaymentFileOwner {
  type: 'planned-payment'
  id: string
  projectFinanceId: string
}

export interface PlannedCostFileOwner {
  type: 'planned-cost'
  id: string
  projectFinanceId: string
}

export type FileAttachmentOwner = PlannedPaymentFileOwner | PlannedCostFileOwner

export const fileAttachmentKeys = {
  all: ['file-attachments'] as const,
  plannedPayments: () => [...fileAttachmentKeys.all, 'planned-payments'] as const,
  plannedPayment: (plannedPaymentId: string) =>
    [...fileAttachmentKeys.plannedPayments(), plannedPaymentId] as const,
  plannedCosts: () => [...fileAttachmentKeys.all, 'planned-costs'] as const,
  plannedCost: (plannedCostId: string) =>
    [...fileAttachmentKeys.plannedCosts(), plannedCostId] as const,
}

export function usePlannedPaymentFiles(plannedPaymentId?: string) {
  return useQuery<FileAttachmentListResponse, ApiError>({
    enabled: Boolean(plannedPaymentId),
    queryKey: fileAttachmentKeys.plannedPayment(plannedPaymentId ?? ''),
    queryFn: () => listPlannedPaymentFiles(plannedPaymentId ?? ''),
  })
}

export function usePlannedCostFiles(plannedCostId?: string) {
  return useQuery<FileAttachmentListResponse, ApiError>({
    enabled: Boolean(plannedCostId),
    queryKey: fileAttachmentKeys.plannedCost(plannedCostId ?? ''),
    queryFn: () => listPlannedCostFiles(plannedCostId ?? ''),
  })
}

export function useUploadFileAttachment(owner: FileAttachmentOwner) {
  const queryClient = useQueryClient()

  return useMutation<FileAttachment, ApiError, File>({
    mutationFn: (file: File) =>
      uploadFileAttachment(
        owner.type === 'planned-payment'
          ? {
              file,
              plannedPaymentId: owner.id,
            }
          : {
              file,
              plannedCostId: owner.id,
            },
      ),
    onSuccess: () => {
      void invalidateOwnerQueries(queryClient, owner)
    },
  })
}

export function useDeleteFileAttachment(owner: FileAttachmentOwner) {
  const queryClient = useQueryClient()

  return useMutation<FileAttachment, ApiError, string>({
    mutationFn: (fileId: string) => deleteFileAttachment(fileId),
    onSuccess: () => {
      void invalidateOwnerQueries(queryClient, owner)
    },
  })
}

export function useFileDownloadDescriptor() {
  return useMutation<FileDownloadDescriptor, ApiError, string>({
    mutationFn: (fileId: string) => getFileDownloadDescriptor(fileId),
  })
}

function invalidateOwnerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  owner: FileAttachmentOwner,
) {
  if (owner.type === 'planned-payment') {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: fileAttachmentKeys.plannedPayment(owner.id),
      }),
      queryClient.invalidateQueries({
        queryKey: plannedPaymentKeys.list(owner.projectFinanceId),
      }),
    ])
  }

  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: fileAttachmentKeys.plannedCost(owner.id),
    }),
    queryClient.invalidateQueries({
      queryKey: plannedCostKeys.list(owner.projectFinanceId),
    }),
  ])
}
