import { z } from 'zod'

import type {
  SectionFinancePlan,
  UpdateSectionFinancePlanRequest,
} from '../../../../entities/section-finance-plan/model/types'

export const editSectionFinancePlanFormSchema = z.object({
  externalSectionId: z
    .string()
    .trim()
    .min(1, 'Укажите ID раздела во внешней системе'),
  name: z.string().trim().min(1, 'Укажите название финансового блока раздела'),
  description: z.string().trim(),
})

export type EditSectionFinancePlanFormValues = z.input<
  typeof editSectionFinancePlanFormSchema
>

export function getEditSectionFinancePlanFormValues(
  sectionFinancePlan: SectionFinancePlan,
): EditSectionFinancePlanFormValues {
  return {
    externalSectionId: sectionFinancePlan.externalSectionId,
    name: sectionFinancePlan.name,
    description: sectionFinancePlan.description ?? '',
  }
}

export function mapEditSectionFinancePlanFormValuesToRequest(
  values: EditSectionFinancePlanFormValues,
  version: number,
): UpdateSectionFinancePlanRequest {
  const description = values.description.trim()

  return {
    externalSectionId: values.externalSectionId.trim(),
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
    version,
  }
}
