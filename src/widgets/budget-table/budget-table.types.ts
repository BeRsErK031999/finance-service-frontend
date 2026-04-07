import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'

export const BUDGET_TYPE_FILTER_VALUES = ['all', 'payment', 'cost'] as const
export type BudgetTypeFilterValue = (typeof BUDGET_TYPE_FILTER_VALUES)[number]

export const BUDGET_STATUS_FILTER_VALUES = [
  'all',
  'PLANNED',
  'EXPECTED',
  'RECEIVED',
  'ARCHIVED',
  'DELETED',
] as const
export type BudgetStatusFilterValue = (typeof BUDGET_STATUS_FILTER_VALUES)[number]

export type BudgetPlannedRecord = PlannedPayment | PlannedCost

export type BudgetDialogState =
  | {
      mode: 'create-planned-payment'
    }
  | {
      mode: 'create-planned-cost'
    }
  | {
      mode: 'edit-planned-payment'
      plannedPayment: PlannedPayment
    }
  | {
      mode: 'edit-planned-cost'
      plannedCost: PlannedCost
    }
  | {
      mode: 'create-actual-payment'
      plannedPayment: PlannedPayment
    }
  | {
      mode: 'create-actual-cost'
      plannedCost: PlannedCost
    }
  | {
      mode: 'rollback-payment'
      plannedPayment: PlannedPayment
    }
  | {
      mode: 'rollback-cost'
      plannedCost: PlannedCost
    }
  | null

export interface BudgetSummary {
  actualCount: number
  plannedCosts: number
  plannedPayments: number
  balance: number
}
