import { Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'

import { useActualCosts } from '../../entities/actual-cost/api/actual-cost.query'
import type { ActualCost } from '../../entities/actual-cost/model/types'
import { useActualPayments } from '../../entities/actual-payment/api/actual-payment.query'
import type { ActualPayment } from '../../entities/actual-payment/model/types'
import { usePlannedCosts } from '../../entities/planned-cost/api/planned-cost.query'
import type { PlannedCost } from '../../entities/planned-cost/model/types'
import { usePlannedPayments } from '../../entities/planned-payment/api/planned-payment.query'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import { formatAmount } from '../../shared/lib/format'
import { ErrorState } from '../../shared/ui/ErrorState'

interface SectionFinanceSummaryBlockProps {
  projectFinanceId: string
  sectionFinancePlanId: string
}

interface SummaryMetric {
  label: string
  secondaryLabel: string
  value: number
}

export function SectionFinanceSummaryBlock({
  projectFinanceId,
  sectionFinancePlanId,
}: SectionFinanceSummaryBlockProps) {
  const plannedPaymentsQuery = usePlannedPayments(projectFinanceId)
  const plannedCostsQuery = usePlannedCosts(projectFinanceId)
  const actualPaymentsQuery = useActualPayments({ projectFinanceId })
  const actualCostsQuery = useActualCosts({ projectFinanceId })

  const sectionPlannedPayments = (plannedPaymentsQuery.data?.items ?? []).filter(
    (plannedPayment) => plannedPayment.sectionFinancePlanIds.includes(sectionFinancePlanId),
  )
  const sectionPlannedCosts = (plannedCostsQuery.data?.items ?? []).filter((plannedCost) =>
    plannedCost.sectionFinancePlanIds.includes(sectionFinancePlanId),
  )
  const sectionPlannedPaymentIds = new Set(sectionPlannedPayments.map((plannedPayment) => plannedPayment.id))
  const sectionPlannedCostIds = new Set(sectionPlannedCosts.map((plannedCost) => plannedCost.id))
  const activePlannedPayments = sectionPlannedPayments.filter(isActiveRecord)
  const activePlannedCosts = sectionPlannedCosts.filter(isActiveRecord)
  const activeActualPayments = (actualPaymentsQuery.data?.items ?? []).filter(
    (actualPayment) =>
      isActiveRecord(actualPayment) && sectionPlannedPaymentIds.has(actualPayment.plannedPaymentId),
  )
  const activeActualCosts = (actualCostsQuery.data?.items ?? []).filter(
    (actualCost) => isActiveRecord(actualCost) && sectionPlannedCostIds.has(actualCost.plannedCostId),
  )

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
    activePlannedPayments.length +
    activePlannedCosts.length +
    activeActualPayments.length +
    activeActualCosts.length

  const plannedPaymentsTotal = sumAmounts(activePlannedPayments)
  const plannedCostsTotal = sumAmounts(activePlannedCosts)
  const actualPaymentsTotal = sumAmounts(activeActualPayments)
  const actualCostsTotal = sumAmounts(activeActualCosts)

  const metrics: SummaryMetric[] = [
    {
      label: 'Плановые поступления',
      secondaryLabel: formatRecordCount(activePlannedPayments.length),
      value: plannedPaymentsTotal,
    },
    {
      label: 'Плановые расходы',
      secondaryLabel: formatRecordCount(activePlannedCosts.length),
      value: plannedCostsTotal,
    },
    {
      label: 'Фактические поступления',
      secondaryLabel: formatRecordCount(activeActualPayments.length),
      value: actualPaymentsTotal,
    },
    {
      label: 'Фактические расходы',
      secondaryLabel: formatRecordCount(activeActualCosts.length),
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
    <Paper
      sx={{
        borderColor: 'divider',
        bgcolor: 'background.default',
        p: { xs: 2, md: 2.5 },
      }}
      variant="outlined"
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1">Сводка по разделу</Typography>
          <Typography color="text.secondary" variant="body2">
            Текущие суммы по активным движениям, связанным с этим разделом.
          </Typography>
        </Stack>

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
            title="Не удалось загрузить сводку по разделу"
          />
        ) : null}

        {!hasError && isPending ? <CompactLoadingState /> : null}

        {!hasError && !isPending && totalItemCount === 0 ? <CompactEmptyState /> : null}

        {!hasError && !isPending && totalItemCount > 0 ? (
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1.5}
            useFlexGap
          >
            {metrics.map((metric) => (
              <SummaryMetricCard key={metric.label} metric={metric} />
            ))}
          </Stack>
        ) : null}
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
          lg: '1 1 calc(33.333% - 8px)',
        },
        minWidth: 0,
        p: 1.75,
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

function CompactLoadingState() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.25}
      sx={{ minHeight: 96 }}
      textAlign="center"
    >
      <CircularProgress size={24} />
      <Stack spacing={0.25}>
        <Typography variant="body2">Загружаем сводку по разделу</Typography>
        <Typography color="text.secondary" variant="caption">
          Собираем плановые и фактические движения по этому разделу.
        </Typography>
      </Stack>
    </Stack>
  )
}

function CompactEmptyState() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        minHeight: 96,
        px: 2,
        py: 2.5,
      }}
      textAlign="center"
    >
      <Typography variant="body2">Сводка по разделу пока пустая</Typography>
      <Typography color="text.secondary" variant="caption">
        С этим разделом пока не связано активных плановых или фактических движений.
      </Typography>
    </Stack>
  )
}

function isActiveRecord<T extends { state: string }>(item: T) {
  return item.state === 'ACTIVE'
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

function sumAmounts(
  items: Array<
    PlannedPayment | PlannedCost | ActualPayment | ActualCost
  >,
) {
  return items.reduce((total, item) => total + toNumericAmount(item.amount), 0)
}

function toNumericAmount(value: string) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function formatRecordCount(count: number) {
  if (count === 1) {
    return '1 активная запись'
  }

  return `${count} активных записей`
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
    'Неизвестная ошибка сводки по разделу'

  return `Сводка по разделу недоступна, потому что не удалось загрузить: ${joinLabels(failedSources)}. ${primaryMessage}`
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
