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
  useActualPayments,
  useArchiveActualPayment,
} from '../../entities/actual-payment/api/actual-payment.query'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import {
  useArchivePlannedPayment,
  usePlannedPayments,
} from '../../entities/planned-payment/api/planned-payment.query'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import { CreateActualPaymentForm } from '../../features/actual-payment/create-actual-payment/ui/CreateActualPaymentForm'
import { ChangePlannedPaymentStatusForm } from '../../features/planned-payment/change-planned-payment-status/ui/ChangePlannedPaymentStatusForm'
import { CreatePlannedPaymentForm } from '../../features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm'
import { EditPlannedPaymentForm } from '../../features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm'
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
  const totalAmount = plannedPayments.reduce(
    (total, plannedPayment) => total + toNumericAmount(plannedPayment.amount),
    0,
  )
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const createReason = canCreatePlannedPayment
    ? 'Можно добавить новое плановое поступление для этого раздела.'
    : financeCapabilities.readOnlyReason ??
      'Создавать плановые поступления можно только с правом редактирования.'

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
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Button
            disabled={!canCreatePlannedPayment}
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить поступление'}
          </Button>
          <ActionAvailabilityHint message={createReason} />
        </Stack>
      }
      defaultExpanded={false}
      subtitle="Ожидаемые поступления, связанные с этим разделом."
      summary={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <SummaryBadge label="Записей" value={String(plannedPayments.length)} />
          <SummaryBadge label="Сумма" value={formatAmount(totalAmount)} />
        </Stack>
      }
      surface="paper"
      title="Плановые поступления"
    >
      <Stack spacing={3}>
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
    </CollapsibleSectionCard>
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
  const canEditPlannedPayment = financeCapabilities.canEditPlannedPayment
  const canArchivePlannedPayment = financeCapabilities.canArchivePlannedPayment
  const canChangeStatus = financeCapabilities.canChangePlannedPaymentStatus
  const editAvailabilityReason = getPlannedPaymentEditAvailabilityReason({
    actualPayments,
    hasActualPaymentsError: actualPaymentsQuery.isError,
    isActualPaymentsPending: actualPaymentsQuery.isPending,
    plannedPaymentStatus: plannedPayment.status,
  })
  const canOpenEditForm =
    canEditPlannedPayment && !isArchived && editAvailabilityReason === null
  const showStatusChangeAction =
    canChangeStatus &&
    !isArchived &&
    plannedPayment.status === 'RECEIVED' &&
    hasActiveActualPayment
  const actionHint = getPlannedPaymentActionHint({
    canArchivePlannedPayment,
    canEditPlannedPayment,
    editAvailabilityReason,
    isArchived,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })

  return (
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {canChangeStatus || plannedPayment.status === 'RECEIVED' ? (
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
              disabled={!canArchivePlannedPayment}
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(plannedPayment)}
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
            <SummaryBadge label="Сумма" value={formatAmount(plannedPayment.amount)} />
            <FinanceStatusChip value={plannedPayment.status} />
            <FinanceStatusChip value={plannedPayment.state} />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {getPlannedPaymentConditionPreview(plannedPayment)}
          </Typography>
        </Stack>
      }
      surface="paper"
      title={plannedPayment.name}
    >
      <Stack spacing={3}>
        <DetailedPlannedPaymentCondition plannedPayment={plannedPayment} />

        <Paper sx={{ p: 2 }} variant="outlined">
          <Stack spacing={0.5}>
            <Typography color="text.secondary" variant="caption">
              Фактическая дата
            </Typography>
            <Typography variant="body2">
              {formatOptionalDate(plannedPayment.actualDate, 'Факт пока не зафиксирован')}
            </Typography>
          </Stack>
        </Paper>

        <Collapse in={isEditFormOpen && canOpenEditForm} unmountOnExit>
          <EditPlannedPaymentForm
            availableSectionFinancePlans={availableSectionFinancePlans}
            onCancel={() => setIsEditFormOpen(false)}
            onSuccess={() => setIsEditFormOpen(false)}
            plannedPayment={plannedPayment}
          />
        </Collapse>

        <Collapse in={showStatusChangeAction && isStatusFormOpen} unmountOnExit>
          <ChangePlannedPaymentStatusForm
            onCancel={() => setIsStatusFormOpen(false)}
            onSuccess={() => setIsStatusFormOpen(false)}
            plannedPayment={plannedPayment}
          />
        </Collapse>

        <ActualPaymentSection
          actualPayments={actualPayments}
          actualPaymentsErrorMessage={
            actualPaymentsQuery.isError ? actualPaymentsQuery.error.message : null
          }
          actualPaymentsRefetch={() => actualPaymentsQuery.refetch()}
          financeCapabilities={financeCapabilities}
          isActualPaymentsError={actualPaymentsQuery.isError}
          isActualPaymentsPending={actualPaymentsQuery.isPending}
          plannedPayment={plannedPayment}
        />

        <TechnicalDetailsSection subtitle="Версия записи и даты, которые полезны для проверки истории планового поступления.">
          <Stack divider={<Divider flexItem />} spacing={2}>
            <MetaItem label="Версия" value={String(plannedPayment.version)} />
            <MetaItem label="Создано" value={formatDateTime(plannedPayment.createdAt)} />
            <MetaItem label="Обновлено" value={formatDateTime(plannedPayment.updatedAt)} />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(plannedPayment.archivedAt, 'Не архивировано')}
            />
            <MetaItem
              label="Удалено"
              value={formatOptionalDateTime(plannedPayment.deletedAt, 'Не удалено')}
            />
          </Stack>
        </TechnicalDetailsSection>
      </Stack>
    </CollapsibleSectionCard>
  )
}

