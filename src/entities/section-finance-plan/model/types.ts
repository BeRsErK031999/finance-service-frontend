export const SECTION_FINANCE_PLAN_STATES = [
  'ACTIVE',
  'ARCHIVED',
  'DELETED',
] as const

export type SectionFinancePlanState =
  (typeof SECTION_FINANCE_PLAN_STATES)[number]

export interface SectionFinancePlan {
  id: string
  projectFinanceId: string
  externalSectionId: string
  name: string
  description: string | null
  state: SectionFinancePlanState
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface SectionFinancePlanListResponse {
  items: SectionFinancePlan[]
}

export interface CreateSectionFinancePlanRequest {
  projectFinanceId: string
  externalSectionId: string
  name: string
  description?: string | null
}
