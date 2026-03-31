import type { ReactNode } from 'react'

import { Stack, Typography } from '@mui/material'

import { CollapsibleSectionCard } from './CollapsibleSectionCard'

interface TechnicalDetailsSectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function TechnicalDetailsSection({
  children,
  title = 'Служебная информация',
  subtitle = 'Версия, даты записи и другие технические поля.',
}: TechnicalDetailsSectionProps) {
  return (
    <CollapsibleSectionCard
      contentSx={{ pt: 2.5 }}
      defaultExpanded={false}
      headerSx={{ pb: 2.5 }}
      subtitle={subtitle}
      surface="paper"
      title={title}
    >
      <Stack spacing={2}>
        {children}
        <Typography color="text.secondary" variant="caption">
          Эти поля помогают проверить историю записи, но обычно не нужны для ежедневной работы.
        </Typography>
      </Stack>
    </CollapsibleSectionCard>
  )
}
