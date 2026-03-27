export interface ActualPayment {
  id: string
  plannedPaymentId: string
  projectFinanceId: string
  amount: string
  actualDate: string
  comment: string | null
  state: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface ActualPaymentListResponse {
  items: ActualPayment[]
}

export interface CreateActualPaymentRequest {
  plannedPaymentId: string
  projectFinanceId: string
  amount: string
  actualDate: string
  comment: string | null
}
