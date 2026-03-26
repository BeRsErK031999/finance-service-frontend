import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material'

import {
  useArchiveSectionFinancePlan,
  useSectionFinancePlans,
} from '../../entities/section-finance-plan/api/section-finance-plan.query'
import type {
  SectionFinancePlan,
  SectionFinancePlanState,
} from '../../entities/section-finance-plan/model/types'
import { CreateSectionFinancePlanForm } from '../../features/section-finance-plan/create-section-finance-plan/ui/CreateSectionFinancePlanForm'
import { parseApiError } from '../../shared/api/parse-api-error'
import type { ApiError } from '../../shared/types/api'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'

interface SectionFinancePlanBlockProps {
  projectFinanceId: string
}

export function SectionFinancePlanBlock({
  projectFinanceId,
}: SectionFinancePlanBlockProps) {
  const sectionFinancePlansQuery = useSectionFinancePlans(projectFinanceId)
  const archiveSectionFinancePlanMutation = useArchiveSectionFinancePlan()
  const sectionFinancePlans = sectionFinancePlansQuery.data?.items ?? []
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const handleCreateToggle = () => {
    setIsCreateFormOpen((current) => !current)
  }

  const handleArchive = async (sectionFinancePlan: SectionFinancePlan) => {
    if (
      !window.confirm(`Архивировать раздел "${sectionFinancePlan.name}"?`)
    ) {
      return
    }

    setArchiveError(null)
    setArchivingId(sectionFinancePlan.id)

    try {
      await archiveSectionFinancePlanMutation.mutateAsync(sectionFinancePlan.id)
    } catch (error) {
      setArchiveError(toApiError(error).message)
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <SectionCard
      action={
        <Button
          onClick={handleCreateToggle}
          startIcon={<AddRoundedIcon />}
          variant="contained"
        >
          {isCreateFormOpen ? 'Скрыть форму' : 'Добавить раздел'}
        </Button>
      }
      subtitle="Создавайте и архивируйте разделы финансового плана внутри текущего ProjectFinance."
      title="Разделы финансового плана"
    >
      <Stack spacing={3}>
        {isCreateFormOpen ? (
          <CreateSectionFinancePlanForm projectFinanceId={projectFinanceId} />
        ) : null}

        {archiveError ? (
          <Alert severity="error" variant="outlined">
            {archiveError}
          </Alert>
        ) : null}

        {sectionFinancePlansQuery.isPending ? (
          <LoadingState
            description="Получаем разделы финансового плана из backend."
            title="Загрузка разделов"
          />
        ) : null}

        {sectionFinancePlansQuery.isError ? (
          <ErrorState
            action={
              <Button
                onClick={() => void sectionFinancePlansQuery.refetch()}
                variant="contained"
              >
                Повторить
              </Button>
            }
            description={sectionFinancePlansQuery.error.message}
            title="Не удалось загрузить разделы"
          />
        ) : null}

        {!sectionFinancePlansQuery.isPending &&
        !sectionFinancePlansQuery.isError &&
        sectionFinancePlans.length === 0 ? (
          <EmptyState
            action={
              !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить раздел
                </Button>
              ) : undefined
            }
            description="Добавьте первый раздел финансового плана для этого проекта."
            title="Разделы ещё не созданы"
          />
        ) : null}

        {!sectionFinancePlansQuery.isPending &&
        !sectionFinancePlansQuery.isError &&
        sectionFinancePlans.length > 0 ? (
          <Stack spacing={2}>
            {sectionFinancePlans.map((sectionFinancePlan) => (
              <SectionFinancePlanListItem
                isArchiving={archivingId === sectionFinancePlan.id}
                key={sectionFinancePlan.id}
                onArchive={handleArchive}
                sectionFinancePlan={sectionFinancePlan}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}

function SectionFinancePlanListItem({
  isArchiving,
  onArchive,
  sectionFinancePlan,
}: {
  isArchiving: boolean
  onArchive: (sectionFinancePlan: SectionFinancePlan) => Promise<void>
  sectionFinancePlan: SectionFinancePlan
}) {
  const isArchived = sectionFinancePlan.state !== 'ACTIVE'

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={3}
      >
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Stack
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <Typography variant="h6">{sectionFinancePlan.name}</Typography>
            <Chip
              color={getStateChipColor(sectionFinancePlan.state)}
              label={getStateLabel(sectionFinancePlan.state)}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            Внешний ID раздела: {sectionFinancePlan.externalSectionId}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {sectionFinancePlan.description ?? 'Описание не указано'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <SectionFinancePlanMetaItem
              label="Версия"
              value={String(sectionFinancePlan.version)}
            />
            <SectionFinancePlanMetaItem
              label="Создан"
              value={formatDateTime(sectionFinancePlan.createdAt)}
            />
            <SectionFinancePlanMetaItem
              label="Обновлён"
              value={formatDateTime(sectionFinancePlan.updatedAt)}
            />
            <SectionFinancePlanMetaItem
              label="Архивирован"
              value={formatOptionalDateTime(sectionFinancePlan.archivedAt)}
            />
          </Stack>
        </Stack>

        <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
          <Button
            color="warning"
            disabled={isArchived || isArchiving}
            onClick={() => void onArchive(sectionFinancePlan)}
            startIcon={<ArchiveOutlinedIcon />}
            variant="outlined"
          >
            {isArchiving
              ? 'Архивация...'
              : isArchived
                ? 'В архиве'
                : 'Архивировать'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function SectionFinancePlanMetaItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Stack spacing={0.25}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  return parseApiError(error)
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return typeof (error as { message?: unknown }).message === 'string'
}

function getStateChipColor(state: SectionFinancePlanState) {
  if (state === 'ACTIVE') {
    return 'success'
  }

  if (state === 'ARCHIVED') {
    return 'warning'
  }

  return 'default'
}

function getStateLabel(state: SectionFinancePlanState) {
  if (state === 'ACTIVE') {
    return 'Активен'
  }

  if (state === 'ARCHIVED') {
    return 'В архиве'
  }

  return 'Удалён'
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatOptionalDateTime(value: string | null) {
  return value ? formatDateTime(value) : 'Не установлен'
}
