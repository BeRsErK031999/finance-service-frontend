import { Button, Paper, Stack, Typography } from '@mui/material'

import { useActualCosts } from '../../entities/actual-cost/api/actual-cost.query'
import { useActualPayments } from '../../entities/actual-payment/api/actual-payment.query'
import { usePlannedCosts } from '../../entities/planned-cost/api/planned-cost.query'
import { usePlannedPayments } from '../../entities/planned-payment/api/planned-payment.query'
import { formatAmount } from '../../shared/lib/format'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'

interface ProjectFinanceSummaryBlockProps {
  projectFinanceId: string
}

interface SummaryMetric {
  label: string
  value: number
  secondaryLabel: string
}

export function ProjectFinanceSummaryBlock({
  projectFinanceId,
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
      secondaryLabel: 'Плановые поступления минус плановые расходы',
      value: plannedPaymentsTotal - plannedCostsTotal,
    },
    {
      label: 'Фактический баланс',
      secondaryLabel: 'Фактические поступления минус фактические расходы',
      value: actualPaymentsTotal - actualCostsTotal,
    },
  ]

  return (
    <SectionCard
      subtitle="Сводка по всем плановым и фактическим движениям в этом финансовом плане."
      title="Итоги по проекту"
    >
      <Stack spacing={3}>
        {hasError ? (
          <ErrorState
            action={
              <Button onClick={() => void retryAllQueries([
                plannedPaymentsQuery.refetch,
                plannedCostsQuery.refetch,
                actualPaymentsQuery.refetch,
                actualCostsQuery.refetch,
              ])} variant="contained">
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
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={2}
            useFlexGap
          >
            {metrics.map((metric) => (
              <SummaryMetricCard key={metric.label} metric={metric} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}

function SummaryMetricCard({ metric }: { metric: SummaryMetric }) {
  const valueColor = getMetricValueColor(metric)

  return (
    <Paper
      sx={{
        flex: {
          xs: '1 1 100%',
          sm: '1 1 calc(50% - 8px)',
          lg: '1 1 calc(33.333% - 11px)',
        },
        minWidth: 0,
        p: { xs: 2.5, md: 3 },
      }}
      variant="outlined"
    >
      <Stack spacing={1.25}>
        <Typography color="text.secondary" variant="body2">
          {metric.label}
        </Typography>
        <Typography sx={{ color: valueColor }} variant="h5">
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

  if (metric.value < 0) {
    return 'error.main'
  }

  if (metric.value > 0) {
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

async function retryAllQueries(
  refetchers: Array<() => Promise<unknown>>,
) {
  await Promise.all(refetchers.map((refetch) => refetch()))
}
