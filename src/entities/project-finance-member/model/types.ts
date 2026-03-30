import {
  PROJECT_FINANCE_ACCESS_LEVELS,
  type ProjectFinanceAccessLevel,
} from '../../project-finance/model/types'

export const PROJECT_FINANCE_MEMBER_ACCESS_LEVELS =
  PROJECT_FINANCE_ACCESS_LEVELS

export type ProjectFinanceMemberAccessLevel = ProjectFinanceAccessLevel

export interface ProjectFinanceMember {
  id: string
  projectFinanceId: string
  userId: string
  displayName: string
  accessLevel: ProjectFinanceMemberAccessLevel
  createdAt: string
  updatedAt: string
}

export interface ProjectFinanceMemberListResponse {
  items: ProjectFinanceMember[]
}

export interface ProjectFinanceAvailableMember {
  userId: string
  displayName: string
}

export interface ProjectFinanceAvailableMemberListResponse {
  items: ProjectFinanceAvailableMember[]
}

export interface CreateProjectFinanceMemberRequest {
  userId: string
  accessLevel: ProjectFinanceMemberAccessLevel
}

export interface UpdateProjectFinanceMemberAccessRequest {
  accessLevel: ProjectFinanceMemberAccessLevel
}
