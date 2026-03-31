import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { useCreateProjectFinanceMutation } from '../../../../entities/project-finance/api/project-finance.query'
import type {
  ProjectFinance,
} from '../../../../entities/project-finance/model/types'
import type {
  ApiError,
  ApiValidationErrorDetails,
  ApiValidationIssue,
} from '../../../../shared/types/api'
import { SectionCard } from '../../../../shared/ui/SectionCard'
import {
  createProjectFinanceFormSchema,
  defaultCreateProjectFinanceFormValues,
  mapCreateProjectFinanceFormValuesToRequest,
  type CreateProjectFinanceFormValues,
} from '../model/schema'

const FIELD_NAMES = new Set<keyof CreateProjectFinanceFormValues>([
  'description',
  'externalProjectId',
  'name',
])

const EXTERNAL_PROJECT_ID_HELPER_TEXT =
  'Укажите ID проекта из внешнего сервиса проектов. Финансовый план можно создать только для проекта, который уже существует в системе.'
const FINANCE_NAME_HELPER_TEXT =
  'Это название будет видно пользователям внутри финансового сервиса.'
const DESCRIPTION_HELPER_TEXT = 'Необязательно. Кратко опишите назначение плана.'
const DEMO_EXTERNAL_PROJECT_ID = '11111111-1111-1111-1111-111111111111'

export function CreateProjectFinanceForm() {
  const navigate = useNavigate()
  const createProjectFinanceMutation = useCreateProjectFinanceMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<CreateProjectFinanceFormValues>({
    defaultValues: defaultCreateProjectFinanceFormValues,
    resolver: zodResolver(createProjectFinanceFormSchema),
  })

  const isSubmitting = createProjectFinanceMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    clearErrors()

    try {
      const createdProjectFinance = await createProjectFinanceMutation.mutateAsync(
        mapCreateProjectFinanceFormValuesToRequest(values),
      )

      navigateToCreatedProjectFinance(navigate, createdProjectFinance)
    } catch (error) {
      const apiError = error as ApiError
      const fieldIssues = getFieldValidationIssues(apiError)

      fieldIssues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName !== 'string' || !isCreateProjectFinanceFieldName(fieldName)) {
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
    <SectionCard
      subtitle="Заполните базовые данные для нового финансового плана проекта."
      title="Основная информация"
    >
      <Stack component="form" noValidate onSubmit={onSubmit} spacing={3}>
        {import.meta.env.DEV ? (
          <Alert severity="info" variant="outlined">
            Для локального MVP можно использовать внешний ID проекта{' '}
            <strong>{DEMO_EXTERNAL_PROJECT_ID}</strong>.
          </Alert>
        ) : null}

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
          helperText={errors.externalProjectId?.message ?? EXTERNAL_PROJECT_ID_HELPER_TEXT}
          label="ID проекта во внешней системе"
        />

        <TextField
          {...register('name')}
          disabled={isSubmitting}
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message ?? FINANCE_NAME_HELPER_TEXT}
          label="Название финансового плана"
        />

        <TextField
          {...register('description')}
          disabled={isSubmitting}
          error={Boolean(errors.description)}
          fullWidth
          helperText={errors.description?.message ?? DESCRIPTION_HELPER_TEXT}
          label="Описание"
          minRows={4}
          multiline
        />

        <Stack alignItems="flex-start" direction="row" justifyContent="flex-end">
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Создаём...' : 'Создать финансовый план'}
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  )
}

function navigateToCreatedProjectFinance(
  navigate: ReturnType<typeof useNavigate>,
  projectFinance: ProjectFinance,
) {
  navigate(`/project-finances/${projectFinance.id}`)
}

function getFieldValidationIssues(error: ApiError): ApiValidationIssue[] {
  if (!isApiValidationErrorDetails(error.details)) {
    return []
  }

  return error.details.issues.filter((issue) => {
    const fieldName = issue.path[0]

    return typeof fieldName === 'string' && isCreateProjectFinanceFieldName(fieldName)
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

function isCreateProjectFinanceFieldName(
  value: string,
): value is keyof CreateProjectFinanceFormValues {
  return FIELD_NAMES.has(value as keyof CreateProjectFinanceFormValues)
}
