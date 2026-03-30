import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'

import { useChangePlannedPaymentStatus } from '../../../../entities/planned-payment/api/planned-payment.query'
import type {
  PlannedPayment,
  PlannedPaymentStatusChangeTarget,
} from '../../../../entities/planned-payment/model/types'
import { PLANNED_PAYMENT_STATUS_CHANGE_TARGETS } from '../../../../entities/planned-payment/model/types'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  changePlannedPaymentStatusFormSchema,
  getChangePlannedPaymentStatusFormValues,
  mapChangePlannedPaymentStatusFormValuesToRequest,
  type ChangePlannedPaymentStatusFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof ChangePlannedPaymentStatusFormValues>(['status'])

const CONFLICT_MESSAGE =
  'This planned payment changed after you opened the status action. Refresh the data and try again.'

interface ChangePlannedPaymentStatusFormProps {
  onCancel: () => void
  onSuccess: () => void
  plannedPayment: PlannedPayment
}

export function ChangePlannedPaymentStatusForm({
  onCancel,
  onSuccess,
  plannedPayment,
}: ChangePlannedPaymentStatusFormProps) {
  const changePlannedPaymentStatusMutation = useChangePlannedPaymentStatus(
    plannedPayment.id,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<ChangePlannedPaymentStatusFormValues>({
    defaultValues: getChangePlannedPaymentStatusFormValues(),
    resolver: zodResolver(changePlannedPaymentStatusFormSchema),
  })
  const isSubmitting = changePlannedPaymentStatusMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await changePlannedPaymentStatusMutation.mutateAsync(
        mapChangePlannedPaymentStatusFormValuesToRequest(
          values,
          plannedPayment.version,
        ),
      )
      onSuccess()
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isChangePlannedPaymentStatusFieldName(fieldName)
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

      setFormError(apiError.message)
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
        <Typography variant="h6">Change planned payment status</Typography>
        <Typography color="text.secondary">
          Leave RECEIVED, archive the linked actual payment, and make the planned
          payment editable again.
        </Typography>
      </Stack>

      <Alert severity="warning" variant="outlined">
        The linked actual payment will be archived. Backend DATE and EVENTS rules
        still decide which non-received status is actually allowed.
      </Alert>

      {formError ? (
        <Alert severity="error" variant="outlined">
          {formError}
        </Alert>
      ) : null}

      <TextField
        {...register('status')}
        disabled={isSubmitting}
        error={Boolean(errors.status)}
        fullWidth
        helperText={
          errors.status?.message ??
          'Choose the target status. The backend rejects invalid transitions.'
        }
        label="New status"
        select
      >
        <MenuItem value="">Select status</MenuItem>
        {PLANNED_PAYMENT_STATUS_CHANGE_TARGETS.map((status) => (
          <MenuItem key={status} value={status}>
            {getStatusLabel(status)}
          </MenuItem>
        ))}
      </TextField>

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
          {isSubmitting ? 'Applying...' : 'Apply status change'}
        </Button>
      </Stack>
    </Stack>
  )
}

function getStatusLabel(status: PlannedPaymentStatusChangeTarget) {
  if (status === 'PLANNED') {
    return 'Planned'
  }

  return 'Expected'
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
      isChangePlannedPaymentStatusFieldName(fieldName)
    )
  })
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

function isChangePlannedPaymentStatusFieldName(
  value: string,
): value is keyof ChangePlannedPaymentStatusFormValues {
  return FIELD_NAMES.has(value as keyof ChangePlannedPaymentStatusFormValues)
}
