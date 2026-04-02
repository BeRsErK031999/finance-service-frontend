export const FILE_ATTACHMENT_STATES = ['ACTIVE', 'DELETED'] as const

export type FileAttachmentState = (typeof FILE_ATTACHMENT_STATES)[number]

export interface FileAttachment {
  id: string
  plannedPaymentId: string | null
  plannedCostId: string | null
  fileName: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string
  comment: string | null
  order: number
  state: FileAttachmentState
  version: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FileAttachmentListResponse {
  items: FileAttachment[]
}

export interface FileDownloadDescriptor {
  url: string
}

export interface UploadFileAttachmentRequest {
  file: File
  plannedPaymentId?: string
  plannedCostId?: string
  comment?: string | null
}
