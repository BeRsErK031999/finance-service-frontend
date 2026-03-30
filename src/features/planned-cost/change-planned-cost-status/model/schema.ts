import { z } from 'zod'

import type {
  ChangePlannedCostStatusRequest,
  PlannedCostStatusChangeTarget,
} from '../../../../entities/planned-cost/model/types'
import { PLANNED_COST_STATUS_CHANGE_TARGETS } from '../../../../entities/planned-cost/model/types'

const targetStatuses = new Set<PlannedCostStatusChangeTarget>(
  PLANNED_COST_STATUS_CHANGE_TARGETS,
)

export const changePlannedCostStatusFormSchema = z.object({
  status: z
    .string()
    .trim()
    .refine(
      (value): value is PlannedCostStatusChangeTarget =>
        targetStatuses.has(value as PlannedCostStatusChangeTarget),
      {
        message: 'Выберите новый статус',
      },
    ),
})

export type ChangePlannedCostStatusFormValues = z.input<
  typeof changePlannedCostStatusFormSchema
>

export function getChangePlannedCostStatusFormValues(): ChangePlannedCostStatusFormValues {
  return {
    status: '',
  }
}

export function mapChangePlannedCostStatusFormValuesToRequest(
  values: ChangePlannedCostStatusFormValues,
  version: number,
): ChangePlannedCostStatusRequest {
  return {
    status: values.status as PlannedCostStatusChangeTarget,
    version,
  }
}
