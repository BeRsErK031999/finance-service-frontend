export const PROJECT_FINANCE_STATES = [
  'ACTIVE',
  'ARCHIVED',
  'DELETED',
] as const

export type ProjectFinanceState = (typeof PROJECT_FINANCE_STATES)[number]

export interface ProjectFinance {
  id: string
  externalProjectId: string
  name: string
  description: string | null
  state: ProjectFinanceState
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface ProjectFinanceListResponse {
  items: ProjectFinance[]
}

export interface ProjectFinanceListQuery {
  externalProjectId?: string
}

export interface CreateProjectFinanceRequest {
  externalProjectId: string
  name: string
  description?: string | null
}

export interface UpdateProjectFinanceRequest {
  externalProjectId: string
  name: string
  description?: string | null
  version: number
}
