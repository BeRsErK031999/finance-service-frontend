import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Button, Collapse, Divider, Paper, Stack, Typography } from '@mui/material'

import { useActualCosts } from '../../entities/actual-cost/api/actual-cost.query'
import { useActualPayments } from '../../entities/actual-payment/api/actual-payment.query'
import { usePlannedCosts } from '../../entities/planned-cost/api/planned-cost.query'
import { usePlannedPayments } from '../../entities/planned-payment/api/planned-payment.query'
import {
  useArchiveSectionFinancePlan,
  useSectionFinancePlans,
} from '../../entities/section-finance-plan/api/section-finance-plan.query'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import { CreateSectionFinancePlanForm } from '../../features/section-finance-plan/create-section-finance-plan/ui/CreateSectionFinancePlanForm'
import { EditSectionFinancePlanForm } from '../../features/section-finance-plan/edit-section-finance-plan/ui/EditSectionFinancePlanForm'
import { parseApiError } from '../../shared/api/parse-api-error'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatAmount, formatDateTime, formatOptionalDateTime } from '../../shared/lib/format'
import type { ApiError } from '../../shared/types/api'
import { ActionAvailabilityHint } from '../../shared/ui/ActionAvailabilityHint'
import { ArchiveActionButton } from '../../shared/ui/ArchiveActionButton'
import { CollapsibleSectionCard } from '../../shared/ui/CollapsibleSectionCard'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { TechnicalDetailsSection } from '../../shared/ui/TechnicalDetailsSection'
import { PlannedCostBlock } from '../planned-cost-block/PlannedCostBlock'
import { PlannedPaymentBlock } from '../planned-payment-block/PlannedPaymentBlock'
import { SectionFinanceSummaryBlock } from '../section-finance-summary-block/SectionFinanceSummaryBlock'

