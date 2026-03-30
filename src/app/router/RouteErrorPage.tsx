import { Button } from '@mui/material'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from '../../shared/ui/ErrorState'
import { PageContainer } from '../../shared/ui/PageContainer'

export function RouteErrorPage() {
  const error = useRouteError()

  let description = 'Не удалось открыть страницу. Попробуйте обновить её.'

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
            К финансовым планам
          </Button>
        }
        description={description}
        title="Ошибка загрузки страницы"
      />
    </PageContainer>
  )
}
