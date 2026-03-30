import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { useUpdateSectionFinancePlan } from '../../../../entities/section-finance-plan/api/section-finance-plan.query'
import type { SectionFinancePlan } from '../../../../entities/section-finance-plan/model/types'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  editSectionFinancePlanFormSchema,
  getEditSectionFinancePlanFormValues,
  mapEditSectionFinancePlanFormValuesToRequest,
  type EditSectionFinancePlanFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof EditSectionFinancePlanFormValues>([
  'description',
  'externalSectionId',
  'name',
])

const CONFLICT_MESSAGE =
  'Финансовый блок раздела уже изменился после открытия формы. Обновите данные и повторите попытку.'

interface EditSectionFinancePlanFormProps {
  sectionFinancePlan: SectionFinancePlan
  onCancel: () => void
  onSuccess: () => void
}

export function EditSectionFinancePlanForm({
  sectionFinancePlan,
  onCancel,
  onSuccess,
}: EditSectionFinancePlanFormProps) {
  const updateSectionFinancePlanMutation = useUpdateSectionFinancePlan(
    sectionFinancePlan.id,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<EditSectionFinancePlanFormValues>({
    defaultValues: getEditSectionFinancePlanFormValues(sectionFinancePlan),
    resolver: zodResolver(editSectionFinancePlanFormSchema),
  })

  const isSubmitting = updateSectionFinancePlanMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await updateSectionFinancePlanMutation.mutateAsync(
        mapEditSectionFinancePlanFormValuesToRequest(
          values,
          sectionFinancePlan.version,
        ),
      )
      onSuccess()
    } catch (error) {
      const apiError = error as ApiError
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isEditSectionFinancePlanFieldName(fieldName)
        ) {
          return
        }

        setError(fieldName, {
          message: issue.message,
          type: 'server',
        })
      })

      if (apiError.code === 'OPTIMISTIC_CONCURRENCY_CONFLICT') {
        setFormError(CONFLICT_MESSAGE)

        return
      }

      const hasOnlyFieldIssues =
        fieldIssues.length > 0 &&
        fieldIssues.length === getValidationIssueCount(apiError.details)

      if (!hasOnlyFieldIssues) {
        setFormError(apiError.message)
      }
    }
  })

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={onSubmit}
      spacing={3}
      sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h6">Редактирование блока раздела</Typography>
        <Typography color="text.secondary">
          Сохраняйте связь с существующим разделом и редактируйте актуальную версию записи.
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
        helperText={
          errors.externalSectionId?.message ??
          'ID раздела должен существовать во внешней системе и быть доступен в финансовом сервисе.'
        }
        label="ID раздела во внешней системе"
      />

      <TextField
        {...register('name')}
        disabled={isSubmitting}
        error={Boolean(errors.name)}
        fullWidth
        helperText={errors.name?.message ?? 'Это название будет видно пользователям в интерфейсе.'}
        label="Название блока раздела"
      />

      <TextField
        {...register('description')}
        disabled={isSubmitting}
        error={Boolean(errors.description)}
        fullWidth
        helperText={errors.description?.message ?? 'Необязательно. Можно добавить пояснение.'}
        label="Описание"
        minRows={4}
        multiline
      />

      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="text"
        >
          Отмена
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="contained">
          {isSubmitting ? 'Сохраняем...' : 'Сохранить изменения'}
        </Button>
      </Stack>
    </Stack>
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
      isEditSectionFinancePlanFieldName(fieldName)
    )
  })
}

function getValidationIssueCount(details: unknown): number {
  if (!isApiValidationErrorDetails(details)) {
    return 0
  }

  return details.issues.length
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

function isEditSectionFinancePlanFieldName(
  value: string,
): value is keyof EditSectionFinancePlanFormValues {
  return FIELD_NAMES.has(value as keyof EditSectionFinancePlanFormValues)
}
