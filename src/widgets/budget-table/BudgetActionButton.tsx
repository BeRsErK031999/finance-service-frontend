import type { ComponentProps } from 'react'

import {
  Button,
  Tooltip,
} from '@mui/material'

interface BudgetActionButtonProps
  extends Omit<ComponentProps<typeof Button>, 'children' | 'variant'> {
  children: string
  disabledReason: string | null
  isPending?: boolean
  variant?: 'outlined' | 'contained' | 'text'
}

export function BudgetActionButton({
  children,
  disabledReason,
  isPending = false,
  variant = 'outlined',
  ...buttonProps
}: BudgetActionButtonProps) {
  const isDisabled = disabledReason !== null || isPending || buttonProps.disabled

  return (
    <Tooltip disableHoverListener={!disabledReason} title={disabledReason ?? ''}>
      <span>
        <Button disabled={isDisabled} size="small" variant={variant} {...buttonProps}>
          {isPending ? '...' : children}
        </Button>
      </span>
    </Tooltip>
  )
}
