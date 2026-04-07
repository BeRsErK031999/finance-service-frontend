import AddRoundedIcon from '@mui/icons-material/AddRounded'
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded'
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

import {
  useProjectFinanceGlobalAccessQuery,
  useProjectFinanceListQuery,
} from '../../entities/project-finance/api/project-finance.query'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatDateTime } from '../../shared/lib/format'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

export function ProjectFinancesPage() {
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
      <PageTitle
        action={
          canViewProjectFinanceList ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component={RouterLink}
                startIcon={<TableChartRoundedIcon />}
                to="/budgeting"
                variant="outlined"
              >
                Бюджетирование
              </Button>
              {financeCapabilities.canCreateProjectFinance ? (
                <Button
                  component={RouterLink}
                  startIcon={<AddRoundedIcon />}
                  to="/project-finances/create"
                  variant="contained"
                >
                  Создать финансовый план
                </Button>
              ) : null}
            </Stack>
          ) : financeCapabilities.canCreateProjectFinance ? (
            <Button
              component={RouterLink}
              startIcon={<AddRoundedIcon />}
              to="/project-finances/create"
              variant="contained"
            >
              Создать финансовый план
            </Button>
          ) : undefined
        }
        subtitle="Список финансовых планов проектов, доступных вам в текущей роли."
        title="Финансовые планы проектов"
      />

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      financeCapabilities.readOnlyReason ? (
        <AccessNotice message={financeCapabilities.readOnlyReason} />
      ) : null}

      {projectFinanceGlobalAccessQuery.isPending ? (
        <LoadingState
          description="Проверяем доступ к финансовому модулю."
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
          title="Нет доступа к модулю"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      projectFinancesQuery.isPending ? (
        <LoadingState
          description="Загружаем список финансовых планов."
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
          action={
            financeCapabilities.canCreateProjectFinance ? (
              <Button
                component={RouterLink}
                startIcon={<AddRoundedIcon />}
                to="/project-finances/create"
                variant="contained"
              >
                Создать финансовый план
              </Button>
            ) : undefined
          }
          description={
            financeCapabilities.canCreateProjectFinance
              ? 'У вас пока нет доступных финансовых планов. Создайте первый план, чтобы начать работу.'
              : 'Для вашей роли пока нет доступных финансовых планов.'
          }
          title="Пока нет доступных планов"
        />
      ) : null}

      {!projectFinanceGlobalAccessQuery.isPending &&
      !projectFinanceGlobalAccessQuery.isError &&
      canViewProjectFinanceList &&
      !projectFinancesQuery.isPending &&
      !projectFinancesQuery.isError &&
      projectFinances.length > 0 ? (
        <SectionCard
          subtitle={formatProjectFinanceListSubtitle(projectFinances.length)}
          title="Список финансовых планов"
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
        ID проекта во внешней системе: {projectFinance.externalProjectId}
      </Typography>
      <Stack
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        direction={{ xs: 'column', sm: 'row' }}
        flexWrap="wrap"
        gap={1}
      >
        <FinanceStatusChip value={projectFinance.state} />
        <Typography color="text.secondary" variant="body2">
          Обновлено: {formatDateTime(projectFinance.updatedAt)}
        </Typography>
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {projectFinance.description ?? 'Описание не указано'}
      </Typography>
    </Stack>
  )
}

function formatProjectFinanceListSubtitle(count: number) {
  if (count === 1) {
    return 'Доступен 1 финансовый план.'
  }

  return `Доступно ${count} финансовых планов.`
}
