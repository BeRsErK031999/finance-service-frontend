import type { ActualCost } from '../../entities/actual-cost/model/types'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { buildBudgetRows } from '../../shared/lib/budget-table'
import {
  formatAmount,
  formatOptionalDate,
} from '../../shared/lib/format'
import type { FinanceStatusValue } from '../../shared/ui/FinanceStatusChip'

export const BUDGETING_TYPE_FILTER_VALUES = ['all', 'payment', 'cost'] as const
export type BudgetingTypeFilterValue = (typeof BUDGETING_TYPE_FILTER_VALUES)[number]

export const BUDGETING_STATUS_FILTER_VALUES = [
  'all',
  'PLANNED',
  'EXPECTED',
  'RECEIVED',
  'CANCELED',
  'ARCHIVED',
  'DELETED',
] as const
export type BudgetingStatusFilterValue = (typeof BUDGETING_STATUS_FILTER_VALUES)[number]

export const NOT_IN_SERVICE_LABEL = 'Нет в сервисе'

export interface BudgetingOverviewRow {
  actualAmount: number | null
  actualComment: string | null
  actualDate: string | null
  amount: number
  conditionSource: 'DATE' | 'EVENTS'
  eventCount: number
  hasActual: boolean
  id: string
  key: string
  name: string
  plannedDate: string | null
  projectFinanceId: string
  projectFinanceName: string
  projectExternalId: string
  state: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  status: string
  type: 'payment' | 'cost'
}

export interface BudgetingOverviewSummary {
  actualCount: number
  balance: number
  plannedCosts: number
  plannedPayments: number
  projectCount: number
  rowCount: number
}

export function buildBudgetingOverviewRows({
  actualCosts,
  actualPayments,
  plannedCosts,
  plannedPayments,
  projectFinances,
}: {
  actualCosts: ActualCost[]
  actualPayments: ActualPayment[]
  plannedCosts: PlannedCost[]
  plannedPayments: PlannedPayment[]
  projectFinances: ProjectFinance[]
}) {
  const projectFinanceById = new Map(
    projectFinances.map((projectFinance) => [projectFinance.id, projectFinance] as const),
  )
  const plannedPaymentById = new Map(
    plannedPayments.map((plannedPayment) => [plannedPayment.id, plannedPayment] as const),
  )
  const plannedCostById = new Map(
    plannedCosts.map((plannedCost) => [plannedCost.id, plannedCost] as const),
  )

  return buildBudgetRows({
    actualCosts,
    actualPayments,
    plannedCosts,
    plannedPayments,
  })
    .map<BudgetingOverviewRow | null>((budgetRow) => {
      const plannedRecord =
        budgetRow.type === 'payment'
          ? plannedPaymentById.get(budgetRow.id) ?? null
          : plannedCostById.get(budgetRow.id) ?? null

      if (!plannedRecord) {
        return null
      }

      const projectFinance = projectFinanceById.get(plannedRecord.projectFinanceId) ?? null

      return {
        actualAmount: budgetRow.actualAmount,
        actualComment: budgetRow.actualComment,
        actualDate: budgetRow.actualDate,
        amount: budgetRow.amount,
        conditionSource: plannedRecord.conditionSource,
        eventCount: plannedRecord.projectEventIds.length + plannedRecord.sectionEventIds.length,
        hasActual: budgetRow.hasActual,
        id: budgetRow.id,
        key: `${budgetRow.type}:${budgetRow.id}`,
        name: budgetRow.name,
        plannedDate: budgetRow.plannedDate,
        projectFinanceId: plannedRecord.projectFinanceId,
        projectFinanceName: projectFinance?.name ?? 'Проект недоступен',
        projectExternalId: projectFinance?.externalProjectId ?? 'Нет данных',
        state: budgetRow.state,
        status: budgetRow.status,
        type: budgetRow.type,
      }
    })
    .filter((row): row is BudgetingOverviewRow => row !== null)
}

export function matchesBudgetingOverviewRow(
  row: BudgetingOverviewRow,
  filters: {
    search: string
    statusFilter: BudgetingStatusFilterValue
    typeFilter: BudgetingTypeFilterValue
  },
) {
  const normalizedSearch = filters.search.trim().toLowerCase()
  const matchesSearch =
    normalizedSearch.length === 0 ||
    row.projectFinanceName.toLowerCase().includes(normalizedSearch) ||
    row.projectExternalId.toLowerCase().includes(normalizedSearch) ||
    row.name.toLowerCase().includes(normalizedSearch)
  const matchesType =
    filters.typeFilter === 'all' || row.type === filters.typeFilter
  const matchesStatus =
    filters.statusFilter === 'all' ||
    row.status === filters.statusFilter ||
    row.state === filters.statusFilter

  return matchesSearch && matchesType && matchesStatus
}

export function getBudgetingSummary(
  rows: BudgetingOverviewRow[],
  projectCount: number,
): BudgetingOverviewSummary {
  return rows.reduce(
    (summary, row) => {
      if (row.type === 'payment') {
        summary.plannedPayments += row.amount
      } else {
        summary.plannedCosts += row.amount
      }

      if (row.hasActual) {
        summary.actualCount += 1
      }

      summary.balance = summary.plannedPayments - summary.plannedCosts
      summary.rowCount += 1

      return summary
    },
    {
      actualCount: 0,
      balance: 0,
      plannedCosts: 0,
      plannedPayments: 0,
      projectCount,
      rowCount: 0,
    },
  )
}

export function getBudgetTypeLabel(value: 'payment' | 'cost') {
  return value === 'payment' ? 'Доход' : 'Расход'
}

export function getBudgetingTypeFilterLabel(value: BudgetingTypeFilterValue) {
  if (value === 'all') {
    return 'Все типы'
  }

  return getBudgetTypeLabel(value)
}

export function getBudgetingStatusFilterLabel(value: BudgetingStatusFilterValue) {
  if (value === 'all') {
    return 'Все статусы'
  }

  if (value === 'ARCHIVED') {
    return 'В архиве'
  }

  if (value === 'DELETED') {
    return 'Удалено'
  }

  if (value === 'CANCELED') {
    return 'Отменено'
  }

  return getFinanceStatusLabel(value)
}

export function getBudgetingPlannedDateLabel(row: BudgetingOverviewRow) {
  if (row.conditionSource === 'EVENTS') {
    return 'По событиям'
  }

  return formatOptionalDate(row.plannedDate, 'Дата не указана')
}

export function formatSignedAmount(value: number) {
  if (value === 0) {
    return formatAmount(value)
  }

  const prefix = value > 0 ? '+' : '-'

  return `${prefix}${formatAmount(Math.abs(value))}`
}

export function toFinanceStatusValue(value: string): FinanceStatusValue {
  if (
    value === 'PLANNED' ||
    value === 'EXPECTED' ||
    value === 'RECEIVED' ||
    value === 'CANCELED'
  ) {
    return value
  }

  return 'PLANNED'
}

export function getPrimaryStatusChipVariant(value: string): 'filled' | 'outlined' {
  if (value === 'RECEIVED') {
    return 'filled'
  }

  return 'outlined'
}

function getFinanceStatusLabel(
  value: Extract<
    BudgetingStatusFilterValue,
    'PLANNED' | 'EXPECTED' | 'RECEIVED'
  >,
): string {
  if (value === 'PLANNED') {
    return 'Запланировано'
  }

  if (value === 'EXPECTED') {
    return 'Ожидается'
  }

  if (value === 'RECEIVED') {
    return 'Получено'
  }

  return 'Запланировано'
}
