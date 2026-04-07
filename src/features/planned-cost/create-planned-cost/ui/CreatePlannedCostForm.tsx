import { useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
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

import {
  plannedCostKeys,
  useCreatePlannedCost,
} from '../../../../entities/planned-cost/api/planned-cost.query'
import {
  PLANNED_COST_CONDITION_SOURCES,
  type PlannedCostConditionSource,
} from '../../../../entities/planned-cost/model/types'
import { uploadFileAttachment } from '../../../../shared/api/file-attachments.api'
import { parseApiError } from '../../../../shared/api/parse-api-error'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import { PendingFileAttachmentsField } from '../../../../shared/ui/PendingFileAttachmentsField'
import {
  createPlannedCostFormSchema,
  defaultCreatePlannedCostFormValues,
  mapCreatePlannedCostFormValuesToRequest,
  type CreatePlannedCostFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreatePlannedCostFormValues>([
  'amount',
  'conditionSource',
  'name',
  'plannedDate',
  'projectEventIds',
  'sectionEventIds',
])

const EMPTY_AUTOCOMPLETE_OPTIONS: string[] = []

interface SubmissionFeedback {
  message: string
  severity: 'success' | 'warning'
}

interface CreatePlannedCostFormProps {
  projectFinanceId: string
  sectionFinancePlanId: string
  sectionFinancePlanName: string
  onSuccess?: () => void
}

export function CreatePlannedCostForm({
  projectFinanceId,
  sectionFinancePlanId,
  sectionFinancePlanName,
  onSuccess,
}: CreatePlannedCostFormProps) {
  const queryClient = useQueryClient()
  const createPlannedCostMutation = useCreatePlannedCost()
  const [formError, setFormError] = useState<string | null>(null)
  const [submissionFeedback, setSubmissionFeedback] =
    useState<SubmissionFeedback | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<CreatePlannedCostFormValues>({
    defaultValues: defaultCreatePlannedCostFormValues,
    resolver: zodResolver(createPlannedCostFormSchema),
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

  const isSubmitting = createPlannedCostMutation.isPending || isUploadingFiles

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSubmissionFeedback(null)
    clearErrors()
    let hasUploadWarning = false

    try {
      const createdPlannedCost = await createPlannedCostMutation.mutateAsync(
        mapCreatePlannedCostFormValuesToRequest(
          values,
          projectFinanceId,
          sectionFinancePlanId,
        ),
      )

      const filesToUpload = pendingFiles

      if (filesToUpload.length > 0) {
        setIsUploadingFiles(true)

        const uploadResults = await Promise.allSettled(
          filesToUpload.map((file) =>
            uploadFileAttachment({
              file,
              plannedCostId: createdPlannedCost.id,
            }),
          ),
        )
        const failedFileNames = uploadResults.flatMap((result, index) =>
          result.status === 'rejected' ? [filesToUpload[index]?.name ?? 'Без имени'] : [],
        )

        await queryClient.invalidateQueries({
          queryKey: plannedCostKeys.list(createdPlannedCost.projectFinanceId),
        })

        setSubmissionFeedback(
          failedFileNames.length === 0
            ? {
                message:
                  'Плановый расход создан, выбранные файлы загружены автоматически.',
                severity: 'success',
              }
            : {
                message: `Плановый расход создан, но часть файлов не загрузилась: ${failedFileNames.join(', ')}. Их можно добавить повторно из карточки записи.`,
                severity: 'warning',
              },
        )
        hasUploadWarning = failedFileNames.length > 0
      }

      reset(defaultCreatePlannedCostFormValues)
      setPendingFiles([])

      if (!hasUploadWarning) {
        onSuccess?.()
      }
    } catch (error) {
      const apiError = toApiError(error)
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (
          typeof fieldName !== 'string' ||
          !isCreatePlannedCostFieldName(fieldName)
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
    } finally {
      setIsUploadingFiles(false)
    }
  })

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }} variant="outlined">
      <Stack component="form" noValidate onSubmit={onSubmit} spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Новый плановый расход</Typography>
          <Typography color="text.secondary">
            Этот расход будет связан с разделом "{sectionFinancePlanName}". Для
            режима по событиям указывайте внешние ID событий, которые уже загружены в финансовый сервис.
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        {submissionFeedback ? (
          <Alert severity={submissionFeedback.severity} variant="outlined">
            {submissionFeedback.message}
          </Alert>
        ) : null}

        <TextField
          {...register('name')}
          disabled={isSubmitting}
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message ?? 'Например: закупка материалов'}
          label="Название расхода"
        />

        <TextField
          {...register('amount')}
          disabled={isSubmitting}
          error={Boolean(errors.amount)}
          fullWidth
          helperText={errors.amount?.message ?? 'Введите сумму в формате 150000.00'}
          label="Сумма"
        />

        <TextField
          {...register('conditionSource')}
          disabled={isSubmitting}
          error={Boolean(errors.conditionSource)}
          fullWidth
          helperText={errors.conditionSource?.message}
          label="Когда ожидать расход"
          select
        >
          {PLANNED_COST_CONDITION_SOURCES.map((source) => (
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
            helperText={errors.plannedDate?.message ?? 'Дата, к которой ожидается расход'}
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

        <PendingFileAttachmentsField
          disabled={isSubmitting}
          files={pendingFiles}
          onChange={setPendingFiles}
        />

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Создаём...' : 'Создать плановый расход'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function getConditionSourceLabel(source: PlannedCostConditionSource) {
  if (source === 'DATE') {
    return 'По дате'
  }

  return 'По событиям'
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

    return typeof fieldName === 'string' && isCreatePlannedCostFieldName(fieldName)
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

function isCreatePlannedCostFieldName(
  value: string,
): value is keyof CreatePlannedCostFormValues {
  return FIELD_NAMES.has(value as keyof CreatePlannedCostFormValues)
}
