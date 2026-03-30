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
  'Плановое поступление уже изменилось после открытия формы смены статуса. Обновите данные и повторите попытку.'

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
        <Typography variant="h6">Смена статуса планового поступления</Typography>
        <Typography color="text.secondary">
          Выведите запись из статуса "Получено", архивируйте связанное фактическое
          поступление и снова откройте запись для редактирования.
        </Typography>
      </Stack>

      <Alert severity="warning" variant="outlined">
        Связанное фактическое поступление будет отправлено в архив. Верните запись
        в тот статус, в котором она должна быть без факта: "Запланировано", если
        условие ещё не выполнено, или "Ожидается", если поступление уже должно
        было наступить по правилу записи.
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
          'Если правило записи уже выполнено, выберите "Ожидается". Если ещё нет, выберите "Запланировано".'
        }
        label="Новый статус"
        select
      >
        <MenuItem value="">Выберите статус</MenuItem>
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
          Отмена
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="contained">
          {isSubmitting ? 'Применяем...' : 'Изменить статус'}
        </Button>
      </Stack>
    </Stack>
  )
}

function getStatusLabel(status: PlannedPaymentStatusChangeTarget) {
  if (status === 'PLANNED') {
    return 'Запланировано'
  }

  return 'Ожидается'
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
