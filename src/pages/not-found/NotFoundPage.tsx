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
        subtitle="Эта страница отсутствует в текущем MVP-интерфейсе."
        title="Страница не найдена"
      />
      <EmptyState
        action={
          <Button
            component={RouterLink}
            startIcon={<HomeRoundedIcon />}
            to="/project-finances"
            variant="contained"
          >
            К списку финансовых планов
          </Button>
        }
        description="Откройте основной список финансовых планов и продолжите работу оттуда."
        title="Здесь пока ничего нет"
      />
    </PageContainer>
  )
}
