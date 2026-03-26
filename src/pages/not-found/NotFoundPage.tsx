import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { EmptyState } from '../../shared/ui/EmptyState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'

export function NotFoundPage() {
  return (
    <PageContainer>
      <PageTitle
        subtitle="The requested page does not exist in the current frontend shell."
        title="Page not found"
      />
      <EmptyState
        action={
          <Button
            component={RouterLink}
            startIcon={<HomeRoundedIcon />}
            to="/project-finances"
            variant="contained"
          >
            Go to project finances
          </Button>
        }
        description="Use the main project finances route as the current application entry point."
        title="Nothing to render here"
      />
    </PageContainer>
  )
}
