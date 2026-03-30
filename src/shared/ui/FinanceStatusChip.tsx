import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material/Chip'

const financeStatusConfig = {
  ACTIVE: {
    color: 'success',
    label: 'Активно',
  },
  ARCHIVED: {
    color: 'warning',
    label: 'В архиве',
  },
  DELETED: {
    color: 'default',
    label: 'Удалено',
  },
  PLANNED: {
    color: 'default',
    label: 'Запланировано',
  },
  EXPECTED: {
    color: 'info',
    label: 'Ожидается',
  },
  RECEIVED: {
    color: 'success',
    label: 'Получено',
  },
  CANCELED: {
    color: 'warning',
    label: 'Отменено',
  },
} satisfies Record<string, { color: ChipProps['color']; label: string }>

export type FinanceStatusValue = keyof typeof financeStatusConfig

interface FinanceStatusChipProps {
  value: FinanceStatusValue
  size?: ChipProps['size']
  variant?: ChipProps['variant']
}

export function FinanceStatusChip({
  value,
  size = 'small',
  variant = 'outlined',
}: FinanceStatusChipProps) {
  const status = financeStatusConfig[value]

  return <Chip color={status.color} label={status.label} size={size} variant={variant} />
}
