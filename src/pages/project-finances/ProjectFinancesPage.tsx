import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

import { EmptyState } from '../../shared/ui/EmptyState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

export function ProjectFinancesPage() {
  return (
    <PageContainer>
      <PageTitle
        action={
          <Button disabled startIcon={<AddRoundedIcon />} variant="contained">
            New project finance
          </Button>
        }
        subtitle="Entry point for project finance list, filters and summary widgets."
        title="Project finances"
      />

      <SectionCard
        subtitle="Router, query client, theme and API layer are already connected."
        title="Frontend foundation is ready"
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            Add list widgets, filters, table views and data hooks here on the next
            iterations.
          </Typography>
          <Typography color="text.secondary">
            The details route already exists, so navigation flows can be built in
            parallel with API integration.
          </Typography>
        </Stack>
      </SectionCard>

      <EmptyState
        action={
          <Button
            component={RouterLink}
            to="/project-finances/demo-project"
            variant="outlined"
          >
            Open placeholder details
          </Button>
        }
        description="Business widgets, tables and forms are intentionally not implemented yet."
        title="No business content yet"
      />
    </PageContainer>
  )
}
