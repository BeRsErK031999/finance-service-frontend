import { z } from 'zod'

import type { CreateActualPaymentRequest } from '../../../../entities/actual-payment/model/types'

const amountPattern = /^\d+(?:[.,]\d{1,2})?$/
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/

export const createActualPaymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(amountPattern, 'Enter a valid amount with up to 2 decimals'),
  actualDate: z
    .string()
    .trim()
    .min(1, 'Actual date is required')
    .regex(dateInputPattern, 'Enter a valid actual date'),
  comment: z.string(),
})

export type CreateActualPaymentFormValues = z.input<
  typeof createActualPaymentFormSchema
>

export const defaultCreateActualPaymentFormValues: CreateActualPaymentFormValues =
  {
    amount: '',
    actualDate: '',
    comment: '',
  }

export function mapCreateActualPaymentFormValuesToRequest(
  values: CreateActualPaymentFormValues,
  projectFinanceId: string,
  plannedPaymentId: string,
): CreateActualPaymentRequest {
  return {
    plannedPaymentId,
    projectFinanceId,
    amount: values.amount.trim().replace(',', '.'),
    actualDate: toIsoDateStartOfDay(values.actualDate),
    comment: normalizeNullableString(values.comment),
  }
}

function normalizeNullableString(value: string) {
  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

function toIsoDateStartOfDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0)

  return localDate.toISOString()
}
