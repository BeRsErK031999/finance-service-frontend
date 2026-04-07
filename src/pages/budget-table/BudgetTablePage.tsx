import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {
  Button,
  Stack,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'

import {
  useProjectFinanceAccessQuery,
  useProjectFinanceDetailsQuery,
} from '../../entities/project-finance/api/project-finance.query'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { BudgetTableWidget } from '../../widgets/budget-table/BudgetTableWidget'

export function BudgetTablePage() {
  const { id } = useParams<{ id: string }>()
  const projectFinanceQuery = useProjectFinanceDetailsQuery(id)
  const projectFinanceAccessQuery = useProjectFinanceAccessQuery(id, {
    enabled: Boolean(id) && projectFinanceQuery.isSuccess,
  })
  const financeCapabilities = getFinanceCapabilities({
    projectFinanceAccess: projectFinanceAccessQuery.data ?? null,
  })
  const projectFinance = projectFinanceQuery.data

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          startIcon={<ArrowBackRoundedIcon />}
          to={id ? `/project-finances/${id}` : '/project-finances'}
          variant="text"
        >
          К карточке плана
        </Button>

        <PageTitle
          subtitle={
            projectFinance
              ? `Внешний ID проекта: ${projectFinance.externalProjectId}`
              : id
                ? `ID финансового плана: ${id}`
                : 'Откройте страницу из списка финансовых планов.'
          }
          title={
            projectFinance
              ? `Бюджетная таблица: ${projectFinance.name}`
              : 'Бюджетная таблица'
          }
        />

        {financeCapabilities.readOnlyReason && financeCapabilities.canViewProjectFinance ? (
          <AccessNotice message={financeCapabilities.readOnlyReason} />
        ) : null}

        {!id ? (
          <EmptyState
            description="Нужен корректный ID финансового плана в маршруте, чтобы загрузить бюджетную таблицу."
            title="Не указан ID финансового плана"
          />
        ) : null}

        {id && projectFinanceQuery.isPending ? (
          <LoadingState
            description="Загружаем карточку финансового плана перед сборкой бюджетной таблицы."
            title="Загружаем финансовый план"
          />
        ) : null}

        {id && projectFinanceQuery.isError && projectFinanceQuery.error.statusCode === 404 ? (
          <EmptyState
            description="Запрошенный финансовый план не найден или больше недоступен."
            title="Финансовый план не найден"
          />
        ) : null}

        {id && projectFinanceQuery.isError && projectFinanceQuery.error.statusCode !== 404 ? (
          <ErrorState
            action={
              <Button onClick={() => void projectFinanceQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={projectFinanceQuery.error.message}
            title="Не удалось загрузить финансовый план"
          />
        ) : null}

        {id &&
        !projectFinanceQuery.isPending &&
        !projectFinanceQuery.isError &&
        projectFinance &&
        projectFinanceAccessQuery.isPending ? (
          <LoadingState
            description="Проверяем права доступа к бюджетной таблице этого проекта."
            title="Загружаем права доступа"
          />
        ) : null}

        {id &&
        !projectFinanceQuery.isPending &&
        !projectFinanceQuery.isError &&
        projectFinance &&
        projectFinanceAccessQuery.isError ? (
          <ErrorState
            action={
              <Button onClick={() => void projectFinanceAccessQuery.refetch()} variant="contained">
                Повторить
              </Button>
            }
            description={projectFinanceAccessQuery.error.message}
            title="Не удалось загрузить права доступа"
          />
        ) : null}

        {id &&
        !projectFinanceQuery.isPending &&
        !projectFinanceQuery.isError &&
        !projectFinance ? (
          <EmptyState
            description="Backend не вернул данные по запрошенному маршруту."
            title="Финансовый план недоступен"
          />
        ) : null}

        {projectFinance &&
        !projectFinanceAccessQuery.isPending &&
        !projectFinanceAccessQuery.isError &&
        !financeCapabilities.canViewProjectFinance ? (
          <EmptyState
            description={
              financeCapabilities.readOnlyReason ??
              'Текущему пользователю недоступен этот финансовый план.'
            }
            title="Нет доступа к бюджетной таблице"
          />
        ) : null}

        {projectFinance &&
        !projectFinanceAccessQuery.isPending &&
        !projectFinanceAccessQuery.isError &&
        financeCapabilities.canViewProjectFinance ? (
          <BudgetTableWidget
            financeCapabilities={financeCapabilities}
            projectFinanceId={projectFinance.id}
          />
        ) : null}
      </Stack>
    </PageContainer>
  )
}
