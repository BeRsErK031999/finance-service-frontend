import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import {
  Button,
  Chip,
  Collapse,
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
import { CreateActualCostForm } from '../../features/actual-cost/create-actual-cost/ui/CreateActualCostForm'
import { ChangePlannedCostStatusForm } from '../../features/planned-cost/change-planned-cost-status/ui/ChangePlannedCostStatusForm'
import { EditPlannedCostForm } from '../../features/planned-cost/edit-planned-cost/ui/EditPlannedCostForm'
import { CreatePlannedCostForm } from '../../features/planned-cost/create-planned-cost/ui/CreatePlannedCostForm'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
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
import { ArchiveActionButton } from '../../shared/ui/ArchiveActionButton'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'

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
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

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
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={3}>
        <Stack
          alignItems={{ xs: 'flex-start', md: 'center' }}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Плановые расходы</Typography>
            <Typography color="text.secondary">
              Здесь показаны ожидаемые расходы, связанные с этим разделом.
            </Typography>
          </Stack>

          {canCreatePlannedCost ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Скрыть форму' : 'Добавить расход'}
            </Button>
          ) : null}
        </Stack>

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
    </Paper>
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
  const showStatusChangeAction =
    financeCapabilities.canChangePlannedCostStatus &&
    !isArchived && plannedCost.status === 'RECEIVED' && hasActiveActualCost
  const editAvailabilityReason = getPlannedCostEditAvailabilityReason({
    actualCosts,
    hasActualCostsError: actualCostsQuery.isError,
    isActualCostsPending: actualCostsQuery.isPending,
    plannedCostStatus: plannedCost.status,
  })
  const canEditPlannedCost = financeCapabilities.canEditPlannedCost
  const canArchivePlannedCost = financeCapabilities.canArchivePlannedCost
  const isEditFormVisible =
    canEditPlannedCost &&
    !isArchived &&
    editAvailabilityReason === null &&
    isEditFormOpen
  const showActions =
    showStatusChangeAction || canEditPlannedCost || canArchivePlannedCost

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={3}
        >
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            <Stack
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              direction={{ xs: 'column', sm: 'row' }}
              flexWrap="wrap"
              spacing={1}
            >
              <Typography variant="subtitle1">{plannedCost.name}</Typography>
              <FinanceStatusChip value={plannedCost.status} />
              <FinanceStatusChip value={plannedCost.state} />
            </Stack>

            <Typography color="text.secondary" variant="body2">
              Сумма: {formatAmount(plannedCost.amount)}
            </Typography>

            {plannedCost.conditionSource === 'DATE' ? (
              <Typography color="text.secondary" variant="body2">
                Плановая дата: {formatOptionalDate(plannedCost.plannedDate)}
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">
                  Расход ожидается только после того, как произойдут все выбранные проектные события и события раздела.
                </Typography>
                {plannedCost.projectEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Проектные события"
                    values={plannedCost.projectEventIds}
                  />
                ) : null}
                {plannedCost.sectionEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="События раздела"
                    values={plannedCost.sectionEventIds}
                  />
                ) : null}
              </Stack>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ flexWrap: 'wrap' }}
            >
              <MetaItem label="Версия" value={String(plannedCost.version)} />
              <MetaItem
                label="Создано"
                value={formatDateTime(plannedCost.createdAt)}
              />
              <MetaItem
                label="Обновлено"
                value={formatDateTime(plannedCost.updatedAt)}
              />
              <MetaItem
                label="Фактическая дата"
                value={formatOptionalDate(plannedCost.actualDate)}
              />
              <MetaItem
                label="В архиве с"
                value={formatOptionalDateTime(plannedCost.archivedAt)}
              />
            </Stack>
          </Stack>

          {showActions ? (
            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
              {showStatusChangeAction ? (
                <Button
                  onClick={() => setIsStatusFormOpen((current) => !current)}
                  startIcon={<SyncAltRoundedIcon />}
                  variant="outlined"
                >
                  {isStatusFormOpen ? 'Скрыть форму' : 'Изменить статус'}
                </Button>
              ) : null}
              {canEditPlannedCost ? (
                <>
                  <Button
                    disabled={isArchived || editAvailabilityReason !== null}
                    onClick={() => setIsEditFormOpen((current) => !current)}
                    startIcon={<EditOutlinedIcon />}
                    variant="outlined"
                  >
                    {isEditFormVisible ? 'Скрыть форму' : 'Редактировать'}
                  </Button>
                  {editAvailabilityReason ? (
                    <Typography
                      color="text.secondary"
                      sx={{ maxWidth: 240 }}
                      variant="caption"
                    >
                      {editAvailabilityReason}
                    </Typography>
                  ) : null}
                </>
              ) : null}
              {canArchivePlannedCost ? (
                <ArchiveActionButton
                  isArchived={isArchived}
                  isArchiving={isArchiving}
                  onClick={() => void onArchive(plannedCost)}
                />
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <Collapse in={showStatusChangeAction && isStatusFormOpen} unmountOnExit>
          <ChangePlannedCostStatusForm
            onCancel={() => setIsStatusFormOpen(false)}
            onSuccess={() => setIsStatusFormOpen(false)}
            plannedCost={plannedCost}
          />
        </Collapse>

        {canEditPlannedCost ? (
          <Collapse in={isEditFormVisible} unmountOnExit>
            <EditPlannedCostForm
              availableSectionFinancePlans={availableSectionFinancePlans}
              onCancel={() => setIsEditFormOpen(false)}
              onSuccess={() => setIsEditFormOpen(false)}
              plannedCost={plannedCost}
            />
          </Collapse>
        ) : null}

        <ActualCostSection
          financeCapabilities={financeCapabilities}
          plannedCost={plannedCost}
        />
      </Stack>
    </Paper>
  )
}

function ActualCostSection({
  financeCapabilities,
  plannedCost,
}: {
  financeCapabilities: FinanceCapabilities
  plannedCost: PlannedCost
}) {
  const actualCostsQuery = useActualCosts({
    plannedCostId: plannedCost.id,
  })
  const archiveActualCostMutation = useArchiveActualCost()
  const actualCosts = actualCostsQuery.data?.items ?? []
  const hasActiveActualCost = actualCosts.some(
    (actualCost) => actualCost.state === 'ACTIVE',
  )
  const canCreateActualCost =
    !actualCostsQuery.isPending &&
    !actualCostsQuery.isError &&
    plannedCost.state === 'ACTIVE' &&
    !hasActiveActualCost
  const showCreateActualCostAction =
    financeCapabilities.canCreateActualCost && canCreateActualCost
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
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack spacing={3}>
        <Stack
          alignItems={{ xs: 'flex-start', md: 'center' }}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Фактические расходы</Typography>
            <Typography color="text.secondary">
              Здесь фиксируются реальные расходы по этой плановой записи.
            </Typography>
          </Stack>

          {showCreateActualCostAction ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Скрыть форму' : 'Добавить факт расхода'}
            </Button>
          ) : null}
        </Stack>

        {financeCapabilities.canCreateActualCost ? (
          <Collapse in={showCreateActualCostAction && isCreateFormOpen} unmountOnExit>
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

        {actualCostsQuery.isPending ? (
          <LoadingState
            description="Загружаем фактические расходы, связанные с этой плановой записью."
            title="Загружаем фактические расходы"
          />
        ) : null}

        {actualCostsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualCostsQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={actualCostsQuery.error.message}
            title="Не удалось загрузить фактические расходы"
          />
        ) : null}

        {!actualCostsQuery.isPending &&
        !actualCostsQuery.isError &&
        actualCosts.length === 0 ? (
          <EmptyState
            action={
              showCreateActualCostAction && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить факт расхода
                </Button>
              ) : undefined
            }
            description={
              financeCapabilities.canCreateActualCost
                ? 'По этой плановой записи пока нет фактических расходов. Добавьте первый расход, чтобы зафиксировать списание денег.'
                : 'По этой плановой записи пока нет фактических расходов.'
            }
            title="Фактических расходов пока нет"
          />
        ) : null}

        {!actualCostsQuery.isPending &&
        !actualCostsQuery.isError &&
        actualCosts.length > 0 ? (
          <Stack spacing={2}>
            {actualCosts.map((actualCost) => (
              <ActualCostListItem
                actualCost={actualCost}
                canArchiveActualCost={financeCapabilities.canArchiveActualCost}
                isArchiving={archivingId === actualCost.id}
                key={actualCost.id}
                onArchive={handleArchive}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

function ActualCostListItem({
  actualCost,
  canArchiveActualCost,
  isArchiving,
  onArchive,
}: {
  actualCost: ActualCost
  canArchiveActualCost: boolean
  isArchiving: boolean
  onArchive: (actualCost: ActualCost) => Promise<void>
}) {
  const isArchived = actualCost.state !== 'ACTIVE'

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={3}
      >
        <Stack spacing={1.5} sx={{ flex: 1 }}>
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

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <MetaItem label="Версия" value={String(actualCost.version)} />
            <MetaItem
              label="Создано"
              value={formatDateTime(actualCost.createdAt)}
            />
            <MetaItem
              label="Обновлено"
              value={formatDateTime(actualCost.updatedAt)}
            />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(actualCost.archivedAt)}
            />
          </Stack>
        </Stack>

        {canArchiveActualCost ? (
          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <ArchiveActionButton
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(actualCost)}
            />
          </Stack>
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
    return 'Проверяем фактические расходы перед открытием редактирования.'
  }

  if (hasActualCostsError) {
    return 'Сначала дождитесь успешной загрузки фактических расходов.'
  }

  if (actualCosts.some((actualCost) => actualCost.state === 'ACTIVE')) {
    if (plannedCostStatus === 'RECEIVED') {
      return 'Полное редактирование недоступно, пока существует активный фактический расход. Сначала верните статус назад и отправьте факт в архив.'
    }

    return 'Чтобы редактировать запись, сначала отправьте активный фактический расход в архив.'
  }

  return null
}
