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
  useActualPayments,
  useArchiveActualPayment,
} from '../../entities/actual-payment/api/actual-payment.query'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import {
  useArchivePlannedPayment,
  usePlannedPayments,
} from '../../entities/planned-payment/api/planned-payment.query'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import { CreateActualPaymentForm } from '../../features/actual-payment/create-actual-payment/ui/CreateActualPaymentForm'
import { ChangePlannedPaymentStatusForm } from '../../features/planned-payment/change-planned-payment-status/ui/ChangePlannedPaymentStatusForm'
import { EditPlannedPaymentForm } from '../../features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm'
import { CreatePlannedPaymentForm } from '../../features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm'
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

interface PlannedPaymentBlockProps {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
  sectionFinancePlanId: string
  sectionFinancePlanName: string
}

export function PlannedPaymentBlock({
  availableSectionFinancePlans,
  financeCapabilities,
  projectFinanceId,
  sectionFinancePlanId,
  sectionFinancePlanName,
}: PlannedPaymentBlockProps) {
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const archivePlannedPaymentMutation = useArchivePlannedPayment()
  const canCreatePlannedPayment = financeCapabilities.canCreatePlannedPayment
  const plannedPayments = (plannedPaymentsQuery.data?.items ?? []).filter(
    (plannedPayment) =>
      plannedPayment.sectionFinancePlanIds.includes(sectionFinancePlanId),
  )
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (plannedPayment: PlannedPayment) => {
    if (
      !window.confirm(`Отправить в архив плановое поступление "${plannedPayment.name}"?`)
    ) {
      return
    }

    setArchiveError(null)
    setArchivingId(plannedPayment.id)

    try {
      await archivePlannedPaymentMutation.mutateAsync(plannedPayment.id)
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
            <Typography variant="h6">Плановые поступления</Typography>
            <Typography color="text.secondary">
              Здесь показаны ожидаемые поступления, связанные с этим разделом.
            </Typography>
          </Stack>

          {canCreatePlannedPayment ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Скрыть форму' : 'Добавить поступление'}
            </Button>
          ) : null}
        </Stack>

        {canCreatePlannedPayment ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
            <CreatePlannedPaymentForm
              projectFinanceId={projectFinanceId}
              sectionFinancePlanId={sectionFinancePlanId}
              sectionFinancePlanName={sectionFinancePlanName}
            />
          </Collapse>
        ) : null}

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Не удалось отправить плановое поступление в архив"
          />
        ) : null}

        {plannedPaymentsQuery.isPending ? (
          <LoadingState
            description="Загружаем плановые поступления для этого финансового плана."
            title="Загружаем плановые поступления"
          />
        ) : null}

        {plannedPaymentsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void plannedPaymentsQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={plannedPaymentsQuery.error.message}
            title="Не удалось загрузить плановые поступления"
          />
        ) : null}

        {!plannedPaymentsQuery.isPending &&
        !plannedPaymentsQuery.isError &&
        plannedPayments.length === 0 ? (
          <EmptyState
            action={
              canCreatePlannedPayment && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить поступление
                </Button>
              ) : undefined
            }
            description={
              canCreatePlannedPayment
                ? 'Для этого раздела пока нет плановых поступлений. Добавьте первое ожидаемое поступление.'
                : 'Для этого раздела пока нет плановых поступлений.'
            }
            title="Плановых поступлений пока нет"
          />
        ) : null}

        {!plannedPaymentsQuery.isPending &&
        !plannedPaymentsQuery.isError &&
        plannedPayments.length > 0 ? (
          <Stack spacing={2}>
            {plannedPayments.map((plannedPayment) => (
              <PlannedPaymentListItem
                availableSectionFinancePlans={availableSectionFinancePlans}
                financeCapabilities={financeCapabilities}
                isArchiving={archivingId === plannedPayment.id}
                key={plannedPayment.id}
                onArchive={handleArchive}
                plannedPayment={plannedPayment}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

function PlannedPaymentListItem({
  availableSectionFinancePlans,
  financeCapabilities,
  isArchiving,
  onArchive,
  plannedPayment,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  isArchiving: boolean
  onArchive: (plannedPayment: PlannedPayment) => Promise<void>
  plannedPayment: PlannedPayment
}) {
  const actualPaymentsQuery = useActualPayments({
    plannedPaymentId: plannedPayment.id,
  })
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isStatusFormOpen, setIsStatusFormOpen] = useState(false)
  const isArchived = plannedPayment.state !== 'ACTIVE'
  const hasActiveActualPayment = actualPayments.some(
    (actualPayment) => actualPayment.state === 'ACTIVE',
  )
  const showStatusChangeAction =
    financeCapabilities.canChangePlannedPaymentStatus &&
    !isArchived &&
    plannedPayment.status === 'RECEIVED' &&
    hasActiveActualPayment
  const editAvailabilityReason = getPlannedPaymentEditAvailabilityReason({
    actualPayments,
    hasActualPaymentsError: actualPaymentsQuery.isError,
    isActualPaymentsPending: actualPaymentsQuery.isPending,
    plannedPaymentStatus: plannedPayment.status,
  })
  const canEditPlannedPayment = financeCapabilities.canEditPlannedPayment
  const canArchivePlannedPayment = financeCapabilities.canArchivePlannedPayment
  const isEditFormVisible =
    canEditPlannedPayment &&
    !isArchived &&
    editAvailabilityReason === null &&
    isEditFormOpen
  const showActions =
    showStatusChangeAction || canEditPlannedPayment || canArchivePlannedPayment

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
              <Typography variant="subtitle1">{plannedPayment.name}</Typography>
              <FinanceStatusChip value={plannedPayment.status} />
              <FinanceStatusChip value={plannedPayment.state} />
            </Stack>

            <Typography color="text.secondary" variant="body2">
              Сумма: {formatAmount(plannedPayment.amount)}
            </Typography>

            {plannedPayment.conditionSource === 'DATE' ? (
              <Typography color="text.secondary" variant="body2">
                Плановая дата: {formatOptionalDate(plannedPayment.plannedDate)}
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">
                  Поступление ожидается только после того, как произойдут все выбранные проектные события и события раздела.
                </Typography>
                {plannedPayment.projectEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Проектные события"
                    values={plannedPayment.projectEventIds}
                  />
                ) : null}
                {plannedPayment.sectionEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="События раздела"
                    values={plannedPayment.sectionEventIds}
                  />
                ) : null}
              </Stack>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ flexWrap: 'wrap' }}
            >
              <MetaItem label="Версия" value={String(plannedPayment.version)} />
              <MetaItem
                label="Создано"
                value={formatDateTime(plannedPayment.createdAt)}
              />
              <MetaItem
                label="Обновлено"
                value={formatDateTime(plannedPayment.updatedAt)}
              />
              <MetaItem
                label="Фактическая дата"
                value={formatOptionalDate(plannedPayment.actualDate)}
              />
              <MetaItem
                label="В архиве с"
                value={formatOptionalDateTime(plannedPayment.archivedAt)}
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
              {canEditPlannedPayment ? (
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
              {canArchivePlannedPayment ? (
                <ArchiveActionButton
                  isArchived={isArchived}
                  isArchiving={isArchiving}
                  onClick={() => void onArchive(plannedPayment)}
                />
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <Collapse in={showStatusChangeAction && isStatusFormOpen} unmountOnExit>
          <ChangePlannedPaymentStatusForm
            onCancel={() => setIsStatusFormOpen(false)}
            onSuccess={() => setIsStatusFormOpen(false)}
            plannedPayment={plannedPayment}
          />
        </Collapse>

        {canEditPlannedPayment ? (
          <Collapse in={isEditFormVisible} unmountOnExit>
            <EditPlannedPaymentForm
              availableSectionFinancePlans={availableSectionFinancePlans}
              onCancel={() => setIsEditFormOpen(false)}
              onSuccess={() => setIsEditFormOpen(false)}
              plannedPayment={plannedPayment}
            />
          </Collapse>
        ) : null}

        <ActualPaymentSection
          financeCapabilities={financeCapabilities}
          plannedPayment={plannedPayment}
        />
      </Stack>
    </Paper>
  )
}

function ActualPaymentSection({
  financeCapabilities,
  plannedPayment,
}: {
  financeCapabilities: FinanceCapabilities
  plannedPayment: PlannedPayment
}) {
  const actualPaymentsQuery = useActualPayments({
    plannedPaymentId: plannedPayment.id,
  })
  const archiveActualPaymentMutation = useArchiveActualPayment()
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const hasActiveActualPayment = actualPayments.some(
    (actualPayment) => actualPayment.state === 'ACTIVE',
  )
  const canCreateActualPayment =
    !actualPaymentsQuery.isPending &&
    !actualPaymentsQuery.isError &&
    plannedPayment.state === 'ACTIVE' &&
    !hasActiveActualPayment
  const showCreateActualPaymentAction =
    financeCapabilities.canCreateActualPayment && canCreateActualPayment
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (actualPayment: ActualPayment) => {
    if (
      !window.confirm(
        `Отправить в архив фактическое поступление от ${formatDate(actualPayment.actualDate)}?`,
      )
    ) {
      return
    }

    setArchiveError(null)
    setArchivingId(actualPayment.id)

    try {
      await archiveActualPaymentMutation.mutateAsync(actualPayment.id)
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
            <Typography variant="h6">Фактические поступления</Typography>
            <Typography color="text.secondary">
              Здесь фиксируются реальные поступления по этой плановой записи.
            </Typography>
          </Stack>

          {showCreateActualPaymentAction ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Скрыть форму' : 'Добавить факт поступления'}
            </Button>
          ) : null}
        </Stack>

        {financeCapabilities.canCreateActualPayment ? (
          <Collapse in={showCreateActualPaymentAction && isCreateFormOpen} unmountOnExit>
            <CreateActualPaymentForm
              onSuccess={() => setIsCreateFormOpen(false)}
              plannedPaymentId={plannedPayment.id}
              plannedPaymentName={plannedPayment.name}
              projectFinanceId={plannedPayment.projectFinanceId}
            />
          </Collapse>
        ) : null}

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Не удалось отправить фактическое поступление в архив"
          />
        ) : null}

        {actualPaymentsQuery.isPending ? (
          <LoadingState
            description="Загружаем фактические поступления, связанные с этой плановой записью."
            title="Загружаем фактические поступления"
          />
        ) : null}

        {actualPaymentsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualPaymentsQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={actualPaymentsQuery.error.message}
            title="Не удалось загрузить фактические поступления"
          />
        ) : null}

        {!actualPaymentsQuery.isPending &&
        !actualPaymentsQuery.isError &&
        actualPayments.length === 0 ? (
          <EmptyState
            action={
              showCreateActualPaymentAction && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить факт поступления
                </Button>
              ) : undefined
            }
            description={
              financeCapabilities.canCreateActualPayment
                ? 'По этой плановой записи пока нет фактических поступлений. Добавьте первое поступление, чтобы зафиксировать получение денег.'
                : 'По этой плановой записи пока нет фактических поступлений.'
            }
            title="Фактических поступлений пока нет"
          />
        ) : null}

        {!actualPaymentsQuery.isPending &&
        !actualPaymentsQuery.isError &&
        actualPayments.length > 0 ? (
          <Stack spacing={2}>
            {actualPayments.map((actualPayment) => (
              <ActualPaymentListItem
                actualPayment={actualPayment}
                canArchiveActualPayment={financeCapabilities.canArchiveActualPayment}
                isArchiving={archivingId === actualPayment.id}
                key={actualPayment.id}
                onArchive={handleArchive}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

function ActualPaymentListItem({
  actualPayment,
  canArchiveActualPayment,
  isArchiving,
  onArchive,
}: {
  actualPayment: ActualPayment
  canArchiveActualPayment: boolean
  isArchiving: boolean
  onArchive: (actualPayment: ActualPayment) => Promise<void>
}) {
  const isArchived = actualPayment.state !== 'ACTIVE'

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
              Дата поступления: {formatDate(actualPayment.actualDate)}
            </Typography>
            <FinanceStatusChip value={actualPayment.state} />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            Сумма: {formatAmount(actualPayment.amount)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Комментарий: {actualPayment.comment ?? 'Без комментария'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <MetaItem label="Версия" value={String(actualPayment.version)} />
            <MetaItem
              label="Создано"
              value={formatDateTime(actualPayment.createdAt)}
            />
            <MetaItem
              label="Обновлено"
              value={formatDateTime(actualPayment.updatedAt)}
            />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(actualPayment.archivedAt)}
            />
          </Stack>
        </Stack>

        {canArchiveActualPayment ? (
          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <ArchiveActionButton
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(actualPayment)}
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

function getPlannedPaymentEditAvailabilityReason({
  actualPayments,
  hasActualPaymentsError,
  isActualPaymentsPending,
  plannedPaymentStatus,
}: {
  actualPayments: ActualPayment[]
  hasActualPaymentsError: boolean
  isActualPaymentsPending: boolean
  plannedPaymentStatus: PlannedPayment['status']
}) {
  if (isActualPaymentsPending) {
    return 'Проверяем фактические поступления перед открытием редактирования.'
  }

  if (hasActualPaymentsError) {
    return 'Сначала дождитесь успешной загрузки фактических поступлений.'
  }

  if (actualPayments.some((actualPayment) => actualPayment.state === 'ACTIVE')) {
    if (plannedPaymentStatus === 'RECEIVED') {
      return 'Полное редактирование недоступно, пока существует активное фактическое поступление. Сначала верните статус назад и отправьте факт в архив.'
    }

    return 'Чтобы редактировать запись, сначала отправьте активное фактическое поступление в архив.'
  }

  return null
}
