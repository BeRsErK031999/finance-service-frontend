import type { ActualCost } from '../../entities/actual-cost/model/types'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import { parseApiError } from '../../shared/api/parse-api-error'
import type { BudgetRow } from '../../shared/lib/budget-table'
import {
  formatAmount,
  formatOptionalDate,
} from '../../shared/lib/format'
import type { ApiError } from '../../shared/types/api'
import type { FinanceStatusValue } from '../../shared/ui/FinanceStatusChip'
import type {
  BudgetPlannedRecord,
  BudgetStatusFilterValue,
  BudgetSummary,
  BudgetTypeFilterValue,
} from './budget-table.types'

export interface BudgetSectionFinancePlansQueryState {
  isPending: boolean
  isError: boolean
}

export function getEditDisabledReason({
  financeCapabilities,
  row,
  sectionFinancePlansQueryState,
}: {
  financeCapabilities: FinanceCapabilities
  row: BudgetRow
  sectionFinancePlansQueryState: BudgetSectionFinancePlansQueryState
}) {
  const canEdit =
    row.type === 'payment'
      ? financeCapabilities.canEditPlannedPayment
      : financeCapabilities.canEditPlannedCost

  if (!canEdit) {
    return financeCapabilities.readOnlyReason ?? 'Редактирование недоступно без прав EDIT.'
  }

  if (row.state !== 'ACTIVE') {
    return 'Редактировать можно только active planned-запись.'
  }

  if (row.hasActual) {
    return 'Пока по planned-записи есть active actual, редактирование запрещено.'
  }

  if (sectionFinancePlansQueryState.isPending) {
    return 'Ждём загрузку списка разделов для полной формы редактирования.'
  }

  if (sectionFinancePlansQueryState.isError) {
    return 'Редактирование временно недоступно, потому что не загрузились разделы.'
  }

  return null
}

export function getArchivePlannedDisabledReason({
  financeCapabilities,
  row,
}: {
  financeCapabilities: FinanceCapabilities
  row: BudgetRow
}) {
  const canArchive =
    row.type === 'payment'
      ? financeCapabilities.canArchivePlannedPayment
      : financeCapabilities.canArchivePlannedCost

  if (!canArchive) {
    return financeCapabilities.readOnlyReason ?? 'Архивация недоступна без прав EDIT.'
  }

  if (row.state !== 'ACTIVE') {
    return 'Запись уже находится вне active-состояния.'
  }

  if (row.hasActual) {
    return 'Нельзя архивировать planned-запись, пока по ней есть active actual. Сначала отправьте факт в архив.'
  }

  return null
}

export function getCreatePlannedDisabledReason({
  availableSectionFinancePlans,
  financeCapabilities,
  sectionFinancePlansQueryState,
  type,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  sectionFinancePlansQueryState: BudgetSectionFinancePlansQueryState
  type: 'payment' | 'cost'
}) {
  const canCreate =
    type === 'payment'
      ? financeCapabilities.canCreatePlannedPayment
      : financeCapabilities.canCreatePlannedCost
  const entityLabel = type === 'payment' ? 'доход' : 'расход'

  if (!canCreate) {
    return financeCapabilities.readOnlyReason ?? 'Создание planned-записи недоступно без прав EDIT.'
  }

  if (sectionFinancePlansQueryState.isPending) {
    return `Ждём загрузку разделов, чтобы привязать новый ${entityLabel}.`
  }

  if (sectionFinancePlansQueryState.isError) {
    return `Создание нового ${entityLabel} временно недоступно, потому что не загрузились разделы.`
  }

  if (availableSectionFinancePlans.length === 0) {
    return 'Сначала добавьте active раздел финансового плана, чтобы привязать planned-запись.'
  }

  return null
}

export function getCreateActualDisabledReason({
  financeCapabilities,
  row,
}: {
  financeCapabilities: FinanceCapabilities
  row: BudgetRow
}) {
  const canCreate =
    row.type === 'payment'
      ? financeCapabilities.canCreateActualPayment
      : financeCapabilities.canCreateActualCost

  if (!canCreate) {
    return financeCapabilities.readOnlyReason ?? 'Создание факта недоступно без прав EDIT.'
  }

  if (row.state !== 'ACTIVE') {
    return 'Добавить факт можно только для active planned-записи.'
  }

  if (row.hasActual) {
    return 'По этой planned-записи уже существует active actual.'
  }

  return null
}

export function getRollbackDisabledReason({
  financeCapabilities,
  row,
}: {
  financeCapabilities: FinanceCapabilities
  row: BudgetRow
}) {
  const canRollback =
    row.type === 'payment'
      ? financeCapabilities.canChangePlannedPaymentStatus
      : financeCapabilities.canChangePlannedCostStatus

  if (!canRollback) {
    return financeCapabilities.readOnlyReason ?? 'Rollback недоступен без прав EDIT.'
  }

  if (row.state !== 'ACTIVE') {
    return 'Rollback доступен только для active planned-записи.'
  }

  if (!row.hasActual) {
    return 'Rollback требует активный факт по этой записи.'
  }

  if (row.status !== 'RECEIVED') {
    return 'Rollback доступен только для строк со статусом RECEIVED.'
  }

  return null
}

