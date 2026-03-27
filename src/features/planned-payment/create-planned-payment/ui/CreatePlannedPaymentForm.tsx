import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useCreatePlannedPayment } from '../../../../entities/planned-payment/api/planned-payment.query'
import {
  PLANNED_PAYMENT_CONDITION_SOURCES,
  type PlannedPaymentConditionSource,
} from '../../../../entities/planned-payment/model/types'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import {
  createPlannedPaymentFormSchema,
  defaultCreatePlannedPaymentFormValues,
  mapCreatePlannedPaymentFormValuesToRequest,
  type CreatePlannedPaymentFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreatePlannedPaymentFormValues>([
  'amount',
  'conditionSource',
  'name',
  'plannedDate',
  'projectEventIds',
  'sectionEventIds',
])

const EMPTY_AUTOCOMPLETE_OPTIONS: string[] = []

interface CreatePlannedPaymentFormProps {
  projectFinanceId: string
  sectionFinancePlanId: string
  sectionFinancePlanName: string
}

export function CreatePlannedPaymentForm({
  projectFinanceId,
  sectionFinancePlanId,
  sectionFinancePlanName,
}: CreatePlannedPaymentFormProps) {
  const createPlannedPaymentMutation = useCreatePlannedPayment()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<CreatePlannedPaymentFormValues>({
    defaultValues: defaultCreatePlannedPaymentFormValues,
    resolver: zodResolver(createPlannedPaymentFormSchema),
  })
  const conditionSource = useWatch({
    control,
    name: 'conditionSource',
  })

  useEffect(() => {
    if (conditionSource === 'DATE') {
      setValue('projectEventIds', [])
      setValue('sectionEventIds', [])
      clearErrors(['projectEventIds', 'sectionEventIds'])

      return
    }

    if (conditionSource === 'EVENTS') {
      setValue('plannedDate', '')
      clearErrors('plannedDate')
    }
  }, [clearErrors, conditionSource, setValue])

  const isSubmitting = createPlannedPaymentMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await createPlannedPaymentMutation.mutateAsync(
        mapCreatePlannedPaymentFormValuesToRequest(
          values,
          projectFinanceId,
          sectionFinancePlanId,
        ),
      )

      reset(defaultCreatePlannedPaymentFormValues)
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isCreatePlannedPaymentFieldName(fieldName)
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
          <Typography variant="h6">New planned payment</Typography>
          <Typography color="text.secondary">
            This payment will be linked to section "{sectionFinancePlanName}".
            For event-based conditions, enter the exact external event IDs that
            the backend expects.
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        <TextField
          {...register('name')}
          disabled={isSubmitting}
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message}
          label="Payment name"
        />

        <TextField
          {...register('amount')}
          disabled={isSubmitting}
          error={Boolean(errors.amount)}
          fullWidth
          helperText={errors.amount?.message ?? 'Use the backend decimal format'}
          label="Amount"
        />

        <TextField
          {...register('conditionSource')}
          disabled={isSubmitting}
          error={Boolean(errors.conditionSource)}
          fullWidth
          helperText={errors.conditionSource?.message}
          label="Condition source"
          select
        >
          {PLANNED_PAYMENT_CONDITION_SOURCES.map((source) => (
            <MenuItem key={source} value={source}>
              {getConditionSourceLabel(source)}
            </MenuItem>
          ))}
        </TextField>

        {conditionSource === 'DATE' ? (
          <TextField
            {...register('plannedDate')}
            disabled={isSubmitting}
            error={Boolean(errors.plannedDate)}
            fullWidth
            helperText={errors.plannedDate?.message}
            label="Planned date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            type="date"
          />
        ) : null}

        {conditionSource === 'EVENTS' ? (
          <Stack spacing={2.5}>
            <Alert severity="info" variant="outlined">
              Backend treats this condition as met only when all selected
              project and section events have occurred.
            </Alert>

            <Controller
              control={control}
              name="projectEventIds"
              render={({ field, fieldState }) => (
                <Autocomplete
                  clearOnBlur
                  disabled={isSubmitting}
                  filterSelectedOptions
                  freeSolo
                  handleHomeEndKeys
                  multiple
                  onChange={(_, values) =>
                    field.onChange(normalizeAutocompleteValues(values))
                  }
                  options={EMPTY_AUTOCOMPLETE_OPTIONS}
                  selectOnFocus
                  value={field.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ??
                        'Type an external project event ID and press Enter'
                      }
                      label="Project event IDs"
                    />
                  )}
                />
              )}
            />

            <Controller
              control={control}
              name="sectionEventIds"
              render={({ field, fieldState }) => (
                <Autocomplete
                  clearOnBlur
                  disabled={isSubmitting}
                  filterSelectedOptions
                  freeSolo
                  handleHomeEndKeys
                  multiple
                  onChange={(_, values) =>
                    field.onChange(normalizeAutocompleteValues(values))
                  }
                  options={EMPTY_AUTOCOMPLETE_OPTIONS}
                  selectOnFocus
                  value={field.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ??
                        'Type an external section event ID and press Enter'
                      }
                      label="Section event IDs"
                    />
                  )}
                />
              )}
            />
          </Stack>
        ) : null}

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Creating...' : 'Create planned payment'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function getConditionSourceLabel(source: PlannedPaymentConditionSource) {
  if (source === 'DATE') {
    return 'Date'
  }

  return 'Events'
}

function normalizeAutocompleteValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
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

    return typeof fieldName === 'string' && isCreatePlannedPaymentFieldName(fieldName)
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

function isCreatePlannedPaymentFieldName(
  value: string,
): value is keyof CreatePlannedPaymentFormValues {
  return FIELD_NAMES.has(value as keyof CreatePlannedPaymentFormValues)
}
