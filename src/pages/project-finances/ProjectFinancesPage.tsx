import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import {
  useProjectFinanceGlobalAccessQuery,
  useProjectFinanceListQuery,
} from '../../entities/project-finance/api/project-finance.query'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatDateTime } from '../../shared/lib/format'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

export function ProjectFinancesPage() {
  const projectFinanceGlobalAccessQuery = useProjectFinanceGlobalAccessQuery()
  const financeCapabilities = getFinanceCapabilities({
    moduleAccess: projectFinanceGlobalAccessQuery.data ?? null,
  })
  const canViewProjectFinanceList = financeCapabilities.canViewProjectFinanceList
  const projectFinancesQuery = useProjectFinanceListQuery(
    {},
    {
      enabled: canViewProjectFinanceList,
    },
  )
  const projectFinances = canViewProjectFinanceList
    ? projectFinancesQuery.data?.items ?? []
    : []

  return (
    <PageContainer>
      <PageTitle
        action={
          financeCapabilities.canCreateProjectFinance ? (
            <Button
              component={RouterLink}
              startIcon={<AddRoundedIcon />}
              to="/project-finances/create"
              variant="contained"
            >
              New project finance
            </Button>
          ) : undefined
        }
        subtitle="Browse ProjectFinance records available to your current finance access."
        title="Project finances"
      />

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      financeCapabilities.readOnlyReason ? (
        <AccessNotice message={financeCapabilities.readOnlyReason} />
      ) : null}

      {projectFinanceGlobalAccessQuery.isPending ? (
        <LoadingState
          description="Finance module access is loading from the backend."
          title="Loading finance access"
        />
      ) : null}

      {projectFinanceGlobalAccessQuery.isError ? (
        <ErrorState
          action={
            <Button
              onClick={() => void projectFinanceGlobalAccessQuery.refetch()}
              variant="contained"
            >
              Retry
            </Button>
          }
          description={projectFinanceGlobalAccessQuery.error.message}
          title="Failed to load finance access"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      !canViewProjectFinanceList ? (
        <EmptyState
          description={
            financeCapabilities.readOnlyReason ??
            'Current user access for the finance module is not available.'
          }
          title="Finance access is denied"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      projectFinancesQuery.isPending ? (
        <LoadingState
          description="Project finances are loading from the backend."
          title="Loading project finances"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      projectFinancesQuery.isError ? (
        <ErrorState
          action={
            <Button onClick={() => void projectFinancesQuery.refetch()} variant="contained">
              Retry
            </Button>
          }
          description={projectFinancesQuery.error.message}
          title="Failed to load project finances"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      !projectFinancesQuery.isPending &&
      !projectFinancesQuery.isError &&
      projectFinances.length === 0 ? (
        <EmptyState
          action={
            financeCapabilities.canCreateProjectFinance ? (
              <Button
                component={RouterLink}
                startIcon={<AddRoundedIcon />}
                to="/project-finances/create"
                variant="contained"
              >
                Create project finance
              </Button>
            ) : undefined
          }
          description={
            financeCapabilities.canCreateProjectFinance
              ? 'No ProjectFinance records exist yet. Create the first one to start the flow.'
              : 'No ProjectFinance records are available for viewing yet.'
          }
          title="No project finances yet"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      !projectFinancesQuery.isPending &&
      !projectFinancesQuery.isError &&
      projectFinances.length > 0 ? (
        <SectionCard
          subtitle={`${projectFinances.length} record${projectFinances.length === 1 ? '' : 's'} available.`}
          title="Project finance list"
        >
          <List disablePadding>
            {projectFinances.map((projectFinance, index) => (
              <Stack key={projectFinance.id}>
                {index > 0 ? <Divider /> : null}
                <ListItemButton
                  component={RouterLink}
                  to={`/project-finances/${projectFinance.id}`}
                >
                  <ListItemText
                    primary={projectFinance.name}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={<ProjectFinanceListItemDetails projectFinance={projectFinance} />}
                  />
                </ListItemButton>
              </Stack>
            ))}
          </List>
        </SectionCard>
      ) : null}
    </PageContainer>
  )
}

function ProjectFinanceListItemDetails({
  projectFinance,
}: {
  projectFinance: ProjectFinance
}) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <Typography color="text.secondary" variant="body2">
        External project: {projectFinance.externalProjectId}
      </Typography>
      <Stack
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        direction={{ xs: 'column', sm: 'row' }}
        flexWrap="wrap"
        gap={1}
      >
        <FinanceStatusChip value={projectFinance.state} />
        <Typography color="text.secondary" variant="body2">
          Updated: {formatDateTime(projectFinance.updatedAt)}
        </Typography>
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {projectFinance.description ?? 'No description'}
      </Typography>
    </Stack>
  )
}
