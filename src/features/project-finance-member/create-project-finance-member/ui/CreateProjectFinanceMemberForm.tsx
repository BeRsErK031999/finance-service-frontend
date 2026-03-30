import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'

import {
  useCreateProjectFinanceMemberMutation,
  useProjectFinanceAvailableMembersQuery,
} from '../../../../entities/project-finance-member/api/project-finance-member.query'
import {
  PROJECT_FINANCE_MEMBER_ACCESS_LEVELS,
  type ProjectFinanceAvailableMember,
  type ProjectFinanceMemberAccessLevel,
} from '../../../../entities/project-finance-member/model/types'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  createProjectFinanceMemberFormSchema,
  defaultCreateProjectFinanceMemberFormValues,
  mapCreateProjectFinanceMemberFormValuesToRequest,
  type CreateProjectFinanceMemberFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreateProjectFinanceMemberFormValues>([
  'accessLevel',
  'userId',
])

interface CreateProjectFinanceMemberFormProps {
  projectFinanceId: string
}

export function CreateProjectFinanceMemberForm({
  projectFinanceId,
}: CreateProjectFinanceMemberFormProps) {
  const createProjectFinanceMemberMutation =
    useCreateProjectFinanceMemberMutation(projectFinanceId)
  const projectFinanceAvailableMembersQuery =
    useProjectFinanceAvailableMembersQuery(projectFinanceId)
  const [formError, setFormError] = useState<string | null>(null)
  const availableMembers = projectFinanceAvailableMembersQuery.data?.items ?? []
  const availableMemberByUserId = new Map(
    availableMembers.map((member) => [member.userId, member]),
  )
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateProjectFinanceMemberFormValues>({
    defaultValues: defaultCreateProjectFinanceMemberFormValues,
    resolver: zodResolver(createProjectFinanceMemberFormSchema),
  })

  const isSubmitting = createProjectFinanceMemberMutation.isPending
  const hasAvailableMembers = availableMembers.length > 0
  const isCandidatePickerDisabled =
    isSubmitting ||
    projectFinanceAvailableMembersQuery.isPending ||
    projectFinanceAvailableMembersQuery.isError ||
    !hasAvailableMembers
  const isSubmitDisabled = isSubmitting || !hasAvailableMembers

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await createProjectFinanceMemberMutation.mutateAsync(
        mapCreateProjectFinanceMemberFormValuesToRequest(values),
      )

      reset(defaultCreateProjectFinanceMemberFormValues)
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isCreateProjectFinanceMemberFieldName(fieldName)
        ) {
          return
        }

        setError(fieldName, {
          message: issue.message,
          type: 'server',
        })
      })

      const hasOnlyFieldIssues =
        fieldIssues.length > 0 &&
        fieldIssues.length === getValidationIssueCount(apiError.details)

      if (!hasOnlyFieldIssues) {
        setFormError(apiError.message)
      }
    }
  })

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack component="form" noValidate onSubmit={onSubmit} spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Добавить участника</Typography>
          <Typography color="text.secondary">
            Выберите человека из доступного списка и назначьте ему уровень доступа
            внутри этого финансового плана.
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        {projectFinanceAvailableMembersQuery.isError ? (
          <Stack alignItems="flex-start" spacing={1.5}>
            <Alert severity="error" variant="outlined">
              {projectFinanceAvailableMembersQuery.error.message}
            </Alert>

            <Button
              disabled={isSubmitting}
              onClick={() => void projectFinanceAvailableMembersQuery.refetch()}
              variant="outlined"
            >
              Обновить список сотрудников
            </Button>
          </Stack>
        ) : null}

        {!projectFinanceAvailableMembersQuery.isPending &&
        !projectFinanceAvailableMembersQuery.isError &&
        !hasAvailableMembers ? (
          <Alert severity="info" variant="outlined">
            Сейчас нет доступных сотрудников, которых можно добавить в этот финансовый план.
          </Alert>
        ) : null}

        <Controller
          control={control}
          name="userId"
          render={({ field, fieldState }) => (
            <Autocomplete
              autoHighlight
              disabled={isCandidatePickerDisabled}
              getOptionLabel={getAvailableMemberOptionLabel}
              isOptionEqualToValue={(option, value) =>
                option.userId === value.userId
              }
              loading={projectFinanceAvailableMembersQuery.isPending}
              onChange={(_, value) => field.onChange(value?.userId ?? '')}
              options={availableMembers}
              value={availableMemberByUserId.get(field.value) ?? null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ??
                    'Найдите и выберите сотрудника'
                  }
                  label="Участник"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {projectFinanceAvailableMembersQuery.isPending ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{option.displayName}</Typography>
                    {option.displayName !== option.userId ? (
                      <Typography color="text.secondary" variant="caption">
                        {option.userId}
                      </Typography>
                    ) : null}
                  </Stack>
                </li>
              )}
            />
          )}
        />

        <TextField
          {...register('accessLevel')}
          disabled={isSubmitting}
          error={Boolean(errors.accessLevel)}
          fullWidth
          helperText={errors.accessLevel?.message ?? 'Выберите уровень доступа: просмотр или редактирование'}
          label="Уровень доступа"
          select
        >
          {PROJECT_FINANCE_MEMBER_ACCESS_LEVELS.map((accessLevel) => (
            <MenuItem key={accessLevel} value={accessLevel}>
              {getAccessLevelLabel(accessLevel)}
            </MenuItem>
          ))}
        </TextField>

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitDisabled} type="submit" variant="contained">
            {isSubmitting ? 'Добавляем...' : 'Добавить участника'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function getFieldValidationIssues(error: ApiError): ApiValidationIssue[] {
  if (!isApiValidationErrorDetails(error.details)) {
    return []
  }

  return error.details.issues.filter((issue) => {
    const fieldName = issue.path[0]

    return (
      typeof fieldName === 'string' &&
      isCreateProjectFinanceMemberFieldName(fieldName)
    )
  })
}

function getValidationIssueCount(details: unknown): number {
  if (!isApiValidationErrorDetails(details)) {
    return 0
  }

  return details.issues.length
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

function isApiValidationErrorDetails(
  details: unknown,
): details is ApiValidationErrorDetails {
  if (typeof details !== 'object' || details === null) {
    return false
  }

  const issues = (details as { issues?: unknown }).issues

  return Array.isArray(issues)
}

function isCreateProjectFinanceMemberFieldName(
  value: string,
): value is keyof CreateProjectFinanceMemberFormValues {
  return FIELD_NAMES.has(value as keyof CreateProjectFinanceMemberFormValues)
}

function getAccessLevelLabel(accessLevel: ProjectFinanceMemberAccessLevel) {
  return accessLevel === 'EDIT' ? 'Редактирование' : 'Просмотр'
}

function getAvailableMemberOptionLabel(option: ProjectFinanceAvailableMember) {
  return option.displayName
}
