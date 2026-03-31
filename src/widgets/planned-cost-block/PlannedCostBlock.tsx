import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import {
  Button,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import {
  useActualCosts,
  useArchiveActualCost,
} from '../../entities/actual-cost/api/actual-cost.query'
import type { ActualCost } from '../../entities/actual-cost/model/types'
import {
  useArchivePlannedCost,
  usePlannedCosts,
} from '../../entities/planned-cost/api/planned-cost.query'
import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import { CreateActualCostForm } from '../../features/actual-cost/create-actual-cost/ui/CreateActualCostForm'
import { ChangePlannedCostStatusForm } from '../../features/planned-cost/change-planned-cost-status/ui/ChangePlannedCostStatusForm'
import { CreatePlannedCostForm } from '../../features/planned-cost/create-planned-cost/ui/CreatePlannedCostForm'
import { EditPlannedCostForm } from '../../features/planned-cost/edit-planned-cost/ui/EditPlannedCostForm'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import { parseApiError } from '../../shared/api/parse-api-error'
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatOptionalDate,
  formatOptionalDateTime,
} from '../../shared/lib/format'
import type { ApiError } from '../../shared/types/api'
import { ActionAvailabilityHint } from '../../shared/ui/ActionAvailabilityHint'
import { ArchiveActionButton } from '../../shared/ui/ArchiveActionButton'
import { CollapsibleSectionCard } from '../../shared/ui/CollapsibleSectionCard'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { TechnicalDetailsSection } from '../../shared/ui/TechnicalDetailsSection'

interface PlannedCostBlockProps {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
  sectionFinancePlanId: string
  sectionFinancePlanName: string
}

