import type { ActualCost } from '../../entities/actual-cost/model/types'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'

export type BudgetRowType = 'payment' | 'cost'

export interface BudgetRow {
  id: string
  type: BudgetRowType
  name: string
  amount: number
  plannedDate: string | null
  status: string
  state: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  hasActual: boolean
  actualAmount: number | null
  actualDate: string | null
  actualComment: string | null
  sectionIds: string[]
  version: number
}

interface BuildBudgetRowsInput {
  actualCosts: ActualCost[]
  actualPayments: ActualPayment[]
  plannedCosts: PlannedCost[]
  plannedPayments: PlannedPayment[]
}

export function buildBudgetRows({
  actualCosts,
  actualPayments,
  plannedCosts,
  plannedPayments,
}: BuildBudgetRowsInput): BudgetRow[] {
  const activeActualPaymentByPlannedPaymentId =
    getActiveActualPaymentByPlannedPaymentId(actualPayments)
  const activeActualCostByPlannedCostId = getActiveActualCostByPlannedCostId(actualCosts)

  return [
    ...plannedPayments.map((plannedPayment) =>
      mapPlannedPaymentToBudgetRow(
        plannedPayment,
        activeActualPaymentByPlannedPaymentId.get(plannedPayment.id) ?? null,
      ),
    ),
    ...plannedCosts.map((plannedCost) =>
      mapPlannedCostToBudgetRow(
        plannedCost,
        activeActualCostByPlannedCostId.get(plannedCost.id) ?? null,
      ),
    ),
  ].sort(compareBudgetRows)
}

function getActiveActualPaymentByPlannedPaymentId(actualPayments: ActualPayment[]) {
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

function getActiveActualCostByPlannedCostId(actualCosts: ActualCost[]) {
  const actualCostByPlannedCostId = new Map<string, ActualCost>()

  for (const actualCost of actualCosts) {
    if (actualCost.state === 'ACTIVE' && !actualCostByPlannedCostId.has(actualCost.plannedCostId)) {
      actualCostByPlannedCostId.set(actualCost.plannedCostId, actualCost)
    }
  }

  return actualCostByPlannedCostId
}

function mapPlannedPaymentToBudgetRow(
  plannedPayment: PlannedPayment,
  actualPayment: ActualPayment | null,
): BudgetRow {
  return {
    id: plannedPayment.id,
    type: 'payment',
    name: plannedPayment.name,
    amount: toNumericAmount(plannedPayment.amount),
    plannedDate: plannedPayment.plannedDate,
    status: plannedPayment.status,
    state: plannedPayment.state,
    hasActual: actualPayment !== null,
    actualAmount: actualPayment ? toNumericAmount(actualPayment.amount) : null,
    actualDate: actualPayment?.actualDate ?? null,
    actualComment: actualPayment?.comment ?? null,
    sectionIds: [...plannedPayment.sectionFinancePlanIds],
    version: plannedPayment.version,
  }
}

function mapPlannedCostToBudgetRow(plannedCost: PlannedCost, actualCost: ActualCost | null): BudgetRow {
  return {
    id: plannedCost.id,
    type: 'cost',
    name: plannedCost.name,
    amount: toNumericAmount(plannedCost.amount),
    plannedDate: plannedCost.plannedDate,
    status: plannedCost.status,
    state: plannedCost.state,
    hasActual: actualCost !== null,
    actualAmount: actualCost ? toNumericAmount(actualCost.amount) : null,
    actualDate: actualCost?.actualDate ?? null,
    actualComment: actualCost?.comment ?? null,
    sectionIds: [...plannedCost.sectionFinancePlanIds],
    version: plannedCost.version,
  }
}

function compareBudgetRows(left: BudgetRow, right: BudgetRow) {
  const leftTime = getComparableDateValue(left.plannedDate)
  const rightTime = getComparableDateValue(right.plannedDate)

  if (leftTime !== rightTime) {
    return leftTime - rightTime
  }

  if (left.type !== right.type) {
    return left.type.localeCompare(right.type)
  }

  return left.name.localeCompare(right.name)
}

function getComparableDateValue(value: string | null) {
  if (value === null) {
    return Number.POSITIVE_INFINITY
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
}

function toNumericAmount(value: string) {
  const amount = Number(value)

  return Number.isFinite(amount) ? amount : 0
}
