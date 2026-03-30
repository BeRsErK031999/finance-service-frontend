import { useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {
  Button,
  Chip,
  Collapse,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import {
  useProjectFinanceMembersQuery,
  useRemoveProjectFinanceMemberMutation,
  useUpdateProjectFinanceMemberAccessMutation,
} from '../../entities/project-finance-member/api/project-finance-member.query'
import type {
  ProjectFinanceMember,
  ProjectFinanceMemberAccessLevel,
} from '../../entities/project-finance-member/model/types'
import { PROJECT_FINANCE_MEMBER_ACCESS_LEVELS } from '../../entities/project-finance-member/model/types'
import { CreateProjectFinanceMemberForm } from '../../features/project-finance-member/create-project-finance-member/ui/CreateProjectFinanceMemberForm'
import { parseApiError } from '../../shared/api/parse-api-error'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import { formatDateTime } from '../../shared/lib/format'
import type { ApiError } from '../../shared/types/api'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LoadingState } from '../../shared/ui/LoadingState'
import { SectionCard } from '../../shared/ui/SectionCard'

interface ProjectFinanceMembersBlockProps {
  financeCapabilities: FinanceCapabilities
  projectFinanceId: string
}

export function ProjectFinanceMembersBlock({
  financeCapabilities,
  projectFinanceId,
}: ProjectFinanceMembersBlockProps) {
  const projectFinanceMembersQuery = useProjectFinanceMembersQuery(projectFinanceId)
  const updateProjectFinanceMemberAccessMutation =
    useUpdateProjectFinanceMemberAccessMutation(projectFinanceId)
  const removeProjectFinanceMemberMutation =
    useRemoveProjectFinanceMemberMutation(projectFinanceId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const members = projectFinanceMembersQuery.data?.items ?? []
  const canManageMembers = financeCapabilities.canEditProjectFinance

  const handleUpdateAccess = async (
    memberId: string,
    accessLevel: ProjectFinanceMemberAccessLevel,
  ) => {
    setActionError(null)
    setUpdatingMemberId(memberId)

    try {
      await updateProjectFinanceMemberAccessMutation.mutateAsync({
        memberId,
        payload: {
          accessLevel,
        },
      })
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleRemoveMember = async (member: ProjectFinanceMember) => {
    if (
      !window.confirm(
        `Убрать участника "${getMemberPrimaryLabel(member)}" из этого финансового плана?`,
      )
    ) {
      return
    }

    setActionError(null)
    setRemovingMemberId(member.id)

    try {
      await removeProjectFinanceMemberMutation.mutateAsync(member.id)
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <SectionCard
      action={
        canManageMembers ? (
            <Button
              onClick={() => setIsCreateFormOpen((current) => !current)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
            {isCreateFormOpen ? 'Скрыть форму' : 'Добавить участника'}
          </Button>
        ) : undefined
      }
      subtitle="Участники этого финансового плана и их уровни доступа."
      title="Участники"
    >
      <Stack spacing={3}>
        {canManageMembers ? (
          <Collapse in={isCreateFormOpen} unmountOnExit>
            <CreateProjectFinanceMemberForm projectFinanceId={projectFinanceId} />
          </Collapse>
        ) : null}

        {actionError ? (
          <ErrorState
            description={actionError}
            title="Не удалось обновить участников"
          />
        ) : null}

        {projectFinanceMembersQuery.isPending ? (
          <LoadingState
            description="Загружаем участников финансового плана."
            title="Загружаем участников"
          />
        ) : null}

        {projectFinanceMembersQuery.isError ? (
          <ErrorState
            action={
              <Button
                onClick={() => void projectFinanceMembersQuery.refetch()}
                variant="contained"
              >
                Повторить
              </Button>
            }
            description={projectFinanceMembersQuery.error.message}
            title="Не удалось загрузить участников"
          />
        ) : null}

        {!projectFinanceMembersQuery.isPending &&
        !projectFinanceMembersQuery.isError &&
        members.length === 0 ? (
          <EmptyState
            action={
              canManageMembers && !isCreateFormOpen ? (
                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                >
                  Добавить участника
                </Button>
              ) : undefined
            }
            description={
              canManageMembers
                ? 'В этот финансовый план ещё никто не добавлен.'
                : 'Список участников этого финансового плана пока пуст.'
            }
            title="Пока нет участников"
          />
        ) : null}

        {!projectFinanceMembersQuery.isPending &&
        !projectFinanceMembersQuery.isError &&
        members.length > 0 ? (
          <Stack spacing={2}>
            {members.map((member) => (
              <ProjectFinanceMemberListItem
                canManageMembers={canManageMembers}
                isRemoving={removingMemberId === member.id}
                isUpdating={updatingMemberId === member.id}
                key={`${member.id}:${member.accessLevel}`}
                member={member}
                onRemove={handleRemoveMember}
                onUpdateAccess={handleUpdateAccess}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}

function ProjectFinanceMemberListItem({
  canManageMembers,
  isRemoving,
  isUpdating,
  member,
  onRemove,
  onUpdateAccess,
}: {
  canManageMembers: boolean
  isRemoving: boolean
  isUpdating: boolean
  member: ProjectFinanceMember
  onRemove: (member: ProjectFinanceMember) => Promise<void>
  onUpdateAccess: (
    memberId: string,
    accessLevel: ProjectFinanceMemberAccessLevel,
  ) => Promise<void>
}) {
  const [draftAccessLevel, setDraftAccessLevel] =
    useState<ProjectFinanceMemberAccessLevel>(member.accessLevel)

  const isBusy = isRemoving || isUpdating
  const isAccessChanged = draftAccessLevel !== member.accessLevel
  const shouldShowTechnicalUserId = member.displayName !== member.userId

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={3}
      >
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Stack
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <Typography variant="h6">{getMemberPrimaryLabel(member)}</Typography>
            <ProjectFinanceMemberAccessChip accessLevel={member.accessLevel} />
          </Stack>

          {shouldShowTechnicalUserId ? (
            <Typography color="text.secondary" variant="body2">
              {member.userId}
            </Typography>
          ) : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <ProjectFinanceMemberMetaItem
              label="Добавлен"
              value={formatDateTime(member.createdAt)}
            />
            <ProjectFinanceMemberMetaItem
              label="Обновлён"
              value={formatDateTime(member.updatedAt)}
            />
          </Stack>
        </Stack>

        {canManageMembers ? (
          <Stack alignItems={{ xs: 'stretch', lg: 'flex-end' }} spacing={1.5}>
            <TextField
              disabled={isBusy}
              label="Уровень доступа"
              onChange={(event) =>
                setDraftAccessLevel(
                  event.target.value as ProjectFinanceMemberAccessLevel,
                )
              }
              select
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 180 } }}
              value={draftAccessLevel}
            >
              {PROJECT_FINANCE_MEMBER_ACCESS_LEVELS.map((accessLevel) => (
                <MenuItem key={accessLevel} value={accessLevel}>
                  {getAccessLevelLabel(accessLevel)}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                disabled={!isAccessChanged || isBusy}
                onClick={() => void onUpdateAccess(member.id, draftAccessLevel)}
                variant="outlined"
              >
                {isUpdating ? 'Сохраняем...' : 'Сохранить доступ'}
              </Button>

              <Button
                color="error"
                disabled={isBusy}
                onClick={() => void onRemove(member)}
                variant="outlined"
              >
                {isRemoving ? 'Убираем...' : 'Убрать'}
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

function ProjectFinanceMemberAccessChip({
  accessLevel,
}: {
  accessLevel: ProjectFinanceMemberAccessLevel
}) {
  return (
    <Chip
      color={accessLevel === 'EDIT' ? 'primary' : 'default'}
      label={getAccessLevelLabel(accessLevel)}
      size="small"
      variant={accessLevel === 'EDIT' ? 'filled' : 'outlined'}
    />
  )
}

function ProjectFinanceMemberMetaItem({
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

function getAccessLevelLabel(accessLevel: ProjectFinanceMemberAccessLevel) {
  return accessLevel === 'EDIT' ? 'Редактирование' : 'Просмотр'
}

function getMemberPrimaryLabel(member: ProjectFinanceMember) {
  return member.displayName
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
