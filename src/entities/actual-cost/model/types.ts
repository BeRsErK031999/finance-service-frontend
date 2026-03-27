export interface ActualCost {
  id: string
  plannedCostId: string
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

export interface ActualCostListResponse {
  items: ActualCost[]
}

export interface CreateActualCostRequest {
  plannedCostId: string
  projectFinanceId: string
  amount: string
  actualDate: string
  comment: string | null
}
