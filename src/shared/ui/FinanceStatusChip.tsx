import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material/Chip'

const financeStatusConfig = {
  ACTIVE: {
    color: 'success',
    label: 'Active',
  },
  ARCHIVED: {
    color: 'warning',
    label: 'Archived',
  },
  DELETED: {
    color: 'default',
    label: 'Deleted',
  },
  PLANNED: {
    color: 'default',
    label: 'Planned',
  },
  EXPECTED: {
    color: 'info',
    label: 'Expected',
  },
  RECEIVED: {
    color: 'success',
    label: 'Received',
  },
  CANCELED: {
    color: 'warning',
    label: 'Canceled',
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
