import type { AxiosResponse } from 'axios'

import { apiClient } from './http-client'
import { parseApiError } from './parse-api-error'
import type {
  FileAttachment,
  FileAttachmentListResponse,
  FileDownloadDescriptor,
  UploadFileAttachmentRequest,
} from '../types/file-attachment'

export async function listPlannedPaymentFiles(
  plannedPaymentId: string,
): Promise<FileAttachmentListResponse> {
  return requestWithParsedError(
    apiClient.get<FileAttachmentListResponse>(
      `/planned-payments/${plannedPaymentId}/files`,
    ),
  )
}

export async function listPlannedCostFiles(
  plannedCostId: string,
): Promise<FileAttachmentListResponse> {
  return requestWithParsedError(
    apiClient.get<FileAttachmentListResponse>(`/planned-costs/${plannedCostId}/files`),
  )
}

export async function uploadFileAttachment(
  payload: UploadFileAttachmentRequest,
): Promise<FileAttachment> {
  const formData = new FormData()

  formData.append('file', payload.file)

  if (payload.plannedPaymentId !== undefined) {
    formData.append('plannedPaymentId', payload.plannedPaymentId)
  }

  if (payload.plannedCostId !== undefined) {
    formData.append('plannedCostId', payload.plannedCostId)
  }

  if (payload.comment !== undefined) {
    formData.append('comment', payload.comment ?? '')
  }

  return requestWithParsedError(apiClient.post<FileAttachment>('/files', formData))
}

export async function deleteFileAttachment(id: string): Promise<FileAttachment> {
  return requestWithParsedError(apiClient.delete<FileAttachment>(`/files/${id}`))
}

export async function getFileDownloadDescriptor(
  id: string,
): Promise<FileDownloadDescriptor> {
  return requestWithParsedError(
    apiClient.get<FileDownloadDescriptor>(`/files/${id}/download`),
  )
}

async function requestWithParsedError<T>(
  request: Promise<AxiosResponse<T>>,
): Promise<T> {
  try {
    const response = await request

    return response.data
  } catch (error) {
    throw parseApiError(error)
  }
}