interface SectionFinancePlanBlockProps {
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

interface SectionFinancePlanSummarySnapshot {
  activeItemCount: number
  actualBalance: number
  hasError: boolean
  isPending: boolean
  plannedBalance: number
}

export function SectionFinancePlanBlock({
  financeCapabilities,
  projectFinanceId,
  expanded,
  onExpandedChange,
}: SectionFinancePlanBlockProps) {
  const sectionFinancePlansQuery = useSectionFinancePlans(projectFinanceId)
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const plannedCostsQuery = usePlannedCosts(projectFinanceId)
  const actualPaymentsQuery = useActualPayments({ projectFinanceId })
  const actualCostsQuery = useActualCosts({ projectFinanceId })
  const archiveSectionFinancePlanMutation = useArchiveSectionFinancePlan()
  const sectionFinancePlans = sectionFinancePlansQuery.data?.items ?? []
  const canCreateSectionFinancePlan = financeCapabilities.canCreateSectionFinancePlan
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const createReason = canCreateSectionFinancePlan
    ? 'Можно добавить новый финансовый блок раздела.'
    : financeCapabilities.readOnlyReason ??
      'Добавлять блоки разделов можно только с правом редактирования финансового плана.'
  const sectionSummarySnapshots = buildSectionFinancePlanSummarySnapshots({
    actualCosts: actualCostsQuery.data?.items ?? [],
    actualPayments: actualPaymentsQuery.data?.items ?? [],
    hasError:
      plannedPaymentsQuery.isError ||
      plannedCostsQuery.isError ||
      actualPaymentsQuery.isError ||
      actualCostsQuery.isError,
    isPending:
      plannedPaymentsQuery.isPending ||
      plannedCostsQuery.isPending ||
      actualPaymentsQuery.isPending ||
      actualCostsQuery.isPending,
    plannedCosts: plannedCostsQuery.data?.items ?? [],
    plannedPayments: plannedPaymentsQuery.data?.items ?? [],
    sectionFinancePlans,
  })

  const handleArchive = async (sectionFinancePlan: SectionFinancePlan) => {
    if (
      !window.confirm(
        `Отправить в архив блок раздела "${sectionFinancePlan.name}"?`,
      )
    ) {
      return
    }

    setArchiveError(null)
    setArchivingId(sectionFinancePlan.id)

    try {
      await archiveSectionFinancePlanMutation.mutateAsync(sectionFinancePlan.id)
    } catch (error) {
      setArchiveError(toApiError(error).message)
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Button
            disabled={!canCreateSectionFinancePlan}
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить блок раздела'}
          </Button>
          <ActionAvailabilityHint message={createReason} />
        </Stack>
      }
      expanded={expanded}
      onToggle={onExpandedChange}
      subtitle="Разделы проекта с собственными плановыми поступлениями, расходами и фактическими движениями."
      summary={<SectionCountBadge count={sectionFinancePlans.length} />}
      title="Финансы по разделам"
    >
      <Stack spacing={3}>
        {canCreateSectionFinancePlan ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
            <CreateSectionFinancePlanForm projectFinanceId={projectFinanceId} />
          </Collapse>
        ) : null}

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Не удалось отправить блок раздела в архив"
          />
        ) : null}

        {sectionFinancePlansQuery.isPending ? (
          <LoadingState
            description="Загружаем блоки разделов."
            title="Загружаем разделы"
          />
        ) : null}

        {sectionFinancePlansQuery.isError ? (
          <ErrorState
            action={
              <Button
                onClick={() => void sectionFinancePlansQuery.refetch()}
                variant="contained"
              >
                Повторить
              </Button>
            }
            description={sectionFinancePlansQuery.error.message}
            title="Не удалось загрузить разделы"
          />
        ) : null}

        {!sectionFinancePlansQuery.isPending &&
        !sectionFinancePlansQuery.isError &&
        sectionFinancePlans.length === 0 ? (
          <EmptyState
            action={
              canCreateSectionFinancePlan && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить блок раздела
                </Button>
              ) : undefined
            }
            description={
              canCreateSectionFinancePlan
                ? 'Добавьте первый финансовый блок раздела для этого проекта.'
                : 'Для этого проекта пока нет доступных блоков разделов.'
            }
            title="Пока нет блоков разделов"
          />
        ) : null}

        {!sectionFinancePlansQuery.isPending &&
        !sectionFinancePlansQuery.isError &&
        sectionFinancePlans.length > 0 ? (
          <Stack spacing={2}>
            {sectionFinancePlans.map((sectionFinancePlan) => (
              <SectionFinancePlanListItem
                availableSectionFinancePlans={sectionFinancePlans}
                financeCapabilities={financeCapabilities}
                isArchiving={archivingId === sectionFinancePlan.id}
                key={sectionFinancePlan.id}
                onArchive={handleArchive}
                sectionFinancePlan={sectionFinancePlan}
                summarySnapshot={
                  sectionSummarySnapshots.get(sectionFinancePlan.id) ?? {
                    activeItemCount: 0,
                    actualBalance: 0,
                    hasError: false,
                    isPending: false,
                    plannedBalance: 0,
                  }
                }
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CollapsibleSectionCard>
  )
}

function SectionCountBadge({ count }: { count: number }) {
  return (
    <Paper
      sx={{
        bgcolor: 'background.default',
        px: 1.5,
        py: 1,
      }}
      variant="outlined"
    >
      <Stack spacing={0.25}>
        <Typography color="text.secondary" variant="caption">
          Разделов
        </Typography>
        <Typography variant="subtitle2">{count}</Typography>
      </Stack>
    </Paper>
  )
}

function SectionFinancePlanListItem({
  availableSectionFinancePlans,
  financeCapabilities,
  isArchiving,
  onArchive,
  sectionFinancePlan,
  summarySnapshot,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  isArchiving: boolean
  onArchive: (sectionFinancePlan: SectionFinancePlan) => Promise<void>
  sectionFinancePlan: SectionFinancePlan
  summarySnapshot: SectionFinancePlanSummarySnapshot
}) {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const isArchived = sectionFinancePlan.state !== 'ACTIVE'
  const canEditSectionFinancePlan = financeCapabilities.canEditSectionFinancePlan
  const canArchiveSectionFinancePlan = financeCapabilities.canArchiveSectionFinancePlan
  const canOpenEditForm = canEditSectionFinancePlan && !isArchived
  const actionHint = getSectionFinancePlanActionHint({
    canArchiveSectionFinancePlan,
    canEditSectionFinancePlan,
    isArchived,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })

  return (
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              disabled={!canOpenEditForm}
              onClick={() => setIsEditFormOpen((current) => !current)}
              startIcon={<EditOutlinedIcon />}
              variant="outlined"
            >
              {isEditFormOpen ? 'Скрыть форму' : 'Редактировать'}
            </Button>
            <ArchiveActionButton
              disabled={!canArchiveSectionFinancePlan}
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(sectionFinancePlan)}
            />
          </Stack>
          <ActionAvailabilityHint message={actionHint} />
        </Stack>
      }
      contentSx={{ pt: 3 }}
      defaultExpanded={false}
      subtitle={`Внешний ID раздела: ${sectionFinancePlan.externalSectionId}`}
      summary={
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <FinanceStatusChip value={sectionFinancePlan.state} />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {sectionFinancePlan.description ?? 'Описание не указано'}
          </Typography>
          <SectionFinancePlanCompactSummary snapshot={summarySnapshot} />
        </Stack>
      }
      surface="paper"
      title={sectionFinancePlan.name}
    >
      <Stack spacing={3}>
        <Collapse in={isEditFormOpen && canOpenEditForm} unmountOnExit>
          <EditSectionFinancePlanForm
            onCancel={() => setIsEditFormOpen(false)}
            onSuccess={() => setIsEditFormOpen(false)}
            sectionFinancePlan={sectionFinancePlan}
          />
        </Collapse>

        <SectionFinanceSummaryBlock
          projectFinanceId={sectionFinancePlan.projectFinanceId}
          sectionFinancePlanId={sectionFinancePlan.id}
        />

        <PlannedPaymentBlock
          availableSectionFinancePlans={availableSectionFinancePlans}
          financeCapabilities={financeCapabilities}
          projectFinanceId={sectionFinancePlan.projectFinanceId}
          sectionFinancePlanId={sectionFinancePlan.id}
          sectionFinancePlanName={sectionFinancePlan.name}
        />

        <PlannedCostBlock
          availableSectionFinancePlans={availableSectionFinancePlans}
          financeCapabilities={financeCapabilities}
          projectFinanceId={sectionFinancePlan.projectFinanceId}
          sectionFinancePlanId={sectionFinancePlan.id}
          sectionFinancePlanName={sectionFinancePlan.name}
        />

        <TechnicalDetailsSection subtitle="Версия записи и даты, которые помогают проверить историю раздела.">
          <Stack divider={<Divider flexItem />} spacing={2}>
            <SectionFinancePlanMetaItem
              label="Версия"
              value={String(sectionFinancePlan.version)}
            />
            <SectionFinancePlanMetaItem
              label="Создан"
              value={formatDateTime(sectionFinancePlan.createdAt)}
            />
            <SectionFinancePlanMetaItem
              label="Обновлён"
              value={formatDateTime(sectionFinancePlan.updatedAt)}
            />
            <SectionFinancePlanMetaItem
              label="Архивирован"
              value={formatOptionalDateTime(sectionFinancePlan.archivedAt, 'Не архивирован')}
            />
            <SectionFinancePlanMetaItem
              label="Удалён"
              value={formatOptionalDateTime(sectionFinancePlan.deletedAt, 'Не удалён')}
            />
          </Stack>
        </TechnicalDetailsSection>
      </Stack>
    </CollapsibleSectionCard>
  )
}

function SectionFinancePlanCompactSummary({
  snapshot,
}: {
  snapshot: SectionFinancePlanSummarySnapshot
}) {
  if (snapshot.isPending) {
    return (
      <Typography color="text.secondary" variant="caption">
        Обновляем сводку по разделу.
      </Typography>
    )
  }

  if (snapshot.hasError) {
    return (
      <Typography color="text.secondary" variant="caption">
        Сводка по разделу временно недоступна.
      </Typography>
    )
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
      <SummaryBadge label="Плановый баланс" value={formatAmount(snapshot.plannedBalance)} />
      <SummaryBadge label="Фактический баланс" value={formatAmount(snapshot.actualBalance)} />
      <SummaryBadge label="Активных записей" value={String(snapshot.activeItemCount)} />
    </Stack>
  )
}

function SummaryBadge({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Paper
      sx={{
        bgcolor: 'background.default',
        px: 1.25,
        py: 1,
      }}
      variant="outlined"
    >
      <Stack spacing={0.25}>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Stack>
    </Paper>
  )
}

function SectionFinancePlanMetaItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Stack spacing={0.25}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}

