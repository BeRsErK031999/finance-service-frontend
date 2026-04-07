import { Chip, Stack, Typography } from '@mui/material'

import type { BudgetRow } from '../../shared/lib/budget-table'
import {
  formatAmount,
  formatDate,
} from '../../shared/lib/format'

export function BudgetActualCell({
  row,
}: {
  row: BudgetRow
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
