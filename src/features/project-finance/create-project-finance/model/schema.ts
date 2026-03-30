import { z } from 'zod'

import type { CreateProjectFinanceRequest } from '../../../../entities/project-finance/model/types'

export const createProjectFinanceFormSchema = z.object({
  externalProjectId: z
    .string()
    .trim()
    .min(1, 'Укажите ID проекта во внешней системе'),
  name: z.string().trim().min(1, 'Укажите название финансового плана'),
  description: z.string().trim(),
})

export type CreateProjectFinanceFormValues = z.input<
  typeof createProjectFinanceFormSchema
>

export const defaultCreateProjectFinanceFormValues: CreateProjectFinanceFormValues =
  {
    externalProjectId: '',
    name: '',
    description: '',
  }

export function mapCreateProjectFinanceFormValuesToRequest(
  values: CreateProjectFinanceFormValues,
): CreateProjectFinanceRequest {
  const description = values.description.trim()

  return {
    externalProjectId: values.externalProjectId.trim(),
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
  }
}
