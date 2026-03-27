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

  const plannedPayments = plannedPaymentsQuery.data?.items ?? []
  const plannedCosts = plannedCostsQuery.data?.items ?? []
  const actualPayments = actualPaymentsQuery.data?.items ?? []
  const actualCosts = actualCostsQuery.data?.items ?? []

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
      label: 'Total planned payments',
      secondaryLabel: formatRecordCount(plannedPayments.length),
      value: plannedPaymentsTotal,
    },
    {
      label: 'Total planned costs',
      secondaryLabel: formatRecordCount(plannedCosts.length),
      value: plannedCostsTotal,
    },
    {
      label: 'Total actual payments',
      secondaryLabel: formatRecordCount(actualPayments.length),
      value: actualPaymentsTotal,
    },
    {
      label: 'Total actual costs',
      secondaryLabel: formatRecordCount(actualCosts.length),
      value: actualCostsTotal,
    },
    {
      label: 'Planned balance',
      secondaryLabel: 'Planned payments minus planned costs',
      value: plannedPaymentsTotal - plannedCostsTotal,
    },
    {
      label: 'Actual balance',
      secondaryLabel: 'Actual payments minus actual costs',
      value: actualPaymentsTotal - actualCostsTotal,
    },
  ]

  return (
    <SectionCard
      subtitle="Aggregated from the planned and actual movement lists returned by the backend for this project finance."
      title="Project finance summary"
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
                Retry
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
            title="Failed to load summary"
          />
        ) : null}

        {!hasError && isPending ? (
          <LoadingState
            description="Loading planned and actual totals from the backend lists."
            title="Loading summary"
          />
        ) : null}

        {!hasError && !isPending && totalItemCount === 0 ? (
          <EmptyState
            description="No planned or actual finance movements are available for this project finance yet."
            title="Summary is empty"
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
  if (!metric.label.includes('balance')) {
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

function toNumericAmount(value: string) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function formatRecordCount(count: number) {
  return count === 1 ? '1 record' : `${count} records`
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
    plannedPaymentsMessage ? 'planned payments' : null,
    plannedCostsMessage ? 'planned costs' : null,
    actualPaymentsMessage ? 'actual payments' : null,
    actualCostsMessage ? 'actual costs' : null,
  ].filter((value): value is string => value !== null)
  const primaryMessage =
    plannedPaymentsMessage ??
    plannedCostsMessage ??
    actualPaymentsMessage ??
    actualCostsMessage ??
    'Unknown summary error'

  return `Summary is unavailable because ${joinLabels(failedSources)} failed to load. ${primaryMessage}`
}

function joinLabels(labels: string[]) {
  if (labels.length === 1) {
    return labels[0]
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`
}

async function retryAllQueries(
  refetchers: Array<() => Promise<unknown>>,
) {
  await Promise.all(refetchers.map((refetch) => refetch()))
}
