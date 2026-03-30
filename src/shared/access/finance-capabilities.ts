export const FINANCE_ACCESS_LEVELS = ['VIEW', 'EDIT'] as const

export type FinanceAccessLevel = (typeof FINANCE_ACCESS_LEVELS)[number]

export type FinanceAccessSource =
  | 'project-finance-access'
  | 'project-finance-global-access'
  | 'unscoped'

export interface FinanceAccess {
  projectFinanceId: string
  accessLevel: FinanceAccessLevel | null
  canView: boolean
  canEdit: boolean
}

export interface FinanceModuleAccess {
  canViewList: boolean
  canCreateProjectFinance: boolean
}

export interface FinanceCapabilitiesInput {
  moduleAccess?: FinanceModuleAccess | null
  projectFinanceAccess?: FinanceAccess | null
}

export interface FinanceCapabilities {
  source: FinanceAccessSource
  accessLevel: FinanceAccessLevel | null
  readOnlyReason: string | null
  canViewProjectFinanceList: boolean
  canViewProjectFinance: boolean
  canCreateProjectFinance: boolean
  canEditProjectFinance: boolean
  canArchiveProjectFinance: boolean
  canCreateSectionFinancePlan: boolean
  canEditSectionFinancePlan: boolean
  canArchiveSectionFinancePlan: boolean
  canCreatePlannedPayment: boolean
  canEditPlannedPayment: boolean
  canArchivePlannedPayment: boolean
  canChangePlannedPaymentStatus: boolean
  canCreateActualPayment: boolean
  canArchiveActualPayment: boolean
  canCreatePlannedCost: boolean
  canEditPlannedCost: boolean
  canArchivePlannedCost: boolean
  canChangePlannedCostStatus: boolean
  canCreateActualCost: boolean
  canArchiveActualCost: boolean
}

const VIEW_ONLY_FINANCE_MODULE_REASON =
  'You can view project finances, but creating a new project finance is not available for your current access.'
const NO_FINANCE_MODULE_ACCESS_REASON =
  'You do not have access to the finance module.'
const VIEW_ONLY_PROJECT_FINANCE_ACCESS_REASON =
  'You have view-only access to this finance plan.'
const NO_PROJECT_FINANCE_ACCESS_REASON =
  'You do not have access to this finance plan.'

export function getFinanceCapabilities(
  input: FinanceCapabilitiesInput = {},
): FinanceCapabilities {
  const moduleAccess = input.moduleAccess ?? null
  const projectFinanceAccess = input.projectFinanceAccess ?? null
  const canMutateProjectFinance = projectFinanceAccess?.canEdit === true
  const canViewProjectFinanceList = moduleAccess?.canViewList ?? false
  const canCreateProjectFinance = moduleAccess?.canCreateProjectFinance ?? false
  const canViewProjectFinance = projectFinanceAccess?.canView ?? true
  const readOnlyReason =
    projectFinanceAccess !== null
      ? projectFinanceAccess.canEdit
        ? null
        : projectFinanceAccess.canView
          ? VIEW_ONLY_PROJECT_FINANCE_ACCESS_REASON
          : NO_PROJECT_FINANCE_ACCESS_REASON
      : moduleAccess !== null
        ? moduleAccess.canCreateProjectFinance
          ? null
          : moduleAccess.canViewList
            ? VIEW_ONLY_FINANCE_MODULE_REASON
            : NO_FINANCE_MODULE_ACCESS_REASON
        : null

  return {
    source:
      projectFinanceAccess !== null
        ? 'project-finance-access'
        : moduleAccess !== null
          ? 'project-finance-global-access'
          : 'unscoped',
    accessLevel: projectFinanceAccess?.accessLevel ?? null,
    readOnlyReason,
    canViewProjectFinanceList,
    canViewProjectFinance,
    canCreateProjectFinance,
    canEditProjectFinance: canMutateProjectFinance,
    canArchiveProjectFinance: canMutateProjectFinance,
    canCreateSectionFinancePlan: canMutateProjectFinance,
    canEditSectionFinancePlan: canMutateProjectFinance,
    canArchiveSectionFinancePlan: canMutateProjectFinance,
    canCreatePlannedPayment: canMutateProjectFinance,
    canEditPlannedPayment: canMutateProjectFinance,
    canArchivePlannedPayment: canMutateProjectFinance,
    canChangePlannedPaymentStatus: canMutateProjectFinance,
    canCreateActualPayment: canMutateProjectFinance,
    canArchiveActualPayment: canMutateProjectFinance,
    canCreatePlannedCost: canMutateProjectFinance,
    canEditPlannedCost: canMutateProjectFinance,
    canArchivePlannedCost: canMutateProjectFinance,
    canChangePlannedCostStatus: canMutateProjectFinance,
    canCreateActualCost: canMutateProjectFinance,
    canArchiveActualCost: canMutateProjectFinance,
  }
}
