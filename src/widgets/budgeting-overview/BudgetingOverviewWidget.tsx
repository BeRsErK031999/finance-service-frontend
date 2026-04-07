import { useState } from 'react'

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded'
import { useQueries } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

import {
  actualCostKeys,
} from '../../entities/actual-cost/api/actual-cost.query'
import { listActualCosts } from '../../entities/actual-cost/api/actual-cost.api'
import {
  actualPaymentKeys,
} from '../../entities/actual-payment/api/actual-payment.query'
import { listActualPayments } from '../../entities/actual-payment/api/actual-payment.api'
import {
  plannedCostKeys,
} from '../../entities/planned-cost/api/planned-cost.query'
import { listPlannedCosts } from '../../entities/planned-cost/api/planned-cost.api'
import {
  plannedPaymentKeys,
} from '../../entities/planned-payment/api/planned-payment.query'
import { listPlannedPayments } from '../../entities/planned-payment/api/planned-payment.api'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { formatAmount, formatDate } from '../../shared/lib/format'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'
import {
  buildBudgetingOverviewRows,
  BUDGETING_STATUS_FILTER_VALUES,
  BUDGETING_TYPE_FILTER_VALUES,
  formatSignedAmount,
  getBudgetingPlannedDateLabel,
  getBudgetingStatusFilterLabel,
  getBudgetingSummary,
  getBudgetingTypeFilterLabel,
  getBudgetTypeLabel,
  getPrimaryStatusChipVariant,
  matchesBudgetingOverviewRow,
  NOT_IN_SERVICE_LABEL,
  toFinanceStatusValue,
  type BudgetingStatusFilterValue,
  type BudgetingOverviewRow,
  type BudgetingTypeFilterValue,
} from './budgeting-overview.helpers'

interface BudgetingOverviewWidgetProps {
  projectFinances: ProjectFinance[]
}

