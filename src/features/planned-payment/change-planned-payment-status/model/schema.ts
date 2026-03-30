import { z } from 'zod'

import type {
  ChangePlannedPaymentStatusRequest,
  PlannedPaymentStatusChangeTarget,
} from '../../../../entities/planned-payment/model/types'
import { PLANNED_PAYMENT_STATUS_CHANGE_TARGETS } from '../../../../entities/planned-payment/model/types'

const targetStatuses = new Set<PlannedPaymentStatusChangeTarget>(
  PLANNED_PAYMENT_STATUS_CHANGE_TARGETS,
)

export const changePlannedPaymentStatusFormSchema = z.object({
  status: z
    .string()
    .trim()
    .refine(
      (value): value is PlannedPaymentStatusChangeTarget =>
        targetStatuses.has(value as PlannedPaymentStatusChangeTarget),
      {
        message: 'Select a target status',
      },
    ),
})

export type ChangePlannedPaymentStatusFormValues = z.input<
  typeof changePlannedPaymentStatusFormSchema
>

export function getChangePlannedPaymentStatusFormValues(): ChangePlannedPaymentStatusFormValues {
  return {
    status: '',
  }
}

export function mapChangePlannedPaymentStatusFormValuesToRequest(
  values: ChangePlannedPaymentStatusFormValues,
  version: number,
): ChangePlannedPaymentStatusRequest {
  return {
    status: values.status as PlannedPaymentStatusChangeTarget,
    version,
  }
}
