import type { ReactNode } from 'react'

import { Card, CardContent, Divider, Stack, Typography } from '@mui/material'

interface SectionCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function SectionCard({
  children,
  title,
  subtitle,
  action,
}: SectionCardProps) {
  const hasHeader = title || subtitle || action

  return (
    <Card variant="outlined">
      {hasHeader ? (
        <>
          <CardContent>
            <Stack
              alignItems={{ xs: 'flex-start', md: 'center' }}
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.5}>
                {title ? <Typography variant="h6">{title}</Typography> : null}
                {subtitle ? (
                  <Typography color="text.secondary">{subtitle}</Typography>
                ) : null}
              </Stack>
              {action}
            </Stack>
          </CardContent>
          <Divider />
        </>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
