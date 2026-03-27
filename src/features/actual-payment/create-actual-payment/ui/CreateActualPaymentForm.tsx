import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'

import { useCreateActualPayment } from '../../../../entities/actual-payment/api/actual-payment.query'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  createActualPaymentFormSchema,
  defaultCreateActualPaymentFormValues,
  mapCreateActualPaymentFormValuesToRequest,
  type CreateActualPaymentFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreateActualPaymentFormValues>([
  'actualDate',
  'amount',
  'comment',
])

interface CreateActualPaymentFormProps {
  plannedPaymentId: string
  plannedPaymentName: string
  projectFinanceId: string
  onSuccess?: () => void
}

export function CreateActualPaymentForm({
  plannedPaymentId,
  plannedPaymentName,
  projectFinanceId,
  onSuccess,
}: CreateActualPaymentFormProps) {
  const createActualPaymentMutation = useCreateActualPayment()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateActualPaymentFormValues>({
    defaultValues: defaultCreateActualPaymentFormValues,
    resolver: zodResolver(createActualPaymentFormSchema),
  })

  const isSubmitting = createActualPaymentMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await createActualPaymentMutation.mutateAsync(
        mapCreateActualPaymentFormValuesToRequest(
          values,
          projectFinanceId,
          plannedPaymentId,
        ),
      )

      reset(defaultCreateActualPaymentFormValues)
      onSuccess?.()
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isCreateActualPaymentFieldName(fieldName)
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
          <Typography variant="h6">New actual payment</Typography>
          <Typography color="text.secondary">
            Register the factual incoming movement for planned payment "
            {plannedPaymentName}".
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        <TextField
          {...register('amount')}
          disabled={isSubmitting}
          error={Boolean(errors.amount)}
          fullWidth
          helperText={errors.amount?.message ?? 'Use the backend decimal format'}
          label="Amount"
        />

        <TextField
          {...register('actualDate')}
          disabled={isSubmitting}
          error={Boolean(errors.actualDate)}
          fullWidth
          helperText={errors.actualDate?.message}
          label="Actual date"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          type="date"
        />

        <TextField
          {...register('comment')}
          disabled={isSubmitting}
          error={Boolean(errors.comment)}
          fullWidth
          helperText={errors.comment?.message ?? 'Optional comment'}
          label="Comment"
          minRows={3}
          multiline
        />

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Creating...' : 'Create actual payment'}
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

    return typeof fieldName === 'string' && isCreateActualPaymentFieldName(fieldName)
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

function isCreateActualPaymentFieldName(
  value: string,
): value is keyof CreateActualPaymentFormValues {
  return FIELD_NAMES.has(value as keyof CreateActualPaymentFormValues)
}
