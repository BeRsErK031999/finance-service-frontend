import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { useCreateSectionFinancePlan } from '../../../../entities/section-finance-plan/api/section-finance-plan.query'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  createSectionFinancePlanFormSchema,
  defaultCreateSectionFinancePlanFormValues,
  mapCreateSectionFinancePlanFormValuesToRequest,
  type CreateSectionFinancePlanFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreateSectionFinancePlanFormValues>([
  'description',
  'externalSectionId',
  'name',
])

interface CreateSectionFinancePlanFormProps {
  projectFinanceId: string
}

export function CreateSectionFinancePlanForm({
  projectFinanceId,
}: CreateSectionFinancePlanFormProps) {
  const createSectionFinancePlanMutation = useCreateSectionFinancePlan()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateSectionFinancePlanFormValues>({
    defaultValues: defaultCreateSectionFinancePlanFormValues,
    resolver: zodResolver(createSectionFinancePlanFormSchema),
  })

  const isSubmitting = createSectionFinancePlanMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await createSectionFinancePlanMutation.mutateAsync(
        mapCreateSectionFinancePlanFormValuesToRequest(values, projectFinanceId),
      )

      reset(defaultCreateSectionFinancePlanFormValues)
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isCreateSectionFinancePlanFieldName(fieldName)
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
          <Typography variant="h6">Новый раздел</Typography>
          <Typography color="text.secondary">
            Используйте внешний ID раздела проекта, который уже существует в backend
            и относится к текущему ProjectFinance.
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        <TextField
          {...register('externalSectionId')}
          disabled={isSubmitting}
          error={Boolean(errors.externalSectionId)}
          fullWidth
          helperText={errors.externalSectionId?.message}
          label="Внешний ID раздела"
        />

        <TextField
          {...register('name')}
          disabled={isSubmitting}
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message}
          label="Название раздела"
        />

        <TextField
          {...register('description')}
          disabled={isSubmitting}
          error={Boolean(errors.description)}
          fullWidth
          helperText={errors.description?.message ?? 'Необязательно'}
          label="Описание"
          minRows={4}
          multiline
        />

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Сохранение...' : 'Создать раздел'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  return parseApiError(error)
}

function getFieldValidationIssues(error: ApiError): ApiValidationIssue[] {
  if (!isApiValidationErrorDetails(error.details)) {
    return []
  }

  return error.details.issues.filter((issue) => {
    const fieldName = issue.path[0]

    return (
      typeof fieldName === 'string' &&
      isCreateSectionFinancePlanFieldName(fieldName)
    )
  })
}

function getValidationIssueCount(details: unknown): number {
  if (!isApiValidationErrorDetails(details)) {
    return 0
  }

  return details.issues.length
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

function isCreateSectionFinancePlanFieldName(
  value: string,
): value is keyof CreateSectionFinancePlanFormValues {
  return FIELD_NAMES.has(value as keyof CreateSectionFinancePlanFormValues)
}
