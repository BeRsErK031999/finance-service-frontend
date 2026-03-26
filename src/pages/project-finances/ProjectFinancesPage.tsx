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

import { useProjectFinanceListQuery } from '../../entities/project-finance/api/project-finance.query'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

export function ProjectFinancesPage() {
  const projectFinancesQuery = useProjectFinanceListQuery()
  const projectFinances = projectFinancesQuery.data?.items ?? []

  return (
    <PageContainer>
      <PageTitle
        action={
          <Button
            component={RouterLink}
            startIcon={<AddRoundedIcon />}
            to="/project-finances/create"
            variant="contained"
          >
            New project finance
          </Button>
        }
        subtitle="Browse existing ProjectFinance records and start the creation flow."
        title="Project finances"
      />

      {projectFinancesQuery.isPending ? (
        <LoadingState
          description="Project finances are loading from the backend."
          title="Loading project finances"
        />
      ) : null}

      {projectFinancesQuery.isError ? (
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

      {!projectFinancesQuery.isPending &&
      !projectFinancesQuery.isError &&
      projectFinances.length === 0 ? (
        <EmptyState
          action={
            <Button
              component={RouterLink}
              startIcon={<AddRoundedIcon />}
              to="/project-finances/create"
              variant="contained"
            >
              Create project finance
            </Button>
          }
          description="No ProjectFinance records exist yet. Create the first one to start the flow."
          title="No project finances yet"
        />
      ) : null}

      {!projectFinancesQuery.isPending &&
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
      <Typography color="text.secondary" variant="body2">
        State: {projectFinance.state} | Updated: {formatDateTime(projectFinance.updatedAt)}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {projectFinance.description ?? 'No description'}
      </Typography>
    </Stack>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
