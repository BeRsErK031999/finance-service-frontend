import type { ReactNode } from 'react'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Button, Divider, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { useProjectFinanceDetailsQuery } from '../../entities/project-finance/api/project-finance.query'
import { formatDateTime, formatOptionalDateTime } from '../../shared/lib/format'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'
import { ProjectFinanceSummaryBlock } from '../../widgets/project-finance-summary-block/ProjectFinanceSummaryBlock'
import { SectionFinancePlanBlock } from '../../widgets/section-finance-plan-block/SectionFinancePlanBlock'

export function ProjectFinanceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const projectFinanceQuery = useProjectFinanceDetailsQuery(id)
  const projectFinance = projectFinanceQuery.data
  const title = projectFinance?.name ?? 'Project finance details'
  const subtitle = projectFinance
    ? `External project: ${projectFinance.externalProjectId}`
    : id
      ? `Project finance ID: ${id}`
      : 'Project finance identifier is missing.'

  return (
    <PageContainer>
      <PageTitle
        action={
          <Button
            component={RouterLink}
            startIcon={<ArrowBackRoundedIcon />}
            to="/project-finances"
            variant="text"
          >
            Back to list
          </Button>
        }
        subtitle={subtitle}
        title={title}
      />

      {!id ? (
        <EmptyState
          description="Open this page from the project finance list so the route contains a valid identifier."
          title="Project finance ID is missing"
        />
      ) : null}

      {id && projectFinanceQuery.isPending ? (
        <LoadingState
          description="Project finance details are loading from the backend."
          title="Loading project finance"
        />
      ) : null}

      {id && projectFinanceQuery.isError && projectFinanceQuery.error.statusCode === 404 ? (
        <EmptyState
          description="The requested ProjectFinance record does not exist or is no longer available."
          title="Project finance not found"
        />
      ) : null}

      {id &&
      projectFinanceQuery.isError &&
      projectFinanceQuery.error.statusCode !== 404 ? (
        <ErrorState
          action={
            <Button onClick={() => void projectFinanceQuery.refetch()} variant="contained">
              Retry
            </Button>
          }
          description={projectFinanceQuery.error.message}
          title="Failed to load project finance"
        />
      ) : null}

      {id &&
      !projectFinanceQuery.isPending &&
      !projectFinanceQuery.isError &&
      !projectFinance ? (
        <EmptyState
          description="Backend returned no ProjectFinance data for this route."
          title="Project finance is unavailable"
        />
      ) : null}

      {projectFinance ? (
        <Stack spacing={4}>
          <SectionCard
            subtitle="Core metadata and backend-driven state for this project finance."
            title="Project finance overview"
          >
            <Stack divider={<Divider flexItem />} spacing={2.5}>
              <ProjectFinanceDetailRow label="Name" value={projectFinance.name} />
              <ProjectFinanceDetailRow
                label="External project ID"
                value={projectFinance.externalProjectId}
              />
              <ProjectFinanceDetailRow
                label="Description"
                value={projectFinance.description ?? 'No description'}
              />
              <ProjectFinanceDetailRow
                label="State"
                value={<FinanceStatusChip value={projectFinance.state} />}
              />
              <ProjectFinanceDetailRow
                label="Version"
                value={String(projectFinance.version)}
              />
              <ProjectFinanceDetailRow
                label="Created at"
                value={formatDateTime(projectFinance.createdAt)}
              />
              <ProjectFinanceDetailRow
                label="Updated at"
                value={formatDateTime(projectFinance.updatedAt)}
              />
              <ProjectFinanceDetailRow
                label="Archived at"
                value={formatOptionalDateTime(projectFinance.archivedAt)}
              />
              <ProjectFinanceDetailRow
                label="Deleted at"
                value={formatOptionalDateTime(projectFinance.deletedAt)}
              />
            </Stack>
          </SectionCard>

          <ProjectFinanceSummaryBlock projectFinanceId={projectFinance.id} />

          <SectionFinancePlanBlock projectFinanceId={projectFinance.id} />
        </Stack>
      ) : null}
    </PageContainer>
  )
}

function ProjectFinanceDetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary" variant="subtitle2">
        {label}
      </Typography>
      {typeof value === 'string' ? <Typography variant="body1">{value}</Typography> : value}
    </Stack>
  )
}
