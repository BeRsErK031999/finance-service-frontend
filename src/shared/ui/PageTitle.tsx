import type { ReactNode } from 'react'

import { Stack, Typography } from '@mui/material'

interface PageTitleProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return (
    <Stack
      alignItems={{ xs: 'flex-start', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      spacing={2}
    >
      <Stack spacing={0.5}>
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary">{subtitle}</Typography>
        ) : null}
      </Stack>
      {action}
    </Stack>
  )
}
