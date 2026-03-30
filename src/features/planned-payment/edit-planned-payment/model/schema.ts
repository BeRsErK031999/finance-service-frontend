import { z } from 'zod'

import {
  PLANNED_PAYMENT_CONDITION_SOURCES,
  type PlannedPayment,
  type UpdatePlannedPaymentRequest,
} from '../../../../entities/planned-payment/model/types'

const amountPattern = /^\d+(?:[.,]\d{1,2})?$/
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/

export const editPlannedPaymentFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    amount: z
      .string()
      .trim()
      .min(1, 'Amount is required')
      .regex(amountPattern, 'Enter a valid amount with up to 2 decimals'),
    conditionSource: z.enum(PLANNED_PAYMENT_CONDITION_SOURCES),
    plannedDate: z.string().trim(),
    sectionFinancePlanIds: z
      .array(z.string().uuid())
      .min(1, 'Select at least one linked section'),
    projectEventIds: z.array(z.string().trim().min(1)),
    sectionEventIds: z.array(z.string().trim().min(1)),
  })
  .superRefine((value, context) => {
    const totalEventCount =
      value.projectEventIds.length + value.sectionEventIds.length

    if (value.conditionSource === 'DATE') {
      if (value.plannedDate.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Planned date is required when condition source is DATE',
          path: ['plannedDate'],
        })

        return
      }

      if (!dateInputPattern.test(value.plannedDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid planned date',
          path: ['plannedDate'],
        })
      }

      if (totalEventCount > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Project and section events must be empty when condition source is DATE',
          path: ['projectEventIds'],
        })
      }

      return
    }

    if (value.plannedDate.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Planned date must be empty when condition source is EVENTS',
        path: ['plannedDate'],
      })
    }

    if (totalEventCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Add at least one project or section event when condition source is EVENTS',
        path: ['projectEventIds'],
      })
    }
  })

export type EditPlannedPaymentFormValues = z.input<
  typeof editPlannedPaymentFormSchema
>

export function getEditPlannedPaymentFormValues(
  plannedPayment: PlannedPayment,
): EditPlannedPaymentFormValues {
  return {
    name: plannedPayment.name,
    amount: plannedPayment.amount,
    conditionSource: plannedPayment.conditionSource,
    plannedDate:
      plannedPayment.conditionSource === 'DATE'
        ? toDateInputValue(plannedPayment.plannedDate)
        : '',
    sectionFinancePlanIds: [...plannedPayment.sectionFinancePlanIds],
    projectEventIds:
      plannedPayment.conditionSource === 'EVENTS'
        ? [...plannedPayment.projectEventIds]
        : [],
    sectionEventIds:
      plannedPayment.conditionSource === 'EVENTS'
        ? [...plannedPayment.sectionEventIds]
        : [],
  }
}

export function mapEditPlannedPaymentFormValuesToRequest(
  values: EditPlannedPaymentFormValues,
  version: number,
): UpdatePlannedPaymentRequest {
  return {
    name: values.name.trim(),
    amount: values.amount.trim().replace(',', '.'),
    conditionSource: values.conditionSource,
    plannedDate:
      values.conditionSource === 'DATE'
        ? toIsoDateStartOfDay(values.plannedDate)
        : null,
    sectionFinancePlanIds: normalizeIdentifiers(values.sectionFinancePlanIds),
    projectEventIds:
      values.conditionSource === 'EVENTS'
        ? normalizeIdentifiers(values.projectEventIds)
        : [],
    sectionEventIds:
      values.conditionSource === 'EVENTS'
        ? normalizeIdentifiers(values.sectionEventIds)
        : [],
    version,
  }
}

function normalizeIdentifiers(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function toDateInputValue(value: string | null) {
  if (value === null) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toIsoDateStartOfDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0)

  return localDate.toISOString()
}
