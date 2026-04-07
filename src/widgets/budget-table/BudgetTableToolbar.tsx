import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { formatAmount } from '../../shared/lib/format'
import { BudgetActionButton } from './BudgetActionButton'
import {
  formatSignedAmount,
  getBudgetStatusFilterLabel,
  getBudgetTypeFilterLabel,
} from './budget-table.helpers'
import {
  BUDGET_STATUS_FILTER_VALUES,
  BUDGET_TYPE_FILTER_VALUES,
  type BudgetStatusFilterValue,
  type BudgetSummary,
  type BudgetTypeFilterValue,
} from './budget-table.types'

interface BudgetTableToolbarProps {
  createPlannedCostDisabledReason: string | null
  createPlannedPaymentDisabledReason: string | null
  filteredRowsCount: number
  onCreatePlannedCost: () => void
  onCreatePlannedPayment: () => void
  onResetFilters: () => void
  onStatusFilterChange: (value: BudgetStatusFilterValue) => void
  onTypeFilterChange: (value: BudgetTypeFilterValue) => void
  statusFilter: BudgetStatusFilterValue
  summary: BudgetSummary
  typeFilter: BudgetTypeFilterValue
}

export function BudgetTableToolbar({
  createPlannedCostDisabledReason,
  createPlannedPaymentDisabledReason,
  filteredRowsCount,
  onCreatePlannedCost,
  onCreatePlannedPayment,
  onResetFilters,
  onStatusFilterChange,
  onTypeFilterChange,
  statusFilter,
  summary,
  typeFilter,
}: BudgetTableToolbarProps) {
  return (
    <>
      <Stack
        alignItems={{ xs: 'stretch', xl: 'center' }}
        direction={{ xs: 'column', xl: 'row' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="budget-table-type-filter-label">Тип</InputLabel>
            <Select
              label="Тип"
              labelId="budget-table-type-filter-label"
              onChange={(event) =>
                onTypeFilterChange(event.target.value as BudgetTypeFilterValue)
              }
              value={typeFilter}
            >
              {BUDGET_TYPE_FILTER_VALUES.map((value) => (
                <MenuItem key={value} value={value}>
                  {getBudgetTypeFilterLabel(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="budget-table-status-filter-label">Статус</InputLabel>
            <Select
              label="Статус"
              labelId="budget-table-status-filter-label"
              onChange={(event) =>
                onStatusFilterChange(event.target.value as BudgetStatusFilterValue)
              }
              value={statusFilter}
            >
              {BUDGET_STATUS_FILTER_VALUES.map((value) => (
                <MenuItem key={value} value={value}>
                  {getBudgetStatusFilterLabel(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={onResetFilters} variant="text">
            Сбросить
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <BudgetActionButton
            disabledReason={createPlannedPaymentDisabledReason}
            onClick={onCreatePlannedPayment}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            Добавить доход
          </BudgetActionButton>

          <BudgetActionButton
            disabledReason={createPlannedCostDisabledReason}
            onClick={onCreatePlannedCost}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            Добавить расход
          </BudgetActionButton>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ flexWrap: 'wrap' }}
        useFlexGap
      >
        <BudgetSummaryBadge label="Строк после фильтрации" value={String(filteredRowsCount)} />
        <BudgetSummaryBadge
          label="План доходов"
          tone="success"
          value={formatAmount(summary.plannedPayments)}
        />
        <BudgetSummaryBadge
          label="План расходов"
          tone="warning"
          value={formatAmount(summary.plannedCosts)}
        />
        <BudgetSummaryBadge
          label="Баланс"
          tone={summary.balance < 0 ? 'error' : 'success'}
          value={formatSignedAmount(summary.balance)}
        />
        <BudgetSummaryBadge label="Активных фактов" value={String(summary.actualCount)} />
      </Stack>
    </>
  )
}

function BudgetSummaryBadge({
  label,
  tone = 'default',
  value,
}: {
  label: string
  tone?: 'default' | 'success' | 'warning' | 'error'
  value: string
}) {
  return (
    <Stack
      spacing={0.25}
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
          border: 1,
          borderColor:
            toneColor === null ? 'divider' : alpha(toneColor, 0.22),
          borderRadius: 1,
          minWidth: 170,
          px: 1.5,
          py: 1,
        }
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={600} variant="body2">
        {value}
      </Typography>
    </Stack>
  )
}
