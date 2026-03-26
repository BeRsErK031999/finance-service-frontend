import type { ReactNode } from 'react'

import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Paper, Stack, Typography } from '@mui/material'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Paper
      sx={{
        border: 1,
        borderColor: 'divider',
        px: { xs: 3, md: 4 },
        py: { xs: 4, md: 5 },
      }}
      variant="outlined"
    >
      <Stack alignItems="center" spacing={2.5} textAlign="center">
        <InboxOutlinedIcon color="disabled" sx={{ fontSize: 42 }} />
        <Stack spacing={1}>
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>
        {action}
      </Stack>
    </Paper>
  )
}
