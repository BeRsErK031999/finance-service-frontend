import { useState } from 'react'
import type { ReactNode } from 'react'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import ViewAgendaRoundedIcon from '@mui/icons-material/ViewAgendaRounded'
import {
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'

import {
  useProjectFinanceAccessQuery,
  useProjectFinanceDetailsQuery,
} from '../../entities/project-finance/api/project-finance.query'
import type { ProjectFinance } from '../../entities/project-finance/model/types'
import { EditProjectFinanceForm } from '../../features/project-finance/edit-project-finance/ui/EditProjectFinanceForm'
import { getFinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatDateTime, formatOptionalDateTime } from '../../shared/lib/format'
import { AccessNotice } from '../../shared/ui/AccessNotice'
import { ActionAvailabilityHint } from '../../shared/ui/ActionAvailabilityHint'
import { CollapsibleSectionCard } from '../../shared/ui/CollapsibleSectionCard'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { LoadingState } from '../../shared/ui/LoadingState'
import { PageContainer } from '../../shared/ui/PageContainer'
import { TechnicalDetailsSection } from '../../shared/ui/TechnicalDetailsSection'
import { ProjectFinanceMembersBlock } from '../../widgets/project-finance-members-block/ProjectFinanceMembersBlock'
import { ProjectFinanceSummaryBlock } from '../../widgets/project-finance-summary-block/ProjectFinanceSummaryBlock'
import { SectionFinancePlanBlock } from '../../widgets/section-finance-plan-block/SectionFinancePlanBlock'

const DEFAULT_SECTION_EXPANDED_STATE = {
  generalInfo: true,
  members: false,
  projectSummary: true,
  sectionFinances: true,
}

type SectionExpandedState = typeof DEFAULT_SECTION_EXPANDED_STATE
type SectionExpandedKey = keyof SectionExpandedState

export function ProjectFinanceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const projectFinanceQuery = useProjectFinanceDetailsQuery(id)
  const projectFinanceAccessQuery = useProjectFinanceAccessQuery(id)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [sectionExpandedState, setSectionExpandedState] = useState<SectionExpandedState>(
    DEFAULT_SECTION_EXPANDED_STATE,
  )
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

  const handleSectionToggle = (
    section: SectionExpandedKey,
    expanded: boolean,
  ) => {
    setSectionExpandedState((current) => ({
      ...current,
      [section]: expanded,
    }))
  }

  const handleCollapseAllSections = () => {
    setSectionExpandedState({
      generalInfo: false,
      members: false,
      projectSummary: false,
      sectionFinances: false,
    })
  }

  const handleExpandMainSections = () => {
    setSectionExpandedState(DEFAULT_SECTION_EXPANDED_STATE)
  }

  const canEditProjectFinance =
    financeCapabilities.canEditProjectFinance && projectFinance?.state === 'ACTIVE'
  const projectFinanceEditReason = getProjectFinanceEditReason({
    canEditProjectFinance: financeCapabilities.canEditProjectFinance,
    projectFinance,
    readOnlyReason: financeCapabilities.readOnlyReason,
  })
  const projectFinanceEditHint = canEditProjectFinance
    ? 'Можно изменить название, внешний ID проекта и описание.'
    : projectFinanceEditReason

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          startIcon={<ArrowBackRoundedIcon />}
          to="/project-finances"
          variant="text"
        >
          К списку
        </Button>

        {projectFinance ? (
          <ProjectFinanceControlPanel
            onCollapseAll={handleCollapseAllSections}
            onExpandMain={handleExpandMainSections}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            projectFinance={projectFinance}
          />
        ) : (
          <Stack spacing={0.5}>
            <Typography component="h1" variant="h4">
              {title}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>
        )}

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
          <Stack spacing={3}>
            <CollapsibleSectionCard
              actions={
                <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={1}>
                  <Button
                    disabled={!canEditProjectFinance}
                    onClick={() => setIsEditFormOpen((current) => !current)}
                    startIcon={<EditOutlinedIcon />}
                    variant="outlined"
                  >
                    {isEditFormOpen ? 'Скрыть форму' : 'Редактировать'}
                  </Button>
                  {projectFinanceEditHint ? (
                    <ActionAvailabilityHint message={projectFinanceEditHint} />
                  ) : null}
                </Stack>
              }
              expanded={sectionExpandedState.generalInfo}
              onToggle={(expanded) => handleSectionToggle('generalInfo', expanded)}
              subtitle="Главные сведения по финансовому плану и текущее состояние записи."
              summary={
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ flexWrap: 'wrap' }}
                  useFlexGap
                >
                  <ProjectFinanceSummaryBadge
                    label="Состояние"
                    value={<FinanceStatusChip value={projectFinance.state} />}
                  />
                  <ProjectFinanceSummaryBadge
                    label="Обновлён"
                    value={formatDateTime(projectFinance.updatedAt)}
                  />
                </Stack>
              }
              title="Общая информация"
            >
              <Stack spacing={3}>
                <Stack divider={<Divider flexItem />} spacing={2.5}>
                  <ProjectFinanceDetailRow label="Название" value={projectFinance.name} />
                  <ProjectFinanceDetailRow
                    label="Внешний ID проекта"
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
                    label="Последнее обновление"
                    value={formatDateTime(projectFinance.updatedAt)}
                  />
                </Stack>

                <TechnicalDetailsSection>
                  <Stack divider={<Divider flexItem />} spacing={2}>
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
                      value={formatOptionalDateTime(projectFinance.archivedAt, 'Не архивирован')}
                    />
                    <ProjectFinanceDetailRow
                      label="Удалён"
                      value={formatOptionalDateTime(projectFinance.deletedAt, 'Не удалён')}
                    />
                  </Stack>
                </TechnicalDetailsSection>

                <Collapse in={isEditFormOpen && canEditProjectFinance} unmountOnExit>
                  <EditProjectFinanceForm
                    onCancel={() => setIsEditFormOpen(false)}
                    onSuccess={() => setIsEditFormOpen(false)}
                    projectFinance={projectFinance}
                  />
                </Collapse>
              </Stack>
            </CollapsibleSectionCard>

            <ProjectFinanceSummaryBlock
              expanded={sectionExpandedState.projectSummary}
              onExpandedChange={(expanded) =>
                handleSectionToggle('projectSummary', expanded)
              }
              projectFinanceId={projectFinance.id}
            />

            <ProjectFinanceMembersBlock
              expanded={sectionExpandedState.members}
              financeCapabilities={financeCapabilities}
              onExpandedChange={(expanded) => handleSectionToggle('members', expanded)}
              projectFinanceId={projectFinance.id}
            />

            <SectionFinancePlanBlock
              expanded={sectionExpandedState.sectionFinances}
              financeCapabilities={financeCapabilities}
              onExpandedChange={(expanded) =>
                handleSectionToggle('sectionFinances', expanded)
              }
              projectFinanceId={projectFinance.id}
            />
          </Stack>
        ) : null}
      </Stack>

      <ProjectFinanceInstructionsDrawer
        onClose={() => setIsInstructionsOpen(false)}
        open={isInstructionsOpen}
      />
    </PageContainer>
  )
}

