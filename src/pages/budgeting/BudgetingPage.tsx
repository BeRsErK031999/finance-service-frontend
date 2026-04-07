import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {
  Button,
  Stack,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import {
  useProjectFinanceGlobalAccessQuery,
  useProjectFinanceListQuery,
} from '../../entities/project-finance/api/project-finance.query'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { BudgetingOverviewWidget } from '../../widgets/budgeting-overview/BudgetingOverviewWidget'

export function BudgetingPage() {
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
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          startIcon={<ArrowBackRoundedIcon />}
          to="/project-finances"
          variant="text"
        >
          К финансовым планам
        </Button>

        <PageTitle
          subtitle="Общий обзор planned и actual записей по всем доступным финансовым планам. Неподдержанные колонки явно отмечены как «Нет в сервисе»."
          title="Бюджетирование"
        />

        {!projectFinanceGlobalAccessQuery.isPending &&
        !projectFinanceGlobalAccessQuery.isError &&
        canViewProjectFinanceList &&
        financeCapabilities.readOnlyReason ? (
          <AccessNotice message={financeCapabilities.readOnlyReason} />
        ) : null}

        {projectFinanceGlobalAccessQuery.isPending ? (
          <LoadingState
            description="Проверяем доступ к общему экрану бюджетирования."
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
        !canViewProjectFinanceList ? (
          <EmptyState
            description={
              financeCapabilities.readOnlyReason ??
              'Для текущего пользователя доступ к финансовому модулю недоступен.'
            }
            title="Нет доступа к бюджетированию"
          />
        ) : null}

        {!projectFinanceGlobalAccessQuery.isPending &&
        !projectFinanceGlobalAccessQuery.isError &&
        canViewProjectFinanceList &&
        projectFinancesQuery.isPending ? (
          <LoadingState
            description="Загружаем список финансовых планов для общей таблицы."
            title="Загружаем финансовые планы"
          />
        ) : null}

        {!projectFinanceGlobalAccessQuery.isPending &&
        !projectFinanceGlobalAccessQuery.isError &&
        canViewProjectFinanceList &&
        projectFinancesQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void projectFinancesQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={projectFinancesQuery.error.message}
            title="Не удалось загрузить финансовые планы"
          />
        ) : null}

        {!projectFinanceGlobalAccessQuery.isPending &&
        !projectFinanceGlobalAccessQuery.isError &&
        canViewProjectFinanceList &&
        !projectFinancesQuery.isPending &&
        !projectFinancesQuery.isError &&
        projectFinances.length === 0 ? (
          <EmptyState
            description="Доступные финансовые планы пока отсутствуют, поэтому общая таблица бюджетирования пуста."
            title="Пока нет данных для бюджетирования"
          />
        ) : null}

        {!projectFinanceGlobalAccessQuery.isPending &&
        !projectFinanceGlobalAccessQuery.isError &&
        canViewProjectFinanceList &&
        !projectFinancesQuery.isPending &&
        !projectFinancesQuery.isError &&
        projectFinances.length > 0 ? (
          <BudgetingOverviewWidget projectFinances={projectFinances} />
        ) : null}
      </Stack>
    </PageContainer>
  )
}
