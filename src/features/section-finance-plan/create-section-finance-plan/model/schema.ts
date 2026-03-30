import { z } from 'zod'

import type { CreateSectionFinancePlanRequest } from '../../../../entities/section-finance-plan/model/types'

export const createSectionFinancePlanFormSchema = z.object({
  externalSectionId: z
    .string()
    .trim()
    .min(1, 'Укажите ID раздела во внешней системе'),
  name: z.string().trim().min(1, 'Укажите название финансового блока раздела'),
  description: z.string().trim(),
})

export type CreateSectionFinancePlanFormValues = z.input<
  typeof createSectionFinancePlanFormSchema
>

export const defaultCreateSectionFinancePlanFormValues: CreateSectionFinancePlanFormValues =
  {
    externalSectionId: '',
    name: '',
    description: '',
  }

export function mapCreateSectionFinancePlanFormValuesToRequest(
  values: CreateSectionFinancePlanFormValues,
  projectFinanceId: string,
): CreateSectionFinancePlanRequest {
  const description = values.description.trim()

  return {
    projectFinanceId,
    externalSectionId: values.externalSectionId.trim(),
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
  }
}