export function PlannedCostBlock({
  availableSectionFinancePlans,
  financeCapabilities,
  projectFinanceId,
  sectionFinancePlanId,
  sectionFinancePlanName,
}: PlannedCostBlockProps) {
  const plannedCostsQuery = usePlannedCosts(projectFinanceId)
  const archivePlannedCostMutation = useArchivePlannedCost()
  const canCreatePlannedCost = financeCapabilities.canCreatePlannedCost
  const plannedCosts = (plannedCostsQuery.data?.items ?? []).filter((plannedCost) =>
    plannedCost.sectionFinancePlanIds.includes(sectionFinancePlanId),
  )
  const totalAmount = plannedCosts.reduce(
    (total, plannedCost) => total + toNumericAmount(plannedCost.amount),
    0,
  )
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const createReason = canCreatePlannedCost
    ? 'Можно добавить новый плановый расход для этого раздела.'
    : financeCapabilities.readOnlyReason ??
      'Создавать плановые расходы можно только с правом редактирования.'

  const handleArchive = async (plannedCost: PlannedCost) => {
    if (!window.confirm(`Отправить в архив плановый расход "${plannedCost.name}"?`)) {
      return
    }

    setArchiveError(null)
    setArchivingId(plannedCost.id)

    try {
      await archivePlannedCostMutation.mutateAsync(plannedCost.id)
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
            disabled={!canCreatePlannedCost}
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить расход'}
          </Button>
          <ActionAvailabilityHint message={createReason} />
        </Stack>
      }
      defaultExpanded={false}
      subtitle="Ожидаемые расходы, связанные с этим разделом."
      summary={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <SummaryBadge label="Записей" value={String(plannedCosts.length)} />
          <SummaryBadge label="Сумма" value={formatAmount(totalAmount)} />
        </Stack>
      }
      surface="paper"
      title="Плановые расходы"
    >
      <Stack spacing={3}>
        {canCreatePlannedCost ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
            <CreatePlannedCostForm
              projectFinanceId={projectFinanceId}
              sectionFinancePlanId={sectionFinancePlanId}
              sectionFinancePlanName={sectionFinancePlanName}
            />
          </Collapse>
        ) : null}

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Не удалось отправить плановый расход в архив"
          />
        ) : null}

        {plannedCostsQuery.isPending ? (
          <LoadingState
            description="Загружаем плановые расходы для этого финансового плана."
            title="Загружаем плановые расходы"
          />
        ) : null}

        {plannedCostsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void plannedCostsQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={plannedCostsQuery.error.message}
            title="Не удалось загрузить плановые расходы"
          />
        ) : null}

        {!plannedCostsQuery.isPending &&
        !plannedCostsQuery.isError &&
        plannedCosts.length === 0 ? (
          <EmptyState
            action={
              canCreatePlannedCost && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить расход
                </Button>
              ) : undefined
            }
            description={
              canCreatePlannedCost
                ? 'Для этого раздела пока нет плановых расходов. Добавьте первый ожидаемый расход.'
                : 'Для этого раздела пока нет плановых расходов.'
            }
            title="Плановых расходов пока нет"
          />
        ) : null}

        {!plannedCostsQuery.isPending &&
        !plannedCostsQuery.isError &&
        plannedCosts.length > 0 ? (
          <Stack spacing={2}>
            {plannedCosts.map((plannedCost) => (
              <PlannedCostListItem
                availableSectionFinancePlans={availableSectionFinancePlans}
                financeCapabilities={financeCapabilities}
                isArchiving={archivingId === plannedCost.id}
                key={plannedCost.id}
                onArchive={handleArchive}
                plannedCost={plannedCost}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CollapsibleSectionCard>
  )
}

function PlannedCostListItem({
  availableSectionFinancePlans,
  financeCapabilities,
  isArchiving,
  onArchive,
  plannedCost,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  isArchiving: boolean
  onArchive: (plannedCost: PlannedCost) => Promise<void>
  plannedCost: PlannedCost
}) {
  const actualCostsQuery = useActualCosts({
    plannedCostId: plannedCost.id,
  })
  const actualCosts = actualCostsQuery.data?.items ?? []
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isStatusFormOpen, setIsStatusFormOpen] = useState(false)
  const isArchived = plannedCost.state !== 'ACTIVE'
  const hasActiveActualCost = actualCosts.some(
    (actualCost) => actualCost.state === 'ACTIVE',
  )
  const canEditPlannedCost = financeCapabilities.canEditPlannedCost
  const canArchivePlannedCost = financeCapabilities.canArchivePlannedCost
  const canChangeStatus = financeCapabilities.canChangePlannedCostStatus
  const editAvailabilityReason = getPlannedCostEditAvailabilityReason({
    actualCosts,
    hasActualCostsError: actualCostsQuery.isError,
    isActualCostsPending: actualCostsQuery.isPending,
    plannedCostStatus: plannedCost.status,
  })
  const canOpenEditForm =
    canEditPlannedCost && !isArchived && editAvailabilityReason === null
  const showStatusChangeAction =
    canChangeStatus &&
    !isArchived &&
    plannedCost.status === 'RECEIVED' &&
    hasActiveActualCost
  const actionHint = getPlannedCostActionHint({
    canArchivePlannedCost,
    canEditPlannedCost,
    editAvailabilityReason,
    isArchived,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })

  return (
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {canChangeStatus || plannedCost.status === 'RECEIVED' ? (
              <Button
                disabled={!showStatusChangeAction}
                onClick={() => setIsStatusFormOpen((current) => !current)}
                startIcon={<SyncAltRoundedIcon />}
                variant="outlined"
              >
                {isStatusFormOpen ? 'Скрыть форму' : 'Изменить статус'}
              </Button>
            ) : null}
            <Button
              disabled={!canOpenEditForm}
              onClick={() => setIsEditFormOpen((current) => !current)}
              startIcon={<EditOutlinedIcon />}
              variant="outlined"
            >
              {isEditFormOpen ? 'Скрыть форму' : 'Редактировать'}
            </Button>
            <ArchiveActionButton
              disabled={!canArchivePlannedCost}
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(plannedCost)}
            />
          </Stack>
          <ActionAvailabilityHint message={actionHint} />
        </Stack>
      }
      contentSx={{ pt: 3 }}
      defaultExpanded={false}
      summary={
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <SummaryBadge label="Сумма" value={formatAmount(plannedCost.amount)} />
            <FinanceStatusChip value={plannedCost.status} />
            <FinanceStatusChip value={plannedCost.state} />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {getPlannedCostConditionPreview(plannedCost)}
          </Typography>
        </Stack>
      }
      surface="paper"
      title={plannedCost.name}
    >
      <Stack spacing={3}>
        <DetailedPlannedCostCondition plannedCost={plannedCost} />

        <Paper sx={{ p: 2 }} variant="outlined">
          <Stack spacing={0.5}>
            <Typography color="text.secondary" variant="caption">
              Фактическая дата
            </Typography>
            <Typography variant="body2">
              {formatOptionalDate(plannedCost.actualDate, 'Факт пока не зафиксирован')}
            </Typography>
          </Stack>
        </Paper>

        <Collapse in={isEditFormOpen && canOpenEditForm} unmountOnExit>
          <EditPlannedCostForm
            availableSectionFinancePlans={availableSectionFinancePlans}
            onCancel={() => setIsEditFormOpen(false)}
            onSuccess={() => setIsEditFormOpen(false)}
            plannedCost={plannedCost}
          />
        </Collapse>

        <Collapse in={showStatusChangeAction && isStatusFormOpen} unmountOnExit>
          <ChangePlannedCostStatusForm
            onCancel={() => setIsStatusFormOpen(false)}
            onSuccess={() => setIsStatusFormOpen(false)}
            plannedCost={plannedCost}
          />
        </Collapse>

        <ActualCostSection
          actualCosts={actualCosts}
          actualCostsErrorMessage={
            actualCostsQuery.isError ? actualCostsQuery.error.message : null
          }
          actualCostsRefetch={() => actualCostsQuery.refetch()}
          financeCapabilities={financeCapabilities}
          isActualCostsError={actualCostsQuery.isError}
          isActualCostsPending={actualCostsQuery.isPending}
          plannedCost={plannedCost}
        />

        <TechnicalDetailsSection subtitle="Версия записи и даты, которые полезны для проверки истории планового расхода.">
          <Stack divider={<Divider flexItem />} spacing={2}>
            <MetaItem label="Версия" value={String(plannedCost.version)} />
            <MetaItem label="Создано" value={formatDateTime(plannedCost.createdAt)} />
            <MetaItem label="Обновлено" value={formatDateTime(plannedCost.updatedAt)} />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(plannedCost.archivedAt, 'Не архивировано')}
            />
            <MetaItem
              label="Удалено"
              value={formatOptionalDateTime(plannedCost.deletedAt, 'Не удалено')}
            />
          </Stack>
        </TechnicalDetailsSection>
      </Stack>
    </CollapsibleSectionCard>
  )
}