function ProjectFinanceControlPanel({
  onCollapseAll,
  onExpandMain,
  onOpenInstructions,
  projectFinance,
}: {
  onCollapseAll: () => void
  onExpandMain: () => void
  onOpenInstructions: () => void
  projectFinance: ProjectFinance
}) {
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 } }} variant="outlined">
      <Stack spacing={2}>
        <Stack
          alignItems={{ xs: 'flex-start', md: 'center' }}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="h5">
              {projectFinance.name}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
              useFlexGap
            >
              <ProjectFinanceSummaryBadge
                label="Внешний ID проекта"
                value={projectFinance.externalProjectId}
              />
              <ProjectFinanceSummaryBadge
                label="Статус плана"
                value={<FinanceStatusChip value={projectFinance.state} />}
              />
            </Stack>
          </Stack>

          <Stack
            alignItems={{ xs: 'stretch', md: 'center' }}
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
          >
            <IconButton
              aria-label="Открыть инструкцию по странице"
              color="primary"
              onClick={onOpenInstructions}
            >
              <HelpOutlineRoundedIcon />
            </IconButton>
            <Button
              onClick={onCollapseAll}
              startIcon={<UnfoldLessRoundedIcon />}
              variant="outlined"
            >
              Свернуть все
            </Button>
            <Button
              onClick={onExpandMain}
              startIcon={<ViewAgendaRoundedIcon />}
              variant="contained"
            >
              Развернуть основные
            </Button>
          </Stack>
        </Stack>

        <Typography color="text.secondary" variant="body2">
          Основные блоки страницы можно быстро свернуть и развернуть, чтобы сосредоточиться на нужной части плана.
        </Typography>
      </Stack>
    </Paper>
  )
}

function ProjectFinanceInstructionsDrawer({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  return (
    <Drawer anchor="right" onClose={onClose} open={open}>
      <Stack spacing={3} sx={{ p: 3, width: { xs: 320, sm: 420 } }}>
        <Stack spacing={1}>
          <Typography variant="h6">Как пользоваться этой страницей</Typography>
          <Typography color="text.secondary" variant="body2">
            Это рабочая карточка финансового плана проекта. Здесь удобно быстро проверить состояние плана, посмотреть участников и перейти к нужному разделу с плановыми и фактическими движениями.
          </Typography>
        </Stack>

        <InstructionSection
          description="В общей информации можно менять название плана, внешний ID проекта и описание. В разделах можно работать с блоками, плановыми поступлениями, плановыми расходами и их фактическими записями."
          title="Что здесь можно редактировать"
        />

        <InstructionSection
          description="Если кнопка недоступна, рядом показывается понятная причина. Чаще всего это связано с правами доступа, архивным состоянием записи или тем, что по плановой записи уже существует активный факт."
          title="Почему действие может быть недоступно"
        />

        <InstructionSection
          description="Верхние кнопки помогают быстро свернуть страницу. Крупные и вложенные блоки можно раскрывать по мере необходимости, чтобы не читать длинную ленту целиком."
          title="Как работают сворачиваемые блоки"
        />

        <InstructionSection
          description="Статус `Запланировано` означает, что запись создана заранее. `Ожидается` показывает, что наступило условие ожидания. `Получено` означает, что факт уже зафиксирован. `В архиве` показывает, что запись больше не участвует в активной работе."
          title="Как читать статусы"
        />
      </Stack>
    </Drawer>
  )
}

function InstructionSection({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Stack>
  )
}

function ProjectFinanceSummaryBadge({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <Paper
      sx={{
        bgcolor: 'background.default',
        px: 1.5,
        py: 1,
      }}
      variant="outlined"
    >
      <Stack spacing={0.25}>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        {typeof value === 'string' ? <Typography variant="body2">{value}</Typography> : value}
      </Stack>
    </Paper>
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

function getProjectFinanceEditReason({
  canEditProjectFinance,
  projectFinance,
  readOnlyReason,
}: {
  canEditProjectFinance: boolean
  projectFinance: ProjectFinance | undefined
  readOnlyReason: string | null
}) {
  if (!canEditProjectFinance) {
    return readOnlyReason ?? 'Изменять этот финансовый план можно только с правом редактирования.'
  }

  if (projectFinance?.state !== 'ACTIVE') {
    return 'Редактирование доступно только для активного финансового плана.'
  }

  return null
}
