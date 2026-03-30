import { z } from 'zod'

import type {
  ProjectFinance,
  UpdateProjectFinanceRequest,
} from '../../../../entities/project-finance/model/types'

export const editProjectFinanceFormSchema = z.object({
  externalProjectId: z
    .string()
    .trim()
    .min(1, 'Укажите ID проекта во внешней системе'),
  name: z.string().trim().min(1, 'Укажите название финансового плана'),
  description: z.string().trim(),
})

export type EditProjectFinanceFormValues = z.input<
  typeof editProjectFinanceFormSchema
>

export function getEditProjectFinanceFormValues(
  projectFinance: ProjectFinance,
): EditProjectFinanceFormValues {
  return {
    externalProjectId: projectFinance.externalProjectId,
    name: projectFinance.name,
    description: projectFinance.description ?? '',
  }
}

export function mapEditProjectFinanceFormValuesToRequest(
  values: EditProjectFinanceFormValues,
  version: number,
): UpdateProjectFinanceRequest {
  const description = values.description.trim()

  return {
    externalProjectId: values.externalProjectId.trim(),
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
    version,
  }
}
