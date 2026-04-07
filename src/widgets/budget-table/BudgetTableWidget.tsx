import { useState } from 'react'

import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Alert,
  Button,
  Stack,
} from '@mui/material'

import {
  useActualCosts,
  useArchiveActualCost,
} from '../../entities/actual-cost/api/actual-cost.query'
import {
  useActualPayments,
  useArchiveActualPayment,
} from '../../entities/actual-payment/api/actual-payment.query'
import {
  useArchivePlannedCost,
  usePlannedCosts,
} from '../../entities/planned-cost/api/planned-cost.query'
import {
  useArchivePlannedPayment,
  usePlannedPayments,
} from '../../entities/planned-payment/api/planned-payment.query'
import { useSectionFinancePlans } from '../../entities/section-finance-plan/api/section-finance-plan.query'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import {
  buildBudgetRows,
  type BudgetRow,
} from '../../shared/lib/budget-table'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'
import { BudgetActionDialog } from './BudgetActionDialog'
import {
  createActiveActualCostByPlannedCostId,
  createActiveActualPaymentByPlannedPaymentId,
  createPlannedCostById,
  createPlannedPaymentById,
  getBudgetSummary,
  getCreatePlannedDisabledReason,
  getQueryError,
  matchesRowFilters,
  toApiError,
} from './budget-table.helpers'
import { BudgetTableGrid } from './BudgetTableGrid'
import { BudgetTableToolbar } from './BudgetTableToolbar'
import type {
  BudgetDialogState,
  BudgetStatusFilterValue,
  BudgetTypeFilterValue,
} from './budget-table.types'

interface BudgetTableWidgetProps {
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
}

