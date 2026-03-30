export const PLANNED_COST_CONDITION_SOURCES = ['DATE', 'EVENTS'] as const

export type PlannedCostConditionSource =
  (typeof PLANNED_COST_CONDITION_SOURCES)[number]

export const PLANNED_COST_STATUSES = [
  'PLANNED',
  'EXPECTED',
  'RECEIVED',
  'CANCELED',
] as const

export type PlannedCostStatus = (typeof PLANNED_COST_STATUSES)[number]

export const PLANNED_COST_STATUS_CHANGE_TARGETS = [
  'PLANNED',
  'EXPECTED',
] as const

export type PlannedCostStatusChangeTarget =
  (typeof PLANNED_COST_STATUS_CHANGE_TARGETS)[number]

export const PLANNED_COST_STATES = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const

export type PlannedCostState = (typeof PLANNED_COST_STATES)[number]

export interface PlannedCost {
  id: string
  projectFinanceId: string
  name: string
  amount: string
  conditionSource: PlannedCostConditionSource
  plannedDate: string | null
  actualDate: string | null
  status: PlannedCostStatus
  state: PlannedCostState
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
  sectionFinancePlanIds: string[]
  projectEventIds: string[]
  sectionEventIds: string[]
}

export interface PlannedCostListResponse {
  items: PlannedCost[]
}

export interface PlannedCostListQuery {
  projectFinanceId?: string
}

export interface CreatePlannedCostRequest {
  projectFinanceId: string
  name: string
  amount: string
  conditionSource: PlannedCostConditionSource
  plannedDate?: string | null
  sectionFinancePlanIds: string[]
  projectEventIds?: string[]
  sectionEventIds?: string[]
}

export interface UpdatePlannedCostRequest {
  name: string
  amount: string
  conditionSource: PlannedCostConditionSource
  plannedDate?: string | null
  sectionFinancePlanIds: string[]
  projectEventIds?: string[]
  sectionEventIds?: string[]
  version: number
}

export interface ChangePlannedCostStatusRequest {
  status: PlannedCostStatusChangeTarget
  version: number
}
