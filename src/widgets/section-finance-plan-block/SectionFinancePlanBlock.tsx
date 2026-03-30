import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Button, Collapse, Paper, Stack, Typography } from '@mui/material'

import {
  useArchiveSectionFinancePlan,
  useSectionFinancePlans,
} from '../../entities/section-finance-plan/api/section-finance-plan.query'
import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import { CreateSectionFinancePlanForm } from '../../features/section-finance-plan/create-section-finance-plan/ui/CreateSectionFinancePlanForm'
import { EditSectionFinancePlanForm } from '../../features/section-finance-plan/edit-section-finance-plan/ui/EditSectionFinancePlanForm'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import {
  formatDateTime,
  formatOptionalDateTime,
} from '../../shared/lib/format'
import { parseApiError } from '../../shared/api/parse-api-error'
import type { ApiError } from '../../shared/types/api'
import { ArchiveActionButton } from '../../shared/ui/ArchiveActionButton'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'
import { PlannedCostBlock } from '../planned-cost-block/PlannedCostBlock'
import { PlannedPaymentBlock } from '../planned-payment-block/PlannedPaymentBlock'
import { SectionFinanceSummaryBlock } from '../section-finance-summary-block/SectionFinanceSummaryBlock'

interface SectionFinancePlanBlockProps {
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
}

export function SectionFinancePlanBlock({
  financeCapabilities,
  projectFinanceId,
}: SectionFinancePlanBlockProps) {
  const sectionFinancePlansQuery = useSectionFinancePlans(projectFinanceId)
  const archiveSectionFinancePlanMutation = useArchiveSectionFinancePlan()
  const sectionFinancePlans = sectionFinancePlansQuery.data?.items ?? []
  const canCreateSectionFinancePlan = financeCapabilities.canCreateSectionFinancePlan
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleArchive = async (sectionFinancePlan: SectionFinancePlan) => {
    if (
      !window.confirm(
        `Archive section finance plan "${sectionFinancePlan.name}"?`,
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
    <SectionCard
      action={
        canCreateSectionFinancePlan ? (
          <Button
            onClick={() => setIsCreateFormOpen((current) => !current)}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            {isCreateFormOpen ? 'Hide form' : 'Add section'}
          </Button>
        ) : undefined
      }
      subtitle="Manage the section-level finance plan blocks linked to this project finance."
      title="Section finance plans"
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
            title="Failed to archive section finance plan"
          />
        ) : null}

        {sectionFinancePlansQuery.isPending ? (
          <LoadingState
            description="Loading section finance plans from the backend."
            title="Loading sections"
          />
        ) : null}

        {sectionFinancePlansQuery.isError ? (
          <ErrorState
            action={
              <Button
                onClick={() => void sectionFinancePlansQuery.refetch()}
                variant="contained"
              >
                Retry
              </Button>
            }
            description={sectionFinancePlansQuery.error.message}
            title="Failed to load sections"
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
                  Add section
                </Button>
              ) : undefined
            }
            description={
              canCreateSectionFinancePlan
                ? 'Create the first section finance plan for this project finance.'
                : 'No section finance plans are available for viewing in this project finance yet.'
            }
            title="No sections yet"
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
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}

function SectionFinancePlanListItem({
  availableSectionFinancePlans,
  financeCapabilities,
  isArchiving,
  onArchive,
  sectionFinancePlan,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  financeCapabilities: FinanceCapabilities
  isArchiving: boolean
  onArchive: (sectionFinancePlan: SectionFinancePlan) => Promise<void>
  sectionFinancePlan: SectionFinancePlan
}) {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const isArchived = sectionFinancePlan.state !== 'ACTIVE'
  const canEditSectionFinancePlan = financeCapabilities.canEditSectionFinancePlan
  const canArchiveSectionFinancePlan = financeCapabilities.canArchiveSectionFinancePlan
  const isEditFormVisible =
    canEditSectionFinancePlan && !isArchived && isEditFormOpen
  const showActions = canEditSectionFinancePlan || canArchiveSectionFinancePlan

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
              spacing={1}
            >
              <Typography variant="h6">{sectionFinancePlan.name}</Typography>
              <FinanceStatusChip value={sectionFinancePlan.state} />
            </Stack>

            <Typography color="text.secondary" variant="body2">
              External section ID: {sectionFinancePlan.externalSectionId}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {sectionFinancePlan.description ?? 'No description'}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ flexWrap: 'wrap' }}
            >
              <SectionFinancePlanMetaItem
                label="Version"
                value={String(sectionFinancePlan.version)}
              />
              <SectionFinancePlanMetaItem
                label="Created"
                value={formatDateTime(sectionFinancePlan.createdAt)}
              />
              <SectionFinancePlanMetaItem
                label="Updated"
                value={formatDateTime(sectionFinancePlan.updatedAt)}
              />
              <SectionFinancePlanMetaItem
                label="Archived"
                value={formatOptionalDateTime(sectionFinancePlan.archivedAt)}
              />
            </Stack>
          </Stack>

          {showActions ? (
            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
              {canEditSectionFinancePlan ? (
                <Button
                  disabled={isArchived}
                  onClick={() => setIsEditFormOpen((current) => !current)}
                  startIcon={<EditOutlinedIcon />}
                  variant="outlined"
                >
                  {isEditFormVisible ? 'Hide form' : 'Edit'}
                </Button>
              ) : null}
              {canArchiveSectionFinancePlan ? (
                <ArchiveActionButton
                  isArchived={isArchived}
                  isArchiving={isArchiving}
                  onClick={() => void onArchive(sectionFinancePlan)}
                />
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        {canEditSectionFinancePlan ? (
          <Collapse in={isEditFormVisible} unmountOnExit>
            <EditSectionFinancePlanForm
              onCancel={() => setIsEditFormOpen(false)}
              onSuccess={() => setIsEditFormOpen(false)}
              sectionFinancePlan={sectionFinancePlan}
            />
          </Collapse>
        ) : null}

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
