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
            К списку
          </Button>
        }
        subtitle="Создайте финансовый план для проекта, который уже существует во внешней системе и загружен в финансовый сервис."
        title="Создание финансового плана"
      />

      {projectFinanceGlobalAccessQuery.isPending ? (
        <LoadingState
          description="Проверяем, можно ли создавать финансовые планы."
          title="Загружаем права доступа"
        />
      ) : null}

      {projectFinanceGlobalAccessQuery.isError ? (
        <ErrorState
          action={
            <Button
              onClick={() => void projectFinanceGlobalAccessQuery.refetch()}
              variant="contained"
            >
              Повторить
            </Button>
          }
          description={projectFinanceGlobalAccessQuery.error.message}
          title="Не удалось загрузить права доступа"
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
            'Текущему пользователю недоступно создание финансовых планов.'
          }
          title={
            financeCapabilities.canViewProjectFinanceList
              ? 'Создание финансового плана недоступно'
              : 'Нет доступа к модулю'
          }
        />
      ) : null}
    </PageContainer>
  )
}