function ActualCostSection({
  actualCosts,
  actualCostsErrorMessage,
  actualCostsRefetch,
  financeCapabilities,
  isActualCostsError,
  isActualCostsPending,
  plannedCost,
}: {
  actualCosts: ActualCost[]
  actualCostsErrorMessage: string | null
  actualCostsRefetch: () => Promise<unknown>
  financeCapabilities: FinanceCapabilities
  isActualCostsError: boolean
  isActualCostsPending: boolean
  plannedCost: PlannedCost
}) {
  const archiveActualCostMutation = useArchiveActualCost()
  const hasActiveActualCost = actualCosts.some(
    (actualCost) => actualCost.state === 'ACTIVE',
  )
  const canCreateActualCost =
    !isActualCostsPending &&
    !isActualCostsError &&
    plannedCost.state === 'ACTIVE' &&
    !hasActiveActualCost
  const createActualCostHint = getActualCostCreateHint({
    canCreateActualCost: financeCapabilities.canCreateActualCost,
    hasActiveActualCost,
    isActualCostsError,
    isActualCostsPending,
    plannedCostState: plannedCost.state,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })
  const totalAmount = actualCosts.reduce(
    (total, actualCost) => total + toNumericAmount(actualCost.amount),
    0,
  )
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (actualCost: ActualCost) => {
    if (
      !window.confirm(`Отправить в архив фактический расход от ${formatDate(actualCost.actualDate)}?`)
    ) {
      return
    }

    setArchiveError(null)
    setArchivingId(actualCost.id)

    try {
      await archiveActualCostMutation.mutateAsync(actualCost.id)
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
            disabled={!financeCapabilities.canCreateActualCost || !canCreateActualCost}
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить факт расхода'}
          </Button>
          <ActionAvailabilityHint message={createActualCostHint} />
        </Stack>
      }
      defaultExpanded={false}
      subtitle="Реально зафиксированные расходы по этой плановой записи."
      summary={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <SummaryBadge label="Записей" value={String(actualCosts.length)} />
          <SummaryBadge label="Сумма" value={formatAmount(totalAmount)} />
        </Stack>
      }
      surface="paper"
      title="Фактические расходы"
    >
      <Stack spacing={3}>
        {financeCapabilities.canCreateActualCost && canCreateActualCost ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
            <CreateActualCostForm
              onSuccess={() => setIsCreateFormOpen(false)}
              plannedCostId={plannedCost.id}
              plannedCostName={plannedCost.name}
              projectFinanceId={plannedCost.projectFinanceId}
            />
          </Collapse>
        ) : null}

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Не удалось отправить фактический расход в архив"
          />
        ) : null}

        {isActualCostsPending ? (
          <LoadingState
            description="Загружаем фактические расходы, связанные с этой плановой записью."
            title="Загружаем фактические расходы"
          />
        ) : null}

        {isActualCostsError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualCostsRefetch()} variant="contained">
                Повторить
              </Button>
            }
            description={actualCostsErrorMessage ?? 'Не удалось загрузить фактические расходы.'}
            title="Не удалось загрузить фактические расходы"
          />
        ) : null}

        {!isActualCostsPending &&
        !isActualCostsError &&
        actualCosts.length === 0 ? (
          <EmptyState
            action={
              financeCapabilities.canCreateActualCost &&
              canCreateActualCost &&
              !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить факт расхода
                </Button>
              ) : undefined
            }
            description="По этой плановой записи пока нет фактических расходов."
            title="Фактических расходов пока нет"
          />
        ) : null}

        {!isActualCostsPending &&
        !isActualCostsError &&
        actualCosts.length > 0 ? (
          <Stack spacing={2}>
            {actualCosts.map((actualCost) => (
              <ActualCostListItem
                actualCost={actualCost}
                canArchiveActualCost={financeCapabilities.canArchiveActualCost}
                isArchiving={archivingId === actualCost.id}
                key={actualCost.id}
                onArchive={handleArchive}
                readOnlyReason={financeCapabilities.readOnlyReason}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CollapsibleSectionCard>
  )
}

function ActualCostListItem({
  actualCost,
  canArchiveActualCost,
  isArchiving,
  onArchive,
  readOnlyReason,
}: {
  actualCost: ActualCost
  canArchiveActualCost: boolean
  isArchiving: boolean
  onArchive: (actualCost: ActualCost) => Promise<void>
  readOnlyReason: string | null
}) {
  const isArchived = actualCost.state !== 'ACTIVE'
  const archiveHint = canArchiveActualCost
    ? isArchived
      ? 'Архивная запись доступна только для просмотра.'
      : 'Можно отправить запись в архив, если факт больше не должен считаться активным.'
    : readOnlyReason ??
      'Архивировать фактические расходы можно только с правом редактирования.'

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={1}>
            <Stack
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              direction={{ xs: 'column', sm: 'row' }}
              flexWrap="wrap"
              spacing={1}
            >
              <Typography variant="subtitle1">
                Дата расхода: {formatDate(actualCost.actualDate)}
              </Typography>
              <FinanceStatusChip value={actualCost.state} />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Сумма: {formatAmount(actualCost.amount)}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Комментарий: {actualCost.comment ?? 'Без комментария'}
            </Typography>
          </Stack>

          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <ArchiveActionButton
              disabled={!canArchiveActualCost}
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(actualCost)}
            />
            <ActionAvailabilityHint message={archiveHint} />
          </Stack>
        </Stack>

        <TechnicalDetailsSection subtitle="Технические поля фактической записи скрыты по умолчанию.">
          <Stack divider={<Divider flexItem />} spacing={2}>
            <MetaItem label="Версия" value={String(actualCost.version)} />
            <MetaItem label="Создано" value={formatDateTime(actualCost.createdAt)} />
            <MetaItem label="Обновлено" value={formatDateTime(actualCost.updatedAt)} />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(actualCost.archivedAt, 'Не архивировано')}
            />
            <MetaItem
              label="Удалено"
              value={formatOptionalDateTime(actualCost.deletedAt, 'Не удалено')}
            />
          </Stack>
        </TechnicalDetailsSection>
      </Stack>
    </Paper>
  )
}