export function getArchiveActualDisabledReason({
  financeCapabilities,
  row,
}: {
  financeCapabilities: FinanceCapabilities
  row: BudgetRow
}) {
  const canArchive =
    row.type === 'payment'
      ? financeCapabilities.canArchiveActualPayment
      : financeCapabilities.canArchiveActualCost

  if (!canArchive) {
    return financeCapabilities.readOnlyReason ?? 'Архивация факта недоступна без прав EDIT.'
  }

  if (!row.hasActual) {
    return 'Активный факт по этой записи отсутствует.'
  }

  return null
}

export function matchesRowFilters(
  row: BudgetRow,
  filters: {
    statusFilter: BudgetStatusFilterValue
    typeFilter: BudgetTypeFilterValue
  },
) {
  const matchesType =
    filters.typeFilter === 'all' || row.type === filters.typeFilter
  const matchesStatus =
    filters.statusFilter === 'all' ||
    row.status === filters.statusFilter ||
    row.state === filters.statusFilter

  return matchesType && matchesStatus
}

export function getBudgetTypeFilterLabel(value: BudgetTypeFilterValue) {
  if (value === 'all') {
    return 'Все типы'
  }

  return getBudgetTypeLabel(value)
}

export function getBudgetStatusFilterLabel(value: BudgetStatusFilterValue) {
  if (value === 'all') {
    return 'Все статусы'
  }

  if (value === 'ARCHIVED') {
    return 'В архиве'
  }

  if (value === 'DELETED') {
    return 'Удалено'
  }

  return getFinanceStatusLabel(value)
}

export function getSectionFinancePlanLabel(sectionFinancePlan: SectionFinancePlan) {
  return `${sectionFinancePlan.name} (${sectionFinancePlan.externalSectionId})`
}

export function getBudgetTypeLabel(value: 'payment' | 'cost') {
  return value === 'payment' ? 'Доход' : 'Расход'
}

export function getBudgetSummary(rows: BudgetRow[]): BudgetSummary {
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

      return summary
    },
    {
      actualCount: 0,
      plannedCosts: 0,
      plannedPayments: 0,
      balance: 0,
    },
  )
}

export function formatSignedAmount(value: number) {
  if (value === 0) {
    return formatAmount(value)
  }

  const prefix = value > 0 ? '+' : '-'

  return `${prefix}${formatAmount(Math.abs(value))}`
}

export function getPlannedDateLabel(plannedRecord: BudgetPlannedRecord | null) {
  if (!plannedRecord) {
    return 'Нет данных'
  }

  if (plannedRecord.conditionSource === 'EVENTS') {
    return 'По событиям'
  }

  return formatOptionalDate(plannedRecord.plannedDate, 'Дата не указана')
}

export function getEventCount(plannedRecord: BudgetPlannedRecord) {
  return plannedRecord.projectEventIds.length + plannedRecord.sectionEventIds.length
}

export function getBudgetRowKey(row: BudgetRow) {
  return `${row.type}:${row.id}`
}

export function getQueryError(error: unknown) {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    } satisfies ApiError
  }

  return null
}

export function createPlannedPaymentById(plannedPayments: PlannedPayment[]) {
  return new Map(
    plannedPayments.map((plannedPayment) => [plannedPayment.id, plannedPayment] as const),
  )
}

export function createPlannedCostById(plannedCosts: PlannedCost[]) {
  return new Map(
    plannedCosts.map((plannedCost) => [plannedCost.id, plannedCost] as const),
  )
}

export function createActiveActualPaymentByPlannedPaymentId(actualPayments: ActualPayment[]) {
  const actualPaymentByPlannedPaymentId = new Map<string, ActualPayment>()

  for (const actualPayment of actualPayments) {
    if (
      actualPayment.state === 'ACTIVE' &&
      !actualPaymentByPlannedPaymentId.has(actualPayment.plannedPaymentId)
    ) {
      actualPaymentByPlannedPaymentId.set(actualPayment.plannedPaymentId, actualPayment)
    }
  }

  return actualPaymentByPlannedPaymentId
}

export function createActiveActualCostByPlannedCostId(actualCosts: ActualCost[]) {
  const actualCostByPlannedCostId = new Map<string, ActualCost>()

  for (const actualCost of actualCosts) {
    if (actualCost.state === 'ACTIVE' && !actualCostByPlannedCostId.has(actualCost.plannedCostId)) {
      actualCostByPlannedCostId.set(actualCost.plannedCostId, actualCost)
    }
  }

  return actualCostByPlannedCostId
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

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  return parseApiError(error)
}

function getFinanceStatusLabel(
  value: Extract<BudgetStatusFilterValue, 'PLANNED' | 'EXPECTED' | 'RECEIVED'>,
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

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return typeof (error as { message?: unknown }).message === 'string'
}
