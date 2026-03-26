import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { EmptyState } from '../../shared/ui/EmptyState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

export function ProjectFinanceDetailsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <PageContainer>
      <PageTitle
        action={
          <Button
            component={RouterLink}
            startIcon={<ArrowBackRoundedIcon />}
            to="/project-finances"
            variant="text"
          >
            Back to list
          </Button>
        }
        subtitle="Placeholder route for project finance details, tabs and embedded widgets."
        title={`Project finance ${id ?? ''}`}
      />

      <SectionCard title="Planned next use">
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            Keep route-level loaders, detail queries and page widgets here as the
            real backend contracts are connected.
          </Typography>
          <Typography color="text.secondary">
            Route param is already wired and ready for entity-specific API hooks.
          </Typography>
        </Stack>
      </SectionCard>

      <EmptyState
        description="Detailed cards, tabs and finance sections will be added in later stages."
        title="Details content is not implemented yet"
      />
    </PageContainer>
  )
}