export function BudgetingOverviewWidget({
  projectFinances,
}: BudgetingOverviewWidgetProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<BudgetingTypeFilterValue>('all')
  const [statusFilter, setStatusFilter] = useState<BudgetingStatusFilterValue>('all')

  const plannedPaymentQueries = useQueries({
    queries: projectFinances.map((projectFinance) => ({
      queryKey: plannedPaymentKeys.list(projectFinance.id),
      queryFn: () =>
        listPlannedPayments({
          projectFinanceId: projectFinance.id,
        }),
    })),
  })
  const plannedCostQueries = useQueries({
    queries: projectFinances.map((projectFinance) => ({
      queryKey: plannedCostKeys.list(projectFinance.id),
      queryFn: () =>
        listPlannedCosts({
          projectFinanceId: projectFinance.id,
        }),
    })),
  })
  const actualPaymentQueries = useQueries({
    queries: projectFinances.map((projectFinance) => ({
      queryKey: actualPaymentKeys.list({
        projectFinanceId: projectFinance.id,
      }),
      queryFn: () =>
        listActualPayments({
          projectFinanceId: projectFinance.id,
        }),
    })),
  })
  const actualCostQueries = useQueries({
    queries: projectFinances.map((projectFinance) => ({
      queryKey: actualCostKeys.list({
        projectFinanceId: projectFinance.id,
      }),
      queryFn: () =>
        listActualCosts({
          projectFinanceId: projectFinance.id,
        }),
    })),
  })

  const allQueries = [
    ...plannedPaymentQueries,
    ...plannedCostQueries,
    ...actualPaymentQueries,
    ...actualCostQueries,
  ]
  const isDataPending =
    projectFinances.length > 0 && allQueries.some((query) => query.isPending)
  const failedQuery = allQueries.find((query) => query.isError)
  const plannedPayments = plannedPaymentQueries.flatMap((query) => query.data?.items ?? [])
  const plannedCosts = plannedCostQueries.flatMap((query) => query.data?.items ?? [])
  const actualPayments = actualPaymentQueries.flatMap((query) => query.data?.items ?? [])
  const actualCosts = actualCostQueries.flatMap((query) => query.data?.items ?? [])
  const rows = buildBudgetingOverviewRows({
    actualCosts,
    actualPayments,
    plannedCosts,
    plannedPayments,
    projectFinances,
  })
  const filteredRows = rows.filter((row) =>
    matchesBudgetingOverviewRow(row, {
      search,
      statusFilter,
      typeFilter,
    }),
  )
  const summary = getBudgetingSummary(filteredRows, projectFinances.length)

  const handleRetryAll = async () => {
    await Promise.all(allQueries.map((query) => query.refetch()))
  }

  if (isDataPending) {
    return (
      <LoadingState
        description={`Собираем planned и actual записи по ${projectFinances.length} финансовым планам.`}
        title="Загружаем общее бюджетирование"
      />
    )
  }

  if (failedQuery?.error) {
    return (
      <ErrorState
        action={
          <Button onClick={() => void handleRetryAll()} variant="contained">
            Повторить
          </Button>
        }
        description={failedQuery.error.message}
        title="Не удалось собрать общую бюджетную таблицу"
      />
    )
  }

  return (
    <SectionCard
      subtitle="Экран остаётся planned-centric: каждая строка строится от planned записи и при наличии показывает только активный факт."
      title="Общее бюджетирование"
    >
      <Stack spacing={3}>
        <Alert severity="info" variant="outlined">
          Колонки, которых нет в текущем backend/service, помечены как «Нет в сервисе». Редактирование выполняется на уровне конкретного проекта.
        </Alert>

        <Stack
          alignItems={{ xs: 'stretch', xl: 'center' }}
          direction={{ xs: 'column', xl: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              label="Поиск"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Проект, внешний ID или название записи"
              size="small"
              value={search}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="budgeting-overview-type-filter-label">Тип</InputLabel>
              <Select
                label="Тип"
                labelId="budgeting-overview-type-filter-label"
                onChange={(event) =>
                  setTypeFilter(event.target.value as BudgetingTypeFilterValue)
                }
                value={typeFilter}
              >
                {BUDGETING_TYPE_FILTER_VALUES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {getBudgetingTypeFilterLabel(value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="budgeting-overview-status-filter-label">Статус</InputLabel>
              <Select
                label="Статус"
                labelId="budgeting-overview-status-filter-label"
                onChange={(event) =>
                  setStatusFilter(event.target.value as BudgetingStatusFilterValue)
                }
                value={statusFilter}
              >
                {BUDGETING_STATUS_FILTER_VALUES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {getBudgetingStatusFilterLabel(value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
                setStatusFilter('all')
              }}
              variant="text"
            >
              Сбросить
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ flexWrap: 'wrap' }}
          useFlexGap
        >
          <BudgetingSummaryBadge
            label="Доступных проектов"
            value={String(summary.projectCount)}
          />
          <BudgetingSummaryBadge label="Строк после фильтрации" value={String(summary.rowCount)} />
          <BudgetingSummaryBadge
            label="План доходов"
            tone="success"
            value={formatAmount(summary.plannedPayments)}
          />
          <BudgetingSummaryBadge
            label="План расходов"
            tone="warning"
            value={formatAmount(summary.plannedCosts)}
          />
          <BudgetingSummaryBadge
            label="Баланс"
            tone={summary.balance < 0 ? 'error' : 'success'}
            value={formatSignedAmount(summary.balance)}
          />
          <BudgetingSummaryBadge
            label="Активных фактов"
            value={String(summary.actualCount)}
          />
        </Stack>

        {rows.length === 0 ? (
          <EmptyState
            description="Во всех доступных финансовых планах пока нет planned доходов и расходов."
            title="Бюджетных строк пока нет"
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            description="Измените фильтры или строку поиска, чтобы снова увидеть записи."
            title="По текущим условиям ничего не найдено"
          />
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader sx={{ minWidth: 1980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Проект</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell align="right">Плановая сумма</TableCell>
                  <TableCell>Плановая дата</TableCell>
                  <TableCell>Факт</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Состояние</TableCell>
                  <TableCell>Статья</TableCell>
                  <TableCell>Счёт / кошелёк</TableCell>
                  <TableCell>Юрлицо</TableCell>
                  <TableCell>Контрагент</TableCell>
                  <TableCell>Период / месяц</TableCell>
                  <TableCell>Событие</TableCell>
                  <TableCell>Комментарий planned</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow
                    hover
                    key={row.key}
                    sx={
                      row.hasActual
                        ? {
                            '& > .MuiTableCell-root': {
                              bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                            },
                            '&:hover > .MuiTableCell-root': {
                              bgcolor: (theme) => alpha(theme.palette.success.main, 0.09),
                            },
                            '& > .MuiTableCell-root:first-of-type': {
                              borderLeft: (theme) =>
                                `4px solid ${alpha(theme.palette.success.main, 0.28)}`,
                            },
                          }
                        : undefined
                    }
                  >
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Stack spacing={0.75}>
                        <Typography fontWeight={600} variant="body2">
                          {row.projectFinanceName}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          Внешний ID: {row.projectExternalId}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip
                        color={row.type === 'payment' ? 'success' : 'warning'}
                        label={getBudgetTypeLabel(row.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography fontWeight={600} variant="body2">
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                      {formatAmount(row.amount)}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {getBudgetingPlannedDateLabel(row)}
                        </Typography>
                        {row.conditionSource === 'EVENTS' ? (
                          <Typography color="text.secondary" variant="caption">
                            Выбрано событий: {row.eventCount}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <BudgetingActualCell row={row} />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <FinanceStatusChip
                        value={toFinanceStatusValue(row.status)}
                        variant={getPrimaryStatusChipVariant(row.status)}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <FinanceStatusChip value={row.state} />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <EventCell row={row} />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <NotInServiceCell />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        <Button
                          component={RouterLink}
                          size="small"
                          startIcon={<OpenInNewRoundedIcon />}
                          to={`/project-finances/${row.projectFinanceId}`}
                          variant="outlined"
                        >
                          Проект
                        </Button>
                        <Button
                          component={RouterLink}
                          size="small"
                          startIcon={<TableChartRoundedIcon />}
                          to={`/project-finances/${row.projectFinanceId}/budget-table`}
                          variant="contained"
                        >
                          Таблица
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </SectionCard>
  )
}

function BudgetingActualCell({
  row,
}: {
  row: BudgetingOverviewRow
}) {
  if (!row.hasActual) {
    return (
      <Stack spacing={0.75}>
        <Chip
          label="Ожидается"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
          variant="outlined"
        />
        <Typography color="text.secondary" variant="caption">
          Факт ещё не добавлен
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={0.75}>
      <Chip
        color="success"
        label="Факт добавлен"
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      />
      <Typography fontWeight={600} variant="body2">
        {row.actualAmount === null ? 'Сумма не указана' : formatAmount(row.actualAmount)}
      </Typography>
      <Typography color="text.secondary" variant="caption">
        {row.actualDate ? `Дата: ${formatDate(row.actualDate)}` : 'Дата не указана'}
      </Typography>
      <Typography color="text.secondary" variant="caption">
        {row.actualComment ? `Комментарий: ${row.actualComment}` : 'Комментарий не указан'}
      </Typography>
    </Stack>
  )
}

function EventCell({
  row,
}: {
  row: BudgetingOverviewRow
}) {
  if (row.conditionSource !== 'EVENTS') {
    return (
      <Typography color="text.secondary" variant="caption">
        По дате
      </Typography>
    )
  }

  return (
    <Stack spacing={0.5}>
      <NotInServiceCell />
      <Typography color="text.secondary" variant="caption">
        Выбрано событий: {row.eventCount}
      </Typography>
    </Stack>
  )
}

function NotInServiceCell() {
  return (
    <Typography color="text.secondary" variant="caption">
      {NOT_IN_SERVICE_LABEL}
    </Typography>
  )
}

function BudgetingSummaryBadge({
  label,
  tone = 'default',
  value,
}: {
  label: string
  tone?: 'default' | 'success' | 'warning' | 'error'
  value: string
}) {
  return (
    <Paper
      sx={(theme) => {
        const toneColor =
          tone === 'success'
            ? theme.palette.success.main
            : tone === 'warning'
              ? theme.palette.warning.main
              : tone === 'error'
                ? theme.palette.error.main
                : null

        return {
          bgcolor:
            toneColor === null ? 'background.default' : alpha(toneColor, 0.06),
          borderColor:
            toneColor === null ? 'divider' : alpha(toneColor, 0.22),
          minWidth: 170,
          px: 1.5,
          py: 1,
        }
      }}
      variant="outlined"
    >
      <Stack spacing={0.25}>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        <Typography fontWeight={600} variant="body2">
          {value}
        </Typography>
      </Stack>
    </Paper>
  )
}
