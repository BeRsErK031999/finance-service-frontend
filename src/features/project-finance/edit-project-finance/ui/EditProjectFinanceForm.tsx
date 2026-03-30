import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { useUpdateProjectFinanceMutation } from '../../../../entities/project-finance/api/project-finance.query'
import type { ProjectFinance } from '../../../../entities/project-finance/model/types'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  editProjectFinanceFormSchema,
  getEditProjectFinanceFormValues,
  mapEditProjectFinanceFormValuesToRequest,
  type EditProjectFinanceFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof EditProjectFinanceFormValues>([
  'description',
  'externalProjectId',
  'name',
])

const CONFLICT_MESSAGE =
  'This project finance was changed after you opened the form. Refresh the data and try again.'

interface EditProjectFinanceFormProps {
  projectFinance: ProjectFinance
  onCancel: () => void
  onSuccess: () => void
}

export function EditProjectFinanceForm({
  projectFinance,
  onCancel,
  onSuccess,
}: EditProjectFinanceFormProps) {
  const updateProjectFinanceMutation = useUpdateProjectFinanceMutation(
    projectFinance.id,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<EditProjectFinanceFormValues>({
    defaultValues: getEditProjectFinanceFormValues(projectFinance),
    resolver: zodResolver(editProjectFinanceFormSchema),
  })

  const isSubmitting = updateProjectFinanceMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await updateProjectFinanceMutation.mutateAsync(
        mapEditProjectFinanceFormValuesToRequest(values, projectFinance.version),
      )
      onSuccess()
    } catch (error) {
      const apiError = error as ApiError
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName !== 'string' || !isEditProjectFinanceFieldName(fieldName)) {
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
        <Typography variant="h6">Edit project finance</Typography>
        <Typography color="text.secondary">
          Update the editable backend fields and send the current version for
          optimistic concurrency.
        </Typography>
      </Stack>

      {formError ? (
        <Alert severity="error" variant="outlined">
          {formError}
        </Alert>
      ) : null}

      <TextField
        {...register('externalProjectId')}
        disabled={isSubmitting}
        error={Boolean(errors.externalProjectId)}
        fullWidth
        helperText={errors.externalProjectId?.message}
        label="External project ID"
      />

      <TextField
        {...register('name')}
        disabled={isSubmitting}
        error={Boolean(errors.name)}
        fullWidth
        helperText={errors.name?.message}
        label="Finance name"
      />

      <TextField
        {...register('description')}
        disabled={isSubmitting}
        error={Boolean(errors.description)}
        fullWidth
        helperText={errors.description?.message ?? 'Optional'}
        label="Description"
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
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="contained">
          {isSubmitting ? 'Saving...' : 'Save changes'}
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

    return typeof fieldName === 'string' && isEditProjectFinanceFieldName(fieldName)
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

function isEditProjectFinanceFieldName(
  value: string,
): value is keyof EditProjectFinanceFormValues {
  return FIELD_NAMES.has(value as keyof EditProjectFinanceFormValues)
}
