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
    if (!window.confirm(`Archive planned cost "${plannedCost.name}"?`)) {
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
            <Typography variant="h6">Planned costs</Typography>
            <Typography color="text.secondary">
              Manage planned outgoing money movements linked to this section.
            </Typography>
          </Stack>

          {canCreatePlannedCost ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Hide form' : 'Add cost'}
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
            title="Failed to archive planned cost"
          />
        ) : null}

        {plannedCostsQuery.isPending ? (
          <LoadingState
            description="Loading planned costs for this project finance."
            title="Loading planned costs"
          />
        ) : null}

        {plannedCostsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void plannedCostsQuery.refetch()} variant="contained">
                Retry
              </Button>
            }
            description={plannedCostsQuery.error.message}
            title="Failed to load planned costs"
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
                  Add cost
                </Button>
              ) : undefined
            }
            description={
              canCreatePlannedCost
                ? 'No planned costs are linked to this section yet. Create the first planned outgoing movement here.'
                : 'No planned costs are linked to this section yet.'
            }
            title="No planned costs yet"
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
              Amount: {formatAmount(plannedCost.amount)}
            </Typography>

            {plannedCost.conditionSource === 'DATE' ? (
              <Typography color="text.secondary" variant="body2">
                Planned date: {formatOptionalDate(plannedCost.plannedDate)}
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">
                  Condition: all selected project and section events must occur.
                </Typography>
                {plannedCost.projectEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Project events"
                    values={plannedCost.projectEventIds}
                  />
                ) : null}
                {plannedCost.sectionEventIds.length > 0 ? (
                  <IdentifierGroup
                    label="Section events"
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
              <MetaItem label="Version" value={String(plannedCost.version)} />
              <MetaItem
                label="Created"
                value={formatDateTime(plannedCost.createdAt)}
              />
              <MetaItem
                label="Updated"
                value={formatDateTime(plannedCost.updatedAt)}
              />
              <MetaItem
                label="Actual date"
                value={formatOptionalDate(plannedCost.actualDate)}
              />
              <MetaItem
                label="Archived"
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
                  {isStatusFormOpen ? 'Hide status action' : 'Change status'}
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
      !window.confirm(`Archive actual cost for ${formatDate(actualCost.actualDate)}?`)
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
            <Typography variant="h6">Actual costs</Typography>
            <Typography color="text.secondary">
              Register and archive factual outgoing movements for this planned
              cost.
            </Typography>
          </Stack>

          {showCreateActualCostAction ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              {isCreateFormOpen ? 'Hide form' : 'Add actual cost'}
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
            title="Failed to archive actual cost"
          />
        ) : null}

        {actualCostsQuery.isPending ? (
          <LoadingState
            description="Loading actual costs linked to this planned cost."
            title="Loading actual costs"
          />
        ) : null}

        {actualCostsQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void actualCostsQuery.refetch()} variant="contained">
                Retry
              </Button>
            }
            description={actualCostsQuery.error.message}
            title="Failed to load actual costs"
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
                  Add actual cost
                </Button>
              ) : undefined
            }
            description={
              financeCapabilities.canCreateActualCost
                ? 'Actual outgoing costs have not been registered for this planned cost yet. Add the first factual cost to record the expense.'
                : 'Actual outgoing costs have not been registered for this planned cost yet.'
            }
            title="No actual costs yet"
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
              Actual date: {formatDate(actualCost.actualDate)}
            </Typography>
            <FinanceStatusChip value={actualCost.state} />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            Amount: {formatAmount(actualCost.amount)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Comment: {actualCost.comment ?? 'No comment'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <MetaItem label="Version" value={String(actualCost.version)} />
            <MetaItem
              label="Created"
              value={formatDateTime(actualCost.createdAt)}
            />
            <MetaItem
              label="Updated"
              value={formatDateTime(actualCost.updatedAt)}
            />
            <MetaItem
              label="Archived"
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
    return 'Checking actual costs before enabling edit.'
  }

  if (hasActualCostsError) {
    return 'Load actual costs successfully before editing this planned cost.'
  }

  if (actualCosts.some((actualCost) => actualCost.state === 'ACTIVE')) {
    if (plannedCostStatus === 'RECEIVED') {
      return 'Full edit is locked while an active actual cost exists. Use status change to archive it first.'
    }

    return 'Archive the active actual cost to edit this planned cost.'
  }

  return null
}
