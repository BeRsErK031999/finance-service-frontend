import { useState } from 'react'
import type { ReactNode } from 'react'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Button, Collapse, Divider, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'

import {
  useProjectFinanceAccessQuery,
  useProjectFinanceDetailsQuery,
} from '../../entities/project-finance/api/project-finance.query'
import { EditProjectFinanceForm } from '../../features/project-finance/edit-project-finance/ui/EditProjectFinanceForm'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatDateTime, formatOptionalDateTime } from '../../shared/lib/format'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'
import { ProjectFinanceMembersBlock } from '../../widgets/project-finance-members-block/ProjectFinanceMembersBlock'
import { ProjectFinanceSummaryBlock } from '../../widgets/project-finance-summary-block/ProjectFinanceSummaryBlock'
import { SectionFinancePlanBlock } from '../../widgets/section-finance-plan-block/SectionFinancePlanBlock'

export function ProjectFinanceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const projectFinanceQuery = useProjectFinanceDetailsQuery(id)
  const projectFinanceAccessQuery = useProjectFinanceAccessQuery(id)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const financeCapabilities = getFinanceCapabilities({
    projectFinanceAccess: projectFinanceAccessQuery.data ?? null,
  })
  const projectFinance = projectFinanceQuery.data
  const title = projectFinance?.name ?? 'Финансовый план проекта'
  const subtitle = projectFinance
    ? `Внешний ID проекта: ${projectFinance.externalProjectId}`
    : id
      ? `ID финансового плана: ${id}`
      : 'Идентификатор финансового плана не указан.'

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
            К списку
          </Button>
        }
        subtitle={subtitle}
        title={title}
      />

      {financeCapabilities.readOnlyReason && financeCapabilities.canViewProjectFinance ? (
        <AccessNotice message={financeCapabilities.readOnlyReason} />
      ) : null}

      {!id ? (
        <EmptyState
          description="Откройте эту страницу из списка финансовых планов, чтобы в маршруте был корректный идентификатор."
          title="Не указан ID финансового плана"
        />
      ) : null}

      {id && projectFinanceQuery.isPending ? (
        <LoadingState
          description="Загружаем данные финансового плана."
          title="Загружаем финансовый план"
        />
      ) : null}

      {id && projectFinanceQuery.isError && projectFinanceQuery.error.statusCode === 404 ? (
        <EmptyState
          description="Запрошенный финансовый план не найден или больше недоступен."
          title="Финансовый план не найден"
        />
      ) : null}

      {id &&
      projectFinanceQuery.isError &&
      projectFinanceQuery.error.statusCode !== 404 ? (
        <ErrorState
          action={
            <Button onClick={() => void projectFinanceQuery.refetch()} variant="contained">
              Повторить
            </Button>
          }
          description={projectFinanceQuery.error.message}
          title="Не удалось загрузить финансовый план"
        />
      ) : null}

      {id &&
      !projectFinanceQuery.isPending &&
      !projectFinanceQuery.isError &&
      projectFinance &&
      projectFinanceAccessQuery.isPending ? (
        <LoadingState
          description="Проверяем доступ к этому финансовому плану."
          title="Загружаем права доступа"
        />
      ) : null}

      {id &&
      !projectFinanceQuery.isPending &&
      !projectFinanceQuery.isError &&
      projectFinance &&
      projectFinanceAccessQuery.isError ? (
        <ErrorState
          action={
            <Button onClick={() => void projectFinanceAccessQuery.refetch()} variant="contained">
              Повторить
            </Button>
          }
          description={projectFinanceAccessQuery.error.message}
          title="Не удалось загрузить права доступа"
        />
      ) : null}

      {id &&
      !projectFinanceQuery.isPending &&
      !projectFinanceQuery.isError &&
      !projectFinance ? (
        <EmptyState
          description="Backend не вернул данные по этому маршруту."
          title="Финансовый план недоступен"
        />
      ) : null}

      {projectFinance &&
      !projectFinanceAccessQuery.isPending &&
      !projectFinanceAccessQuery.isError &&
      !financeCapabilities.canViewProjectFinance ? (
        <EmptyState
          description={
            financeCapabilities.readOnlyReason ??
            'Текущему пользователю недоступен этот финансовый план.'
          }
          title="Нет доступа к финансовому плану"
        />
      ) : null}

      {projectFinance &&
      !projectFinanceAccessQuery.isPending &&
      !projectFinanceAccessQuery.isError &&
      financeCapabilities.canViewProjectFinance ? (
        <Stack spacing={4}>
          <SectionCard
            action={
              financeCapabilities.canEditProjectFinance ? (
                <Button
                  disabled={projectFinance.state !== 'ACTIVE'}
                  onClick={() => setIsEditFormOpen((current) => !current)}
                  startIcon={<EditOutlinedIcon />}
                  variant="outlined"
                >
                  {isEditFormOpen ? 'Скрыть форму' : 'Редактировать'}
                </Button>
              ) : undefined
            }
            subtitle="Основные сведения и текущее состояние финансового плана."
            title="Общая информация"
          >
            <Stack spacing={3}>
              <Stack divider={<Divider flexItem />} spacing={2.5}>
                <ProjectFinanceDetailRow label="Название" value={projectFinance.name} />
                <ProjectFinanceDetailRow
                  label="ID проекта во внешней системе"
                  value={projectFinance.externalProjectId}
                />
                <ProjectFinanceDetailRow
                  label="Описание"
                  value={projectFinance.description ?? 'Описание не указано'}
                />
                <ProjectFinanceDetailRow
                  label="Состояние"
                  value={<FinanceStatusChip value={projectFinance.state} />}
                />
                <ProjectFinanceDetailRow
                  label="Версия"
                  value={String(projectFinance.version)}
                />
                <ProjectFinanceDetailRow
                  label="Создан"
                  value={formatDateTime(projectFinance.createdAt)}
                />
                <ProjectFinanceDetailRow
                  label="Обновлён"
                  value={formatDateTime(projectFinance.updatedAt)}
                />
                <ProjectFinanceDetailRow
                  label="Архивирован"
                  value={formatOptionalDateTime(projectFinance.archivedAt)}
                />
                <ProjectFinanceDetailRow
                  label="Удалён"
                  value={formatOptionalDateTime(projectFinance.deletedAt)}
                />
              </Stack>

              {financeCapabilities.canEditProjectFinance ? (
                <Collapse in={isEditFormOpen} unmountOnExit>
                  <EditProjectFinanceForm
                    onCancel={() => setIsEditFormOpen(false)}
                    onSuccess={() => setIsEditFormOpen(false)}
                    projectFinance={projectFinance}
                  />
                </Collapse>
              ) : null}
            </Stack>
          </SectionCard>

          <ProjectFinanceSummaryBlock projectFinanceId={projectFinance.id} />

          <ProjectFinanceMembersBlock
            financeCapabilities={financeCapabilities}
            projectFinanceId={projectFinance.id}
          />

          <SectionFinancePlanBlock
            financeCapabilities={financeCapabilities}
            projectFinanceId={projectFinance.id}
          />
        </Stack>
      ) : null}
    </PageContainer>
  )
}

function ProjectFinanceDetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary" variant="subtitle2">
        {label}
      </Typography>
      {typeof value === 'string' ? <Typography variant="body1">{value}</Typography> : value}
    </Stack>
  )
}
