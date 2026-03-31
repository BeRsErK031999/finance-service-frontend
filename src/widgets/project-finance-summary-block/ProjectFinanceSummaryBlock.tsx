import { Button, Paper, Stack, Typography } from '@mui/material'

import { useActualCosts } from '../../entities/actual-cost/api/actual-cost.query'
import { useActualPayments } from '../../entities/actual-payment/api/actual-payment.query'
import { usePlannedCosts } from '../../entities/planned-cost/api/planned-cost.query'
import { usePlannedPayments } from '../../entities/planned-payment/api/planned-payment.query'
import { formatAmount } from '../../shared/lib/format'
import { CollapsibleSectionCard } from '../../shared/ui/CollapsibleSectionCard'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'

interface ProjectFinanceSummaryBlockProps {
  projectFinanceId: string
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

interface SummaryMetric {
  label: string
  value: number
  secondaryLabel: string
}

export function ProjectFinanceSummaryBlock({
  projectFinanceId,
  expanded,
  onExpandedChange,
}: ProjectFinanceSummaryBlockProps) {
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const plannedCostsQuery = usePlannedCosts(projectFinanceId)
  const actualPaymentsQuery = useActualPayments({ projectFinanceId })
  const actualCostsQuery = useActualCosts({ projectFinanceId })

  const plannedPayments = (plannedPaymentsQuery.data?.items ?? []).filter(isActiveRecord)
  const plannedCosts = (plannedCostsQuery.data?.items ?? []).filter(isActiveRecord)
  const actualPayments = (actualPaymentsQuery.data?.items ?? []).filter(isActiveRecord)
  const actualCosts = (actualCostsQuery.data?.items ?? []).filter(isActiveRecord)

  const hasError =
    plannedPaymentsQuery.isError ||
    plannedCostsQuery.isError ||
    actualPaymentsQuery.isError ||
    actualCostsQuery.isError
  const isPending =
    plannedPaymentsQuery.isPending ||
    plannedCostsQuery.isPending ||
    actualPaymentsQuery.isPending ||
    actualCostsQuery.isPending
  const totalItemCount =
    plannedPayments.length +
    plannedCosts.length +
    actualPayments.length +
    actualCosts.length

  const plannedPaymentsTotal = sumAmounts(plannedPayments)
  const plannedCostsTotal = sumAmounts(plannedCosts)
  const actualPaymentsTotal = sumAmounts(actualPayments)
  const actualCostsTotal = sumAmounts(actualCosts)
  const plannedBalance = plannedPaymentsTotal - plannedCostsTotal
  const actualBalance = actualPaymentsTotal - actualCostsTotal

  const metrics: SummaryMetric[] = [
    {
      label: 'Плановые поступления',
      secondaryLabel: formatRecordCount(plannedPayments.length),
      value: plannedPaymentsTotal,
    },
    {
      label: 'Плановые расходы',
      secondaryLabel: formatRecordCount(plannedCosts.length),
      value: plannedCostsTotal,
    },
    {
      label: 'Фактические поступления',
      secondaryLabel: formatRecordCount(actualPayments.length),
      value: actualPaymentsTotal,
    },
    {
      label: 'Фактические расходы',
      secondaryLabel: formatRecordCount(actualCosts.length),
      value: actualCostsTotal,
    },
    {
      label: 'Плановый баланс',
      secondaryLabel: 'Поступления минус расходы',
      value: plannedBalance,
    },
    {
      label: 'Фактический баланс',
      secondaryLabel: 'Фактические суммы по проекту',
      value: actualBalance,
    },
  ]

  return (
    <CollapsibleSectionCard
      expanded={expanded}
      onToggle={onExpandedChange}
      subtitle="Сводка по всем активным плановым и фактическим движениям проекта."
      summary={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ flexWrap: 'wrap' }}
          useFlexGap
        >
          <SummaryHeaderBadge label="Плановый баланс" value={plannedBalance} />
          <SummaryHeaderBadge label="Фактический баланс" value={actualBalance} />
        </Stack>
      }
      title="Итоги по проекту"
    >
      <Stack spacing={3}>
        {hasError ? (
          <ErrorState
            action={
              <Button
                onClick={() =>
                  void retryAllQueries([
                    plannedPaymentsQuery.refetch,
                    plannedCostsQuery.refetch,
                    actualPaymentsQuery.refetch,
                    actualCostsQuery.refetch,
                  ])
                }
                variant="contained"
              >
                Повторить
              </Button>
            }
            description={buildSummaryErrorDescription({
              actualCostsMessage: actualCostsQuery.isError
                ? actualCostsQuery.error.message
                : null,
              actualPaymentsMessage: actualPaymentsQuery.isError
                ? actualPaymentsQuery.error.message
                : null,
              plannedCostsMessage: plannedCostsQuery.isError
                ? plannedCostsQuery.error.message
                : null,
              plannedPaymentsMessage: plannedPaymentsQuery.isError
                ? plannedPaymentsQuery.error.message
                : null,
            })}
            title="Не удалось загрузить сводку"
          />
        ) : null}

