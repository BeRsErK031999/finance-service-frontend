import { z } from 'zod'

import {
  PLANNED_COST_CONDITION_SOURCES,
  type CreatePlannedCostRequest,
} from '../../../../entities/planned-cost/model/types'

const amountPattern = /^\d+(?:[.,]\d{1,2})?$/
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/

export const createPlannedCostFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    amount: z
      .string()
      .trim()
      .min(1, 'Amount is required')
      .regex(amountPattern, 'Enter a valid amount with up to 2 decimals'),
    conditionSource: z.enum(PLANNED_COST_CONDITION_SOURCES),
    plannedDate: z.string().trim(),
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

export type CreatePlannedCostFormValues = z.input<
  typeof createPlannedCostFormSchema
>

export const defaultCreatePlannedCostFormValues: CreatePlannedCostFormValues = {
  name: '',
  amount: '',
  conditionSource: 'DATE',
  plannedDate: '',
  projectEventIds: [],
  sectionEventIds: [],
}

export function mapCreatePlannedCostFormValuesToRequest(
  values: CreatePlannedCostFormValues,
  projectFinanceId: string,
  sectionFinancePlanId: string,
): CreatePlannedCostRequest {
  return {
    projectFinanceId,
    name: values.name.trim(),
    amount: values.amount.trim().replace(',', '.'),
    conditionSource: values.conditionSource,
    plannedDate:
      values.conditionSource === 'DATE'
        ? toIsoDateStartOfDay(values.plannedDate)
        : null,
    sectionFinancePlanIds: [sectionFinancePlanId],
    projectEventIds:
      values.conditionSource === 'EVENTS'
        ? normalizeIdentifiers(values.projectEventIds)
        : [],
    sectionEventIds:
      values.conditionSource === 'EVENTS'
        ? normalizeIdentifiers(values.sectionEventIds)
        : [],
  }
}

function normalizeIdentifiers(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function toIsoDateStartOfDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0)

  return localDate.toISOString()
}