function ActualPaymentSection({
  actualPayments,
  actualPaymentsErrorMessage,
  actualPaymentsRefetch,
  financeCapabilities,
  isActualPaymentsError,
  isActualPaymentsPending,
  plannedPayment,
}: {
  actualPayments: ActualPayment[]
  actualPaymentsErrorMessage: string | null
  actualPaymentsRefetch: () => Promise<unknown>
  financeCapabilities: FinanceCapabilities
  isActualPaymentsError: boolean
  isActualPaymentsPending: boolean
  plannedPayment: PlannedPayment
}) {
  const archiveActualPaymentMutation = useArchiveActualPayment()
  const hasActiveActualPayment = actualPayments.some(
    (actualPayment) => actualPayment.state === 'ACTIVE',
  )
  const canCreateActualPayment =
    !isActualPaymentsPending &&
    !isActualPaymentsError &&
    plannedPayment.state === 'ACTIVE' &&
    !hasActiveActualPayment
  const createActualPaymentHint = getActualPaymentCreateHint({
    canCreateActualPayment: financeCapabilities.canCreateActualPayment,
    hasActiveActualPayment,
    isActualPaymentsError,
    isActualPaymentsPending,
    plannedPaymentState: plannedPayment.state,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })
  const totalAmount = actualPayments.reduce(
    (total, actualPayment) => total + toNumericAmount(actualPayment.amount),
    0,
  )
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
    <CollapsibleSectionCard
      actions={
        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Button
            disabled={!financeCapabilities.canCreateActualPayment || !canCreateActualPayment}
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить факт поступления'}
          </Button>
          <ActionAvailabilityHint message={createActualPaymentHint} />
        </Stack>
      }
      defaultExpanded={false}
      subtitle="Реально зафиксированные поступления по этой плановой записи."
      summary={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <SummaryBadge label="Записей" value={String(actualPayments.length)} />
          <SummaryBadge label="Сумма" value={formatAmount(totalAmount)} />
        </Stack>
      }
      surface="paper"
      title="Фактические поступления"
    >
      <Stack spacing={3}>
        {financeCapabilities.canCreateActualPayment && canCreateActualPayment ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
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

        {isActualPaymentsPending ? (
          <LoadingState
            description="Загружаем фактические поступления, связанные с этой плановой записью."
            title="Загружаем фактические поступления"
          />
        ) : null}

        {isActualPaymentsError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualPaymentsRefetch()} variant="contained">
                Повторить
              </Button>
            }
            description={actualPaymentsErrorMessage ?? 'Не удалось загрузить фактические поступления.'}
            title="Не удалось загрузить фактические поступления"
          />
        ) : null}

        {!isActualPaymentsPending &&
        !isActualPaymentsError &&
        actualPayments.length === 0 ? (
          <EmptyState
            action={
              financeCapabilities.canCreateActualPayment &&
              canCreateActualPayment &&
              !isCreateFormOpen ? (
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
                ? 'По этой плановой записи пока нет фактических поступлений.'
                : 'По этой плановой записи пока нет фактических поступлений.'
            }
            title="Фактических поступлений пока нет"
          />
        ) : null}

        {!isActualPaymentsPending &&
        !isActualPaymentsError &&
        actualPayments.length > 0 ? (
          <Stack spacing={2}>
            {actualPayments.map((actualPayment) => (
              <ActualPaymentListItem
                actualPayment={actualPayment}
                canArchiveActualPayment={financeCapabilities.canArchiveActualPayment}
                isArchiving={archivingId === actualPayment.id}
                key={actualPayment.id}
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

function ActualPaymentListItem({
  actualPayment,
  canArchiveActualPayment,
  isArchiving,
  onArchive,
  readOnlyReason,
}: {
  actualPayment: ActualPayment
  canArchiveActualPayment: boolean
  isArchiving: boolean
  onArchive: (actualPayment: ActualPayment) => Promise<void>
  readOnlyReason: string | null
}) {
  const isArchived = actualPayment.state !== 'ACTIVE'
  const archiveHint = canArchiveActualPayment
    ? isArchived
      ? 'Архивная запись доступна только для просмотра.'
      : 'Можно отправить запись в архив, если факт больше не должен считаться активным.'
    : readOnlyReason ??
      'Архивировать фактические поступления можно только с правом редактирования.'

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
          </Stack>

          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <ArchiveActionButton
              disabled={!canArchiveActualPayment}
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(actualPayment)}
            />
            <ActionAvailabilityHint message={archiveHint} />
          </Stack>
        </Stack>

        <TechnicalDetailsSection subtitle="Технические поля фактической записи скрыты по умолчанию.">
          <Stack divider={<Divider flexItem />} spacing={2}>
            <MetaItem label="Версия" value={String(actualPayment.version)} />
            <MetaItem label="Создано" value={formatDateTime(actualPayment.createdAt)} />
            <MetaItem label="Обновлено" value={formatDateTime(actualPayment.updatedAt)} />
            <MetaItem
              label="В архиве с"
              value={formatOptionalDateTime(actualPayment.archivedAt, 'Не архивировано')}
            />
            <MetaItem
              label="Удалено"
              value={formatOptionalDateTime(actualPayment.deletedAt, 'Не удалено')}
            />
          </Stack>
        </TechnicalDetailsSection>
      </Stack>
    </Paper>
  )
}

function DetailedPlannedPaymentCondition({
  plannedPayment,
}: {
  plannedPayment: PlannedPayment
}) {
  if (plannedPayment.conditionSource === 'DATE') {
    return (
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Подробное условие</Typography>
          <Typography color="text.secondary" variant="body2">
            Поступление ожидается к дате {formatOptionalDate(plannedPayment.plannedDate)}.
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
          Поступление ожидается только после того, как произойдут все выбранные проектные события и события раздела.
        </Typography>
        {plannedPayment.projectEventIds.length > 0 ? (
          <IdentifierGroup
            label="Связанные проектные события"
            values={plannedPayment.projectEventIds}
          />
        ) : null}
        {plannedPayment.sectionEventIds.length > 0 ? (
          <IdentifierGroup
            label="Связанные события раздела"
            values={plannedPayment.sectionEventIds}
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

function getPlannedPaymentConditionPreview(plannedPayment: PlannedPayment) {
  if (plannedPayment.conditionSource === 'DATE') {
    return `По дате: ${formatOptionalDate(plannedPayment.plannedDate)}`
  }

  const totalEventCount =
    plannedPayment.projectEventIds.length + plannedPayment.sectionEventIds.length

  return totalEventCount > 0
    ? `По событиям: выбрано ${totalEventCount} шт.`
    : 'По событиям: список событий пока не заполнен'
}

function getPlannedPaymentActionHint({
  canArchivePlannedPayment,
  canEditPlannedPayment,
  editAvailabilityReason,
  isArchived,
  readOnlyReason,
}: {
  canArchivePlannedPayment: boolean
  canEditPlannedPayment: boolean
  editAvailabilityReason: string | null
  isArchived: boolean
  readOnlyReason: string | null
}) {
  if (!canEditPlannedPayment || !canArchivePlannedPayment) {
    return (
      readOnlyReason ??
      'Редактировать и архивировать плановые поступления можно только с правом редактирования.'
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

function getActualPaymentCreateHint({
  canCreateActualPayment,
  hasActiveActualPayment,
  isActualPaymentsError,
  isActualPaymentsPending,
  plannedPaymentState,
  readOnlyReason,
}: {
  canCreateActualPayment: boolean
  hasActiveActualPayment: boolean
  isActualPaymentsError: boolean
  isActualPaymentsPending: boolean
  plannedPaymentState: PlannedPayment['state']
  readOnlyReason: string | null
}) {
  if (!canCreateActualPayment) {
    return (
      readOnlyReason ??
      'Фиксировать фактические поступления можно только с правом редактирования.'
    )
  }

  if (plannedPaymentState !== 'ACTIVE') {
    return 'Добавить факт можно только для активной плановой записи.'
  }

  if (isActualPaymentsPending) {
    return 'Сначала дождитесь загрузки уже существующих фактических поступлений.'
  }

  if (isActualPaymentsError) {
    return 'Сначала нужно успешно загрузить фактические поступления по этой записи.'
  }

  if (hasActiveActualPayment) {
    return 'По этой записи уже есть активный факт поступления.'
  }

  return 'Можно зафиксировать реальное поступление по этой записи.'
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
    return 'Перед редактированием нужно проверить, есть ли по записи фактические поступления.'
  }

  if (hasActualPaymentsError) {
    return 'Редактирование станет доступно после успешной загрузки фактических поступлений.'
  }

  if (actualPayments.some((actualPayment) => actualPayment.state === 'ACTIVE')) {
    if (plannedPaymentStatus === 'RECEIVED') {
      return 'Пока по записи есть активный факт и статус "Получено", редактирование закрыто. Сначала верните статус назад и отправьте факт в архив.'
    }

    return 'Пока по записи есть активный факт поступления, редактирование недоступно.'
  }

  return null
}
