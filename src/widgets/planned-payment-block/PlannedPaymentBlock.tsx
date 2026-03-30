import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
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
import { EditPlannedPaymentForm } from '../../features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm'
import { CreatePlannedPaymentForm } from '../../features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
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
  projectFinanceId: string
  sectionFinancePlanId: string
  sectionFinancePlanName: string
}

export function PlannedPaymentBlock({
  availableSectionFinancePlans,
  projectFinanceId,
  sectionFinancePlanId,
  sectionFinancePlanName,
}: PlannedPaymentBlockProps) {
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const archivePlannedPaymentMutation = useArchivePlannedPayment()
  const plannedPayments = (plannedPaymentsQuery.data?.items ?? []).filter(
    (plannedPayment) =>
      plannedPayment.sectionFinancePlanIds.includes(sectionFinancePlanId),
  )
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (plannedPayment: PlannedPayment) => {
    if (
      !window.confirm(`Archive planned payment "${plannedPayment.name}"?`)
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
            <Typography variant="h6">Planned payments</Typography>
            <Typography color="text.secondary">
              Manage planned incoming money movements linked to this section.
            </Typography>
          </Stack>

          <Button
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Hide form' : 'Add payment'}
          </Button>
        </Stack>

        <Collapse in={isCreateFormOpen} unmountOnExit>
          <CreatePlannedPaymentForm
            projectFinanceId={projectFinanceId}
            sectionFinancePlanId={sectionFinancePlanId}
            sectionFinancePlanName={sectionFinancePlanName}
          />
        </Collapse>

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Failed to archive planned payment"
          />
        ) : null}

        {plannedPaymentsQuery.isPending ? (
          <LoadingState
            description="Loading planned payments for this project finance."
            title="Loading planned payments"
          />
        ) : null}

        {plannedPaymentsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void plannedPaymentsQuery.refetch()} variant="contained">
                Retry
              </Button>
            }
            description={plannedPaymentsQuery.error.message}
            title="Failed to load planned payments"
          />
        ) : null}

        {!plannedPaymentsQuery.isPending &&
        !plannedPaymentsQuery.isError &&
        plannedPayments.length === 0 ? (
          <EmptyState
            action={
              !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Add payment
                </Button>
              ) : undefined
            }
            description="No planned payments are linked to this section yet. Create the first planned incoming movement here."
            title="No planned payments yet"
          />
        ) : null}

        {!plannedPaymentsQuery.isPending &&
        !plannedPaymentsQuery.isError &&
        plannedPayments.length > 0 ? (
          <Stack spacing={2}>
            {plannedPayments.map((plannedPayment) => (
              <PlannedPaymentListItem
                availableSectionFinancePlans={availableSectionFinancePlans}
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
  isArchiving,
  onArchive,
  plannedPayment,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  isArchiving: boolean
  onArchive: (plannedPayment: PlannedPayment) => Promise<void>
  plannedPayment: PlannedPayment
}) {
  const actualPaymentsQuery = useActualPayments({
    plannedPaymentId: plannedPayment.id,
  })
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const isArchived = plannedPayment.state !== 'ACTIVE'
  const editAvailabilityReason = getPlannedPaymentEditAvailabilityReason({
    actualPayments,
    hasActualPaymentsError: actualPaymentsQuery.isError,
    isActualPaymentsPending: actualPaymentsQuery.isPending,
  })
  const isEditFormVisible = !isArchived && editAvailabilityReason === null && isEditFormOpen

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
              Amount: {formatAmount(plannedPayment.amount)}
            </Typography>

            {plannedPayment.conditionSource === 'DATE' ? (
              <Typography color="text.secondary" variant="body2">
                Planned date: {formatOptionalDate(plannedPayment.plannedDate)}
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">
                  Condition: all selected project and section events must occur.
                </Typography>
                {plannedPayment.projectEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Project events"
                    values={plannedPayment.projectEventIds}
                  />
                ) : null}
                {plannedPayment.sectionEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Section events"
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
              <MetaItem label="Version" value={String(plannedPayment.version)} />
              <MetaItem
                label="Created"
                value={formatDateTime(plannedPayment.createdAt)}
              />
              <MetaItem
                label="Updated"
                value={formatDateTime(plannedPayment.updatedAt)}
              />
              <MetaItem
                label="Actual date"
                value={formatOptionalDate(plannedPayment.actualDate)}
              />
              <MetaItem
                label="Archived"
                value={formatOptionalDateTime(plannedPayment.archivedAt)}
              />
            </Stack>
          </Stack>

          <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
            <Button
              disabled={isArchived || editAvailabilityReason !== null}
              onClick={() => setIsEditFormOpen((current) => !current)}
              startIcon={<EditOutlinedIcon />}
              variant="outlined"
            >
              {isEditFormVisible ? 'Hide form' : 'Edit'}
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
            <ArchiveActionButton
              isArchived={isArchived}
              isArchiving={isArchiving}
              onClick={() => void onArchive(plannedPayment)}
            />
          </Stack>
        </Stack>

        <Collapse in={isEditFormVisible} unmountOnExit>
          <EditPlannedPaymentForm
            availableSectionFinancePlans={availableSectionFinancePlans}
            onCancel={() => setIsEditFormOpen(false)}
            onSuccess={() => setIsEditFormOpen(false)}
            plannedPayment={plannedPayment}
          />
        </Collapse>

        <ActualPaymentSection plannedPayment={plannedPayment} />
      </Stack>
    </Paper>
  )
}

function ActualPaymentSection({
  plannedPayment,
}: {
  plannedPayment: PlannedPayment
}) {
  const actualPaymentsQuery = useActualPayments({
    plannedPaymentId: plannedPayment.id,
  })
  const archiveActualPaymentMutation = useArchiveActualPayment()
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (actualPayment: ActualPayment) => {
    if (
      !window.confirm(
        `Archive actual payment for ${formatDate(actualPayment.actualDate)}?`,
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
            <Typography variant="h6">Actual payments</Typography>
            <Typography color="text.secondary">
              Register and archive factual incoming movements for this planned
              payment.
            </Typography>
          </Stack>

          {actualPayments.length === 0 ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Hide form' : 'Add actual payment'}
            </Button>
          ) : null}
        </Stack>

        <Collapse in={isCreateFormOpen} unmountOnExit>
          <CreateActualPaymentForm
            onSuccess={() => setIsCreateFormOpen(false)}
            plannedPaymentId={plannedPayment.id}
            plannedPaymentName={plannedPayment.name}
            projectFinanceId={plannedPayment.projectFinanceId}
          />
        </Collapse>

        {archiveError ? (
          <ErrorState
            description={archiveError}
            title="Failed to archive actual payment"
          />
        ) : null}

        {actualPaymentsQuery.isPending ? (
          <LoadingState
            description="Loading actual payments linked to this planned payment."
            title="Loading actual payments"
          />
        ) : null}

        {actualPaymentsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualPaymentsQuery.refetch()} variant="contained">
                Retry
              </Button>
            }
            description={actualPaymentsQuery.error.message}
            title="Failed to load actual payments"
          />
        ) : null}

        {!actualPaymentsQuery.isPending &&
        !actualPaymentsQuery.isError &&
        actualPayments.length === 0 ? (
          <EmptyState
            action={
              !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Add actual payment
                </Button>
              ) : undefined
            }
            description="Actual incoming payments have not been registered for this planned payment yet. Add the first factual payment to record receipt."
            title="No actual payments yet"
          />
        ) : null}

        {!actualPaymentsQuery.isPending &&
        !actualPaymentsQuery.isError &&
        actualPayments.length > 0 ? (
          <Stack spacing={2}>
            {actualPayments.map((actualPayment) => (
              <ActualPaymentListItem
                actualPayment={actualPayment}
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
  isArchiving,
  onArchive,
}: {
  actualPayment: ActualPayment
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
              Actual date: {formatDate(actualPayment.actualDate)}
            </Typography>
            <FinanceStatusChip value={actualPayment.state} />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            Amount: {formatAmount(actualPayment.amount)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Comment: {actualPayment.comment ?? 'No comment'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <MetaItem label="Version" value={String(actualPayment.version)} />
            <MetaItem
              label="Created"
              value={formatDateTime(actualPayment.createdAt)}
            />
            <MetaItem
              label="Updated"
              value={formatDateTime(actualPayment.updatedAt)}
            />
            <MetaItem
              label="Archived"
              value={formatOptionalDateTime(actualPayment.archivedAt)}
            />
          </Stack>
        </Stack>

        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <ArchiveActionButton
            isArchived={isArchived}
            isArchiving={isArchiving}
            onClick={() => void onArchive(actualPayment)}
          />
        </Stack>
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
}: {
  actualPayments: ActualPayment[]
  hasActualPaymentsError: boolean
  isActualPaymentsPending: boolean
}) {
  if (isActualPaymentsPending) {
    return 'Checking actual payments before enabling edit.'
  }

  if (hasActualPaymentsError) {
    return 'Load actual payments successfully before editing this planned payment.'
  }

  if (actualPayments.some((actualPayment) => actualPayment.state === 'ACTIVE')) {
    return 'Archive the active actual payment to edit this planned payment.'
  }

  return null
}