function DetailedPlannedCostCondition({
  plannedCost,
}: {
  plannedCost: PlannedCost
}) {
  if (plannedCost.conditionSource === 'DATE') {
    return (
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Подробное условие</Typography>
          <Typography color="text.secondary" variant="body2">
            Расход ожидается к дате {formatOptionalDate(plannedCost.plannedDate)}.
          </Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Stack spacing={1.25}>
        <Typography variant="subtitle2">Подробное условие</Typography>
        <Typography color="text.secondary" variant="body2">
          Расход ожидается только после того, как произойдут все выбранные проектные события и события раздела.
        </Typography>
        {plannedCost.projectEventIds.length > 0 ? (
          <IdentifierGroup
            label="Связанные проектные события"
            values={plannedCost.projectEventIds}
          />
        ) : null}
        {plannedCost.sectionEventIds.length > 0 ? (
          <IdentifierGroup
            label="Связанные события раздела"
            values={plannedCost.sectionEventIds}
          />
        ) : null}
      </Stack>
    </Paper>
  )
}

function IdentifierGroup({
  label,
  values,
}: {
  label: string
  values: string[]
}) {
  return (
    <Stack spacing={0.75}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {values.map((value) => (
          <Chip key={value} label={value} size="small" variant="outlined" />
        ))}
      </Stack>
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

function MetaItem({
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

function getPlannedCostConditionPreview(plannedCost: PlannedCost) {
  if (plannedCost.conditionSource === 'DATE') {
    return `По дате: ${formatOptionalDate(plannedCost.plannedDate)}`
  }

  const totalEventCount =
    plannedCost.projectEventIds.length + plannedCost.sectionEventIds.length

  return totalEventCount > 0
    ? `По событиям: выбрано ${totalEventCount} шт.`
    : 'По событиям: список событий пока не заполнен'
}

function getPlannedCostActionHint({
  canArchivePlannedCost,
  canEditPlannedCost,
  editAvailabilityReason,
  isArchived,
  readOnlyReason,
}: {
  canArchivePlannedCost: boolean
  canEditPlannedCost: boolean
  editAvailabilityReason: string | null
  isArchived: boolean
  readOnlyReason: string | null
}) {
  if (!canEditPlannedCost || !canArchivePlannedCost) {
    return (
      readOnlyReason ??
      'Редактировать и архивировать плановые расходы можно только с правом редактирования.'
    )
  }

  if (isArchived) {
    return 'Архивная запись доступна только для просмотра и проверки истории.'
  }

  if (editAvailabilityReason) {
    return editAvailabilityReason
  }

  return 'Можно изменить сумму, условие, связанные события и разделы.'
}

function getActualCostCreateHint({
  canCreateActualCost,
  hasActiveActualCost,
  isActualCostsError,
  isActualCostsPending,
  plannedCostState,
  readOnlyReason,
}: {
  canCreateActualCost: boolean
  hasActiveActualCost: boolean
  isActualCostsError: boolean
  isActualCostsPending: boolean
  plannedCostState: PlannedCost['state']
  readOnlyReason: string | null
}) {
  if (!canCreateActualCost) {
    return (
      readOnlyReason ??
      'Фиксировать фактические расходы можно только с правом редактирования.'
    )
  }

  if (plannedCostState !== 'ACTIVE') {
    return 'Добавить факт можно только для активной плановой записи.'
  }

  if (isActualCostsPending) {
    return 'Сначала дождитесь загрузки уже существующих фактических расходов.'
  }

  if (isActualCostsError) {
    return 'Сначала нужно успешно загрузить фактические расходы по этой записи.'
  }

  if (hasActiveActualCost) {
    return 'По этой записи уже есть активный факт расхода.'
  }

  return 'Можно зафиксировать реальный расход по этой записи.'
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

function getPlannedCostEditAvailabilityReason({
  actualCosts,
  hasActualCostsError,
  isActualCostsPending,
  plannedCostStatus,
}: {
  actualCosts: ActualCost[]
  hasActualCostsError: boolean
  isActualCostsPending: boolean
  plannedCostStatus: PlannedCost['status']
}) {
  if (isActualCostsPending) {
    return 'Перед редактированием нужно проверить, есть ли по записи фактические расходы.'
  }

  if (hasActualCostsError) {
    return 'Редактирование станет доступно после успешной загрузки фактических расходов.'
  }

  if (actualCosts.some((actualCost) => actualCost.state === 'ACTIVE')) {
    if (plannedCostStatus === 'RECEIVED') {
      return 'Пока по записи есть активный факт и статус "Получено", редактирование закрыто. Сначала верните статус назад и отправьте факт в архив.'
    }

    return 'Пока по записи есть активный факт расхода, редактирование недоступно.'
  }

  return null
}
