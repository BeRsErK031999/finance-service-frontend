import { Button } from '@mui/material'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from '../../shared/ui/ErrorState'
import { PageContainer } from '../../shared/ui/PageContainer'

export function RouteErrorPage() {
  const error = useRouteError()

  let description = 'Unexpected route error. Try to refresh the page.'

  if (isRouteErrorResponse(error)) {
    description = `${error.status} ${error.statusText}`
  } else if (error instanceof Error) {
    description = error.message
  }

  return (
    <PageContainer>
      <ErrorState
        action={
          <Button href="/project-finances" variant="contained">
            Back to project finances
          </Button>
        }
        description={description}
        title="Page failed to load"
      />
    </PageContainer>
  )
}
