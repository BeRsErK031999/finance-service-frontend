import { z } from 'zod'

import type { CreateProjectFinanceMemberRequest } from '../../../../entities/project-finance-member/model/types'
import { PROJECT_FINANCE_MEMBER_ACCESS_LEVELS } from '../../../../entities/project-finance-member/model/types'

export const createProjectFinanceMemberFormSchema = z.object({
  userId: z.string().trim().min(1, 'Member is required'),
  accessLevel: z.enum(PROJECT_FINANCE_MEMBER_ACCESS_LEVELS),
})

export type CreateProjectFinanceMemberFormValues = z.input<
  typeof createProjectFinanceMemberFormSchema
>

export const defaultCreateProjectFinanceMemberFormValues: CreateProjectFinanceMemberFormValues =
  {
    userId: '',
    accessLevel: 'VIEW',
  }

export function mapCreateProjectFinanceMemberFormValuesToRequest(
  values: CreateProjectFinanceMemberFormValues,
): CreateProjectFinanceMemberRequest {
  return {
    userId: values.userId.trim(),
    accessLevel: values.accessLevel,
  }
}
