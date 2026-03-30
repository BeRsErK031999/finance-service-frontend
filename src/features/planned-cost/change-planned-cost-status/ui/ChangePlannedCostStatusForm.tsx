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

import { useChangePlannedCostStatus } from '../../../../entities/planned-cost/api/planned-cost.query'
import type {
  PlannedCost,
  PlannedCostStatusChangeTarget,
} from '../../../../entities/planned-cost/model/types'
import { PLANNED_COST_STATUS_CHANGE_TARGETS } from '../../../../entities/planned-cost/model/types'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  changePlannedCostStatusFormSchema,
  getChangePlannedCostStatusFormValues,
  mapChangePlannedCostStatusFormValuesToRequest,
  type ChangePlannedCostStatusFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof ChangePlannedCostStatusFormValues>(['status'])

const CONFLICT_MESSAGE =
  'Плановый расход уже изменился после открытия формы смены статуса. Обновите данные и повторите попытку.'

interface ChangePlannedCostStatusFormProps {
  onCancel: () => void
  onSuccess: () => void
  plannedCost: PlannedCost
}

export function ChangePlannedCostStatusForm({
  onCancel,
  onSuccess,
  plannedCost,
}: ChangePlannedCostStatusFormProps) {
  const changePlannedCostStatusMutation = useChangePlannedCostStatus(
    plannedCost.id,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<ChangePlannedCostStatusFormValues>({
    defaultValues: getChangePlannedCostStatusFormValues(),
    resolver: zodResolver(changePlannedCostStatusFormSchema),
  })
  const isSubmitting = changePlannedCostStatusMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await changePlannedCostStatusMutation.mutateAsync(
        mapChangePlannedCostStatusFormValuesToRequest(values, plannedCost.version),
      )
      onSuccess()
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isChangePlannedCostStatusFieldName(fieldName)
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
        <Typography variant="h6">Смена статуса планового расхода</Typography>
        <Typography color="text.secondary">
          Выведите запись из статуса "Получено", архивируйте связанный фактический
          расход и снова откройте запись для редактирования.
        </Typography>
      </Stack>

      <Alert severity="warning" variant="outlined">
        Связанный фактический расход будет отправлен в архив. Верните запись в тот
        статус, в котором она должна быть без факта: "Запланировано", если
        условие ещё не выполнено, или "Ожидается", если расход уже должен был
        наступить по правилу записи.
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
        {PLANNED_COST_STATUS_CHANGE_TARGETS.map((status) => (
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

function getStatusLabel(status: PlannedCostStatusChangeTarget) {
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
      isChangePlannedCostStatusFieldName(fieldName)
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

function isChangePlannedCostStatusFieldName(
  value: string,
): value is keyof ChangePlannedCostStatusFormValues {
  return FIELD_NAMES.has(value as keyof ChangePlannedCostStatusFormValues)
}