        {!hasError && isPending ? (
          <LoadingState
            description="Собираем итоговые суммы по плановым и фактическим движениям."
            title="Загружаем сводку"
          />
        ) : null}

        {!hasError && !isPending && totalItemCount === 0 ? (
          <EmptyState
            description="Для этого финансового плана пока нет ни плановых, ни фактических движений."
            title="Сводка пока пустая"
          />
        ) : null}

        {!hasError && !isPending && totalItemCount > 0 ? (
          <Stack direction="row" flexWrap="wrap" spacing={1.5} useFlexGap>
            {metrics.map((metric) => (
              <SummaryMetricCard key={metric.label} metric={metric} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CollapsibleSectionCard>
  )
}

function SummaryHeaderBadge({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Paper
      sx={{
        bgcolor: 'background.default',
        px: 1.5,
        py: 1,
      }}
      variant="outlined"
    >
      <Stack spacing={0.25}>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        <Typography sx={{ color: getBalanceColor(value) }} variant="subtitle2">
          {formatAmount(value)}
        </Typography>
      </Stack>
    </Paper>
  )
}

function SummaryMetricCard({ metric }: { metric: SummaryMetric }) {
  const valueColor = getMetricValueColor(metric)

  return (
    <Paper
      sx={{
        flex: {
          xs: '1 1 100%',
          sm: '1 1 calc(50% - 6px)',
          xl: '1 1 calc(33.333% - 8px)',
        },
        minWidth: 0,
        p: 2,
      }}
      variant="outlined"
    >
      <Stack spacing={0.75}>
        <Typography color="text.secondary" variant="body2">
          {metric.label}
        </Typography>
        <Typography sx={{ color: valueColor }} variant="h6">
          {formatAmount(metric.value)}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {metric.secondaryLabel}
        </Typography>
      </Stack>
    </Paper>
  )
}

function getMetricValueColor(metric: SummaryMetric) {
  if (!metric.label.includes('баланс')) {
    return 'text.primary'
  }

  return getBalanceColor(metric.value)
}

function getBalanceColor(value: number) {
  if (value < 0) {
    return 'error.main'
  }

  if (value > 0) {
    return 'success.main'
  }

  return 'text.primary'
}

function sumAmounts(items: Array<{ amount: string }>) {
  return items.reduce((total, item) => total + toNumericAmount(item.amount), 0)
}

function isActiveRecord<T extends { state: string }>(item: T) {
  return item.state === 'ACTIVE'
}

function toNumericAmount(value: string) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function formatRecordCount(count: number) {
  if (count === 1) {
    return '1 запись'
  }

  return `${count} записей`
}

function buildSummaryErrorDescription({
  plannedPaymentsMessage,
  plannedCostsMessage,
  actualPaymentsMessage,
  actualCostsMessage,
}: {
  plannedPaymentsMessage: string | null
  plannedCostsMessage: string | null
  actualPaymentsMessage: string | null
  actualCostsMessage: string | null
}) {
  const failedSources = [
    plannedPaymentsMessage ? 'плановые поступления' : null,
    plannedCostsMessage ? 'плановые расходы' : null,
    actualPaymentsMessage ? 'фактические поступления' : null,
    actualCostsMessage ? 'фактические расходы' : null,
  ].filter((value): value is string => value !== null)
  const primaryMessage =
    plannedPaymentsMessage ??
    plannedCostsMessage ??
    actualPaymentsMessage ??
    actualCostsMessage ??
    'Неизвестная ошибка сводки'

  return `Сводка недоступна, потому что не удалось загрузить: ${joinLabels(failedSources)}. ${primaryMessage}`
}

function joinLabels(labels: string[]) {
  if (labels.length === 1) {
    return labels[0]
  }

  if (labels.length === 2) {
    return `${labels[0]} и ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')} и ${labels.at(-1)}`
}

async function retryAllQueries(refetchers: Array<() => Promise<unknown>>) {
  await Promise.all(refetchers.map((refetch) => refetch()))
}
