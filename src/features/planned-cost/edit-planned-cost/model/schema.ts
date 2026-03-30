import { z } from 'zod'

import {
  PLANNED_COST_CONDITION_SOURCES,
  type PlannedCost,
  type UpdatePlannedCostRequest,
} from '../../../../entities/planned-cost/model/types'

const amountPattern = /^\d+(?:[.,]\d{1,2})?$/
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/

export const editPlannedCostFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Укажите название расхода'),
    amount: z
      .string()
      .trim()
      .min(1, 'Укажите сумму')
      .regex(amountPattern, 'Введите сумму в формате 12345.67'),
    conditionSource: z.enum(PLANNED_COST_CONDITION_SOURCES),
    plannedDate: z.string().trim(),
    sectionFinancePlanIds: z
      .array(z.string().uuid())
      .min(1, 'Выберите хотя бы один связанный блок раздела'),
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
          message: 'Укажите плановую дату для режима "По дате"',
          path: ['plannedDate'],
        })

        return
      }

      if (!dateInputPattern.test(value.plannedDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите корректную плановую дату',
          path: ['plannedDate'],
        })
      }

      if (totalEventCount > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для режима "По дате" списки событий должны быть пустыми',
          path: ['projectEventIds'],
        })
      }

      return
    }

    if (value.plannedDate.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Для режима "По событиям" поле даты должно быть пустым',
        path: ['plannedDate'],
      })
    }

    if (totalEventCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Добавьте хотя бы одно проектное событие или событие раздела',
        path: ['projectEventIds'],
      })
    }
  })

export type EditPlannedCostFormValues = z.input<typeof editPlannedCostFormSchema>

export function getEditPlannedCostFormValues(
  plannedCost: PlannedCost,
): EditPlannedCostFormValues {
  return {
    name: plannedCost.name,
    amount: plannedCost.amount,
    conditionSource: plannedCost.conditionSource,
    plannedDate:
      plannedCost.conditionSource === 'DATE'
        ? toDateInputValue(plannedCost.plannedDate)
        : '',
    sectionFinancePlanIds: [...plannedCost.sectionFinancePlanIds],
    projectEventIds:
      plannedCost.conditionSource === 'EVENTS'
        ? [...plannedCost.projectEventIds]
        : [],
    sectionEventIds:
      plannedCost.conditionSource === 'EVENTS'
        ? [...plannedCost.sectionEventIds]
        : [],
  }
}

export function mapEditPlannedCostFormValuesToRequest(
  values: EditPlannedCostFormValues,
  version: number,
): UpdatePlannedCostRequest {
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
