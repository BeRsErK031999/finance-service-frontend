import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useUpdatePlannedPayment } from '../../../../entities/planned-payment/api/planned-payment.query'
import {
  PLANNED_PAYMENT_CONDITION_SOURCES,
  type PlannedPayment,
  type PlannedPaymentConditionSource,
} from '../../../../entities/planned-payment/model/types'
import type { SectionFinancePlan } from '../../../../entities/section-finance-plan/model/types'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import { FileAttachmentsSection } from '../../../../shared/ui/FileAttachmentsSection'
import {
  editPlannedPaymentFormSchema,
  getEditPlannedPaymentFormValues,
  mapEditPlannedPaymentFormValuesToRequest,
  type EditPlannedPaymentFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof EditPlannedPaymentFormValues>([
  'amount',
  'conditionSource',
  'name',
  'plannedDate',
  'projectEventIds',
  'sectionEventIds',
  'sectionFinancePlanIds',
])

const CONFLICT_MESSAGE =
  'Плановое поступление уже изменилось после открытия формы. Обновите данные и повторите попытку.'

const EMPTY_EVENT_OPTIONS: string[] = []

interface SectionOption {
  helperText: string
  id: string
  label: string
}

interface EditPlannedPaymentFormProps {
  availableSectionFinancePlans: SectionFinancePlan[]
  onCancel: () => void
  onSuccess: () => void
  plannedPayment: PlannedPayment
}

export function EditPlannedPaymentForm({
  availableSectionFinancePlans,
  onCancel,
  onSuccess,
  plannedPayment,
}: EditPlannedPaymentFormProps) {
  const updatePlannedPaymentMutation = useUpdatePlannedPayment(plannedPayment.id)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<EditPlannedPaymentFormValues>({
    defaultValues: getEditPlannedPaymentFormValues(plannedPayment),
    resolver: zodResolver(editPlannedPaymentFormSchema),
  })
  const conditionSource = useWatch({
    control,
    name: 'conditionSource',
  })
  const sectionOptions = availableSectionFinancePlans.map(toSectionOption)
  const sectionOptionById = new Map(
    sectionOptions.map((option) => [option.id, option] as const),
  )

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

  const isSubmitting = updatePlannedPaymentMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      await updatePlannedPaymentMutation.mutateAsync(
        mapEditPlannedPaymentFormValuesToRequest(values, plannedPayment.version),
      )
      onSuccess()
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isEditPlannedPaymentFieldName(fieldName)
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
        <Typography variant="h6">Редактирование планового поступления</Typography>
        <Typography color="text.secondary">
          Обновите связанные разделы и выберите только один режим условия: по дате или по событиям.
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
        helperText={errors.name?.message ?? 'Например: окончательный платёж'}
        label="Название поступления"
      />

      <TextField
        {...register('amount')}
        disabled={isSubmitting}
        error={Boolean(errors.amount)}
        fullWidth
        helperText={errors.amount?.message ?? 'Введите сумму в формате 150000.00'}
        label="Сумма"
      />

      <Controller
        control={control}
        name="sectionFinancePlanIds"
        render={({ field, fieldState }) => (
          <Autocomplete
            disableCloseOnSelect
            disabled={isSubmitting}
            filterSelectedOptions
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            multiple
            onChange={(_, values) => field.onChange(values.map((value) => value.id))}
            options={sectionOptions}
            value={field.value.map((id) => sectionOptionById.get(id) ?? createUnknownSectionOption(id))}
            renderInput={(params) => (
              <TextField
                {...params}
                error={Boolean(fieldState.error)}
                helperText={
                  fieldState.error?.message ??
                  'Выберите один или несколько блоков разделов, связанных с этим поступлением'
                }
                label="Связанные блоки разделов"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Stack spacing={0.25}>
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {option.helperText}
                  </Typography>
                </Stack>
              </li>
            )}
          />
        )}
      />

      <TextField
        {...register('conditionSource')}
        disabled={isSubmitting}
        error={Boolean(errors.conditionSource)}
        fullWidth
        helperText={errors.conditionSource?.message}
        label="Когда ожидать поступление"
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
          helperText={errors.plannedDate?.message ?? 'Дата, к которой ожидается поступление'}
          label="Плановая дата"
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
            Условие сработает только тогда, когда произойдут все выбранные
            проектные события и события раздела.
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
                  field.onChange(normalizeEventIdentifiers(values))
                }
                options={EMPTY_EVENT_OPTIONS}
                selectOnFocus
                value={field.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ??
                      'Введите внешний ID проектного события и нажмите Enter'
                    }
                    label="ID проектных событий"
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
                  field.onChange(normalizeEventIdentifiers(values))
                }
                options={EMPTY_EVENT_OPTIONS}
                selectOnFocus
                value={field.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ??
                      'Введите внешний ID события раздела и нажмите Enter'
                    }
                    label="ID событий раздела"
                  />
                )}
              />
            )}
          />
        </Stack>
      ) : null}

      <FileAttachmentsSection
        canManageFiles
        defaultExpanded
        manageFilesHint=""
        owner={{
          id: plannedPayment.id,
          projectFinanceId: plannedPayment.projectFinanceId,
          type: 'planned-payment',
        }}
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

function getConditionSourceLabel(source: PlannedPaymentConditionSource) {
  if (source === 'DATE') {
    return 'По дате'
  }

  return 'По событиям'
}

function toSectionOption(sectionFinancePlan: SectionFinancePlan): SectionOption {
  return {
    helperText: `Внешний ID раздела: ${sectionFinancePlan.externalSectionId}`,
    id: sectionFinancePlan.id,
    label: sectionFinancePlan.name,
  }
}

function createUnknownSectionOption(id: string): SectionOption {
  return {
    helperText: 'Этот блок раздела сейчас отсутствует в текущем списке',
    id,
    label: id,
  }
}

function normalizeEventIdentifiers(values: string[]) {
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

    return typeof fieldName === 'string' && isEditPlannedPaymentFieldName(fieldName)
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

function isEditPlannedPaymentFieldName(
  value: string,
): value is keyof EditPlannedPaymentFormValues {
  return FIELD_NAMES.has(value as keyof EditPlannedPaymentFormValues)
}