function getSectionFinancePlanActionHint({
  canArchiveSectionFinancePlan,
  canEditSectionFinancePlan,
  isArchived,
  readOnlyReason,
}: {
  canArchiveSectionFinancePlan: boolean
  canEditSectionFinancePlan: boolean
  isArchived: boolean
  readOnlyReason: string | null
}) {
  if (!canEditSectionFinancePlan || !canArchiveSectionFinancePlan) {
    return (
      readOnlyReason ??
      'Изменять и архивировать блок раздела можно только с правом редактирования.'
    )
  }

  if (isArchived) {
    return 'Для архивного блока раздела доступны только просмотр и проверка истории.'
  }

  return 'Можно изменить название, внешний ID раздела и описание.'
}

function buildSectionFinancePlanSummarySnapshots({
  actualCosts,
  actualPayments,
  hasError,
  isPending,
  plannedCosts,
  plannedPayments,
  sectionFinancePlans,
}: {
  actualCosts: Array<{ amount: string; plannedCostId: string; state: string }>
  actualPayments: Array<{ amount: string; plannedPaymentId: string; state: string }>
  hasError: boolean
  isPending: boolean
  plannedCosts: Array<{
    amount: string
    id: string
    sectionFinancePlanIds: string[]
    state: string
  }>
  plannedPayments: Array<{
    amount: string
    id: string
    sectionFinancePlanIds: string[]
    state: string
  }>
  sectionFinancePlans: SectionFinancePlan[]
}) {
  return new Map(
    sectionFinancePlans.map((sectionFinancePlan) => {
      const sectionPlannedPayments = plannedPayments.filter((plannedPayment) =>
        plannedPayment.sectionFinancePlanIds.includes(sectionFinancePlan.id),
      )
      const sectionPlannedCosts = plannedCosts.filter((plannedCost) =>
        plannedCost.sectionFinancePlanIds.includes(sectionFinancePlan.id),
      )
      const activePlannedPayments = sectionPlannedPayments.filter(isActiveRecord)
      const activePlannedCosts = sectionPlannedCosts.filter(isActiveRecord)
      const activePlannedPaymentIds = new Set(
        activePlannedPayments.map((plannedPayment) => plannedPayment.id),
      )
      const activePlannedCostIds = new Set(
        activePlannedCosts.map((plannedCost) => plannedCost.id),
      )
      const activeActualPayments = actualPayments.filter(
        (actualPayment) =>
          isActiveRecord(actualPayment) &&
          activePlannedPaymentIds.has(actualPayment.plannedPaymentId),
      )
      const activeActualCosts = actualCosts.filter(
        (actualCost) =>
          isActiveRecord(actualCost) &&
          activePlannedCostIds.has(actualCost.plannedCostId),
      )

      const snapshot: SectionFinancePlanSummarySnapshot = {
        activeItemCount:
          activePlannedPayments.length +
          activePlannedCosts.length +
          activeActualPayments.length +
          activeActualCosts.length,
        actualBalance:
          sumAmounts(activeActualPayments) - sumAmounts(activeActualCosts),
        hasError,
        isPending,
        plannedBalance:
          sumAmounts(activePlannedPayments) - sumAmounts(activePlannedCosts),
      }

      return [sectionFinancePlan.id, snapshot] as const
    }),
  )
}

function isActiveRecord<T extends { state: string }>(item: T) {
  return item.state === 'ACTIVE'
}

function sumAmounts(items: Array<{ amount: string }>) {
  return items.reduce((total, item) => total + toNumericAmount(item.amount), 0)
}

function toNumericAmount(value: string) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  return parseApiError(error)
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return typeof (error as { message?: unknown }).message === 'string'
}
