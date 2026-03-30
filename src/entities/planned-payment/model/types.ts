export const PLANNED_PAYMENT_CONDITION_SOURCES = [
  'DATE',
  'EVENTS',
] as const

export type PlannedPaymentConditionSource =
  (typeof PLANNED_PAYMENT_CONDITION_SOURCES)[number]

export const PLANNED_PAYMENT_STATUSES = [
  'PLANNED',
  'EXPECTED',
  'RECEIVED',
  'CANCELED',
] as const

export type PlannedPaymentStatus = (typeof PLANNED_PAYMENT_STATUSES)[number]

export const PLANNED_PAYMENT_STATUS_CHANGE_TARGETS = [
  'PLANNED',
  'EXPECTED',
] as const

export type PlannedPaymentStatusChangeTarget =
  (typeof PLANNED_PAYMENT_STATUS_CHANGE_TARGETS)[number]

export const PLANNED_PAYMENT_STATES = [
  'ACTIVE',
  'ARCHIVED',
  'DELETED',
] as const

export type PlannedPaymentState = (typeof PLANNED_PAYMENT_STATES)[number]

export interface PlannedPayment {
  id: string
  projectFinanceId: string
  name: string
  amount: string
  conditionSource: PlannedPaymentConditionSource
  plannedDate: string | null
  actualDate: string | null
  status: PlannedPaymentStatus
  state: PlannedPaymentState
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
  sectionFinancePlanIds: string[]
  projectEventIds: string[]
  sectionEventIds: string[]
}

export interface PlannedPaymentListResponse {
  items: PlannedPayment[]
}

export interface PlannedPaymentListQuery {
  projectFinanceId?: string
}

export interface CreatePlannedPaymentRequest {
  projectFinanceId: string
  name: string
  amount: string
  conditionSource: PlannedPaymentConditionSource
  plannedDate?: string | null
  sectionFinancePlanIds: string[]
  projectEventIds?: string[]
  sectionEventIds?: string[]
}

export interface UpdatePlannedPaymentRequest {
  name: string
  amount: string
  conditionSource: PlannedPaymentConditionSource
  plannedDate?: string | null
  sectionFinancePlanIds: string[]
  projectEventIds?: string[]
  sectionEventIds?: string[]
  version: number
}

export interface ChangePlannedPaymentStatusRequest {
  status: PlannedPaymentStatusChangeTarget
  version: number
}
