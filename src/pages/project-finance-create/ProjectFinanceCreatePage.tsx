import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { useProjectFinanceGlobalAccessQuery } from '../../entities/project-finance/api/project-finance.query'
import { CreateProjectFinanceForm } from '../../features/project-finance/create-project-finance/ui/CreateProjectFinanceForm'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'

export function ProjectFinanceCreatePage() {
  const projectFinanceGlobalAccessQuery = useProjectFinanceGlobalAccessQuery()
  const financeCapabilities = getFinanceCapabilities({
    moduleAccess: projectFinanceGlobalAccessQuery.data ?? null,
  })

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
        subtitle="Create the first working ProjectFinance record through the backend contract."
        title="Create project finance"
      />

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
      financeCapabilities.canCreateProjectFinance ? (
        <CreateProjectFinanceForm />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      !financeCapabilities.canCreateProjectFinance ? (
        <EmptyState
          description={
            financeCapabilities.readOnlyReason ??
            'Current user access for project finance creation is not available.'
          }
          title={
            financeCapabilities.canViewProjectFinanceList
              ? 'Project finance creation is unavailable'
              : 'Finance access is denied'
          }
        />
      ) : null}
    </PageContainer>
  )
}
