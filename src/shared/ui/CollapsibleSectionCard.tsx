import { useState } from 'react'
import type { ReactNode } from 'react'

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

interface CollapsibleSectionCardProps {
  children: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  summary?: ReactNode
  actions?: ReactNode
  expanded?: boolean
  defaultExpanded?: boolean
  onToggle?: (expanded: boolean) => void
  surface?: 'card' | 'paper'
  contentSx?: SxProps<Theme>
  headerSx?: SxProps<Theme>
}

export function CollapsibleSectionCard({
  children,
  title,
  subtitle,
  summary,
  actions,
  expanded,
  defaultExpanded = true,
  onToggle,
  surface = 'card',
  contentSx,
  headerSx,
}: CollapsibleSectionCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  const handleToggle = () => {
    const nextExpanded = !isExpanded

    if (expanded === undefined) {
      setInternalExpanded(nextExpanded)
    }

    onToggle?.(nextExpanded)
  }

  const header = (
    <>
      <CardContent sx={headerSx}>
        <Stack spacing={2}>
          <Stack
            alignItems={{ xs: 'flex-start', md: 'center' }}
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="h6">{title}</Typography>
              {subtitle ? (
                <Typography color="text.secondary" variant="body2">
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>

            <Stack
              alignItems={{ xs: 'stretch', md: 'center' }}
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              {actions}
              <IconButton
                aria-label={isExpanded ? 'Свернуть блок' : 'Развернуть блок'}
                onClick={handleToggle}
                size="small"
                sx={{
                  alignSelf: { xs: 'flex-start', md: 'center' },
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: (theme) =>
                    theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              >
                <ExpandMoreRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>

          {summary ? <Stack spacing={1}>{summary}</Stack> : null}
        </Stack>
      </CardContent>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={contentSx}>{children}</CardContent>
      </Collapse>
    </>
  )

  if (surface === 'paper') {
    return <Paper variant="outlined">{header}</Paper>
  }

  return <Card variant="outlined">{header}</Card>
}