export function BudgetTableWidget({
  financeCapabilities,
  projectFinanceId,
}: BudgetTableWidgetProps) {
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const plannedCostsQuery = usePlannedCosts(projectFinanceId)
  const actualPaymentsQuery = useActualPayments({
    projectFinanceId,
  })
  const actualCostsQuery = useActualCosts({
    projectFinanceId,
  })
  const sectionFinancePlansQuery = useSectionFinancePlans(projectFinanceId)
  const archivePlannedPaymentMutation = useArchivePlannedPayment()
  const archivePlannedCostMutation = useArchivePlannedCost()
  const archiveActualPaymentMutation = useArchiveActualPayment()
  const archiveActualCostMutation = useArchiveActualCost()
  const [typeFilter, setTypeFilter] = useState<BudgetTypeFilterValue>('all')
  const [statusFilter, setStatusFilter] = useState<BudgetStatusFilterValue>('all')
  const [dialogState, setDialogState] = useState<BudgetDialogState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null)

  const isPrimaryDataPending =
    plannedPaymentsQuery.isPending ||
    plannedCostsQuery.isPending ||
    actualPaymentsQuery.isPending ||
    actualCostsQuery.isPending
  const primaryError =
    getQueryError(plannedPaymentsQuery.error) ??
    getQueryError(plannedCostsQuery.error) ??
    getQueryError(actualPaymentsQuery.error) ??
    getQueryError(actualCostsQuery.error)
  const plannedPayments = plannedPaymentsQuery.data?.items ?? []
  const plannedCosts = plannedCostsQuery.data?.items ?? []
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const actualCosts = actualCostsQuery.data?.items ?? []
  const availableSectionFinancePlans = sectionFinancePlansQuery.data?.items ?? []
  const activeSectionFinancePlans = availableSectionFinancePlans.filter(
    (sectionFinancePlan) => sectionFinancePlan.state === 'ACTIVE',
  )
  const rows = buildBudgetRows({
    actualCosts,
    actualPayments,
    plannedCosts,
    plannedPayments,
  })
  const filteredRows = rows.filter((row) =>
    matchesRowFilters(row, {
      statusFilter,
      typeFilter,
    }),
  )
  const plannedPaymentById = createPlannedPaymentById(plannedPayments)
  const plannedCostById = createPlannedCostById(plannedCosts)
  const activeActualPaymentByPlannedPaymentId =
    createActiveActualPaymentByPlannedPaymentId(actualPayments)
  const activeActualCostByPlannedCostId = createActiveActualCostByPlannedCostId(actualCosts)
  const createPlannedPaymentDisabledReason = getCreatePlannedDisabledReason({
    availableSectionFinancePlans: activeSectionFinancePlans,
    financeCapabilities,
    sectionFinancePlansQueryState: sectionFinancePlansQuery,
    type: 'payment',
  })
  const createPlannedCostDisabledReason = getCreatePlannedDisabledReason({
    availableSectionFinancePlans: activeSectionFinancePlans,
    financeCapabilities,
    sectionFinancePlansQueryState: sectionFinancePlansQuery,
    type: 'cost',
  })
  const summary = getBudgetSummary(filteredRows)

  const handleRetryAll = async () => {
    await Promise.all([
      plannedPaymentsQuery.refetch(),
      plannedCostsQuery.refetch(),
      actualPaymentsQuery.refetch(),
      actualCostsQuery.refetch(),
      sectionFinancePlansQuery.refetch(),
    ])
  }

  const handlePlannedArchive = async (row: BudgetRow) => {
    const entityLabel = row.type === 'payment' ? 'плановое поступление' : 'плановый расход'

    if (!window.confirm(`Отправить в архив ${entityLabel} "${row.name}"?`)) {
      return
    }

    setActionError(null)
    setPendingActionKey(`planned-archive:${row.type}:${row.id}`)

    try {
      if (row.type === 'payment') {
        await archivePlannedPaymentMutation.mutateAsync(row.id)
      } else {
        await archivePlannedCostMutation.mutateAsync(row.id)
      }
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setPendingActionKey(null)
    }
  }

  const handleActualArchive = async (row: BudgetRow) => {
    if (!row.hasActual) {
      return
    }

    if (!window.confirm(`Отправить в архив активный факт по записи "${row.name}"?`)) {
      return
    }

    setActionError(null)
    setPendingActionKey(`actual-archive:${row.type}:${row.id}`)

    try {
      if (row.type === 'payment') {
        const actualPayment = activeActualPaymentByPlannedPaymentId.get(row.id)

        if (!actualPayment) {
          throw new Error('Активный факт поступления не найден')
        }

        await archiveActualPaymentMutation.mutateAsync(actualPayment.id)
      } else {
        const actualCost = activeActualCostByPlannedCostId.get(row.id)

        if (!actualCost) {
          throw new Error('Активный факт расхода не найден')
        }

        await archiveActualCostMutation.mutateAsync(actualCost.id)
      }
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setPendingActionKey(null)
    }
  }

  const openCreatePlannedDialog = (
    mode: 'create-planned-payment' | 'create-planned-cost',
  ) => {
    setActionError(null)
    setDialogState({
      mode,
    })
  }

  const openEditDialog = (row: BudgetRow) => {
    setActionError(null)

    if (row.type === 'payment') {
      const plannedPayment = plannedPaymentById.get(row.id)

      if (plannedPayment) {
        setDialogState({
          mode: 'edit-planned-payment',
          plannedPayment,
        })
      }

      return
    }

    const plannedCost = plannedCostById.get(row.id)

    if (plannedCost) {
      setDialogState({
        mode: 'edit-planned-cost',
        plannedCost,
      })
    }
  }

  const openCreateActualDialog = (row: BudgetRow) => {
    setActionError(null)

    if (row.type === 'payment') {
      const plannedPayment = plannedPaymentById.get(row.id)

      if (plannedPayment) {
        setDialogState({
          mode: 'create-actual-payment',
          plannedPayment,
        })
      }

      return
    }

    const plannedCost = plannedCostById.get(row.id)

    if (plannedCost) {
      setDialogState({
        mode: 'create-actual-cost',
        plannedCost,
      })
    }
  }

  const openRollbackDialog = (row: BudgetRow) => {
    setActionError(null)

    if (row.type === 'payment') {
      const plannedPayment = plannedPaymentById.get(row.id)

      if (plannedPayment) {
        setDialogState({
          mode: 'rollback-payment',
          plannedPayment,
        })
      }

      return
    }

    const plannedCost = plannedCostById.get(row.id)

    if (plannedCost) {
      setDialogState({
        mode: 'rollback-cost',
        plannedCost,
      })
    }
  }

  if (isPrimaryDataPending) {
    return (
      <LoadingState
        description="Собираем planned и actual записи в единую бюджетную таблицу."
        title="Загружаем таблицу бюджета"
      />
    )
  }

  if (primaryError) {
    return (
      <ErrorState
        action={
          <Button onClick={() => void handleRetryAll()} variant="contained">
            Повторить
          </Button>
        }
        description={primaryError.message}
        title="Не удалось загрузить бюджетные данные"
      />
    )
  }

  return (
    <>
      <SectionCard
        subtitle="Таблица строится вокруг planned-строк и подтягивает в ту же запись только активный факт."
        title="Бюджет проекта"
      >
        <Stack spacing={3}>
          <Alert severity="info" variant="outlined">
            В таблице показывается только активный факт. Архивная история фактов не отображается.
          </Alert>

          {sectionFinancePlansQuery.isError ? (
            <Alert
              icon={<WarningAmberRoundedIcon fontSize="inherit" />}
              severity="warning"
              variant="outlined"
            >
              Не удалось загрузить список разделов. Просмотр таблицы доступен, но редактирование
              planned-записей временно отключено.
            </Alert>
          ) : null}

          {actionError ? (
            <Alert severity="error" variant="outlined">
              {actionError}
            </Alert>
          ) : null}

          <BudgetTableToolbar
            createPlannedCostDisabledReason={createPlannedCostDisabledReason}
            createPlannedPaymentDisabledReason={createPlannedPaymentDisabledReason}
            filteredRowsCount={filteredRows.length}
            onCreatePlannedCost={() => openCreatePlannedDialog('create-planned-cost')}
            onCreatePlannedPayment={() => openCreatePlannedDialog('create-planned-payment')}
            onResetFilters={() => {
              setTypeFilter('all')
              setStatusFilter('all')
            }}
            onStatusFilterChange={setStatusFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            summary={summary}
            typeFilter={typeFilter}
          />

          {rows.length === 0 ? (
            <EmptyState
              description={
                createPlannedPaymentDisabledReason === null ||
                createPlannedCostDisabledReason === null
                  ? 'В проекте пока нет planned доходов и расходов. Добавьте первую запись через действия в toolbar.'
                  : 'В проекте пока нет planned доходов и расходов.'
              }
              title="Бюджетных строк пока нет"
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              description="Измените фильтры, чтобы снова увидеть planned-строки."
              title="По текущим фильтрам ничего не найдено"
            />
          ) : (
            <BudgetTableGrid
              filteredRows={filteredRows}
              financeCapabilities={financeCapabilities}
              onArchiveActual={handleActualArchive}
              onArchivePlanned={handlePlannedArchive}
              onCreateActual={openCreateActualDialog}
              onEdit={openEditDialog}
              onRollback={openRollbackDialog}
              pendingActionKey={pendingActionKey}
              plannedCostById={plannedCostById}
              plannedPaymentById={plannedPaymentById}
              sectionFinancePlansQueryState={sectionFinancePlansQuery}
            />
          )}
        </Stack>
      </SectionCard>

      <BudgetActionDialog
        availableSectionFinancePlans={availableSectionFinancePlans}
        createSectionFinancePlans={activeSectionFinancePlans}
        onClose={() => setDialogState(null)}
        open={dialogState !== null}
        projectFinanceId={projectFinanceId}
        state={dialogState}
      />
    </>
  )
}
