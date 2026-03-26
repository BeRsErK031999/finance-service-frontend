import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { CreateProjectFinanceForm } from '../../features/project-finance/create-project-finance/ui/CreateProjectFinanceForm'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'

export function ProjectFinanceCreatePage() {
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

      <CreateProjectFinanceForm />
    </PageContainer>
  )
}
