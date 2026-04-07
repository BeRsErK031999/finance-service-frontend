import { useState } from 'react'

import {
  Alert,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material'

import type { SectionFinancePlan } from '../../entities/section-finance-plan/model/types'
import { CreateActualCostForm } from '../../features/actual-cost/create-actual-cost/ui/CreateActualCostForm'
import { CreateActualPaymentForm } from '../../features/actual-payment/create-actual-payment/ui/CreateActualPaymentForm'
import { ChangePlannedCostStatusForm } from '../../features/planned-cost/change-planned-cost-status/ui/ChangePlannedCostStatusForm'
import { CreatePlannedCostForm } from '../../features/planned-cost/create-planned-cost/ui/CreatePlannedCostForm'
import { EditPlannedCostForm } from '../../features/planned-cost/edit-planned-cost/ui/EditPlannedCostForm'
import { ChangePlannedPaymentStatusForm } from '../../features/planned-payment/change-planned-payment-status/ui/ChangePlannedPaymentStatusForm'
import { CreatePlannedPaymentForm } from '../../features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm'
import { EditPlannedPaymentForm } from '../../features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm'
import { getSectionFinancePlanLabel } from './budget-table.helpers'
import type { BudgetDialogState } from './budget-table.types'

interface BudgetActionDialogProps {
  availableSectionFinancePlans: SectionFinancePlan[]
  createSectionFinancePlans: SectionFinancePlan[]
  onClose: () => void
  open: boolean
  projectFinanceId: string
  state: BudgetDialogState
}

export function BudgetActionDialog({
  availableSectionFinancePlans,
  createSectionFinancePlans,
  onClose,
  open,
  projectFinanceId,
  state,
}: BudgetActionDialogProps) {
  if (!open || state === null) {
    return null
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogContent sx={{ p: 0 }}>
        {state.mode === 'create-planned-payment' ? (
          <CreatePlannedBudgetEntryContent
            availableSectionFinancePlans={createSectionFinancePlans}
            mode="payment"
            onSuccess={onClose}
            projectFinanceId={projectFinanceId}
          />
        ) : null}

        {state.mode === 'create-planned-cost' ? (
          <CreatePlannedBudgetEntryContent
            availableSectionFinancePlans={createSectionFinancePlans}
            mode="cost"
            onSuccess={onClose}
            projectFinanceId={projectFinanceId}
          />
        ) : null}

        {state.mode === 'edit-planned-payment' ? (
          <EditPlannedPaymentForm
            availableSectionFinancePlans={availableSectionFinancePlans}
            onCancel={onClose}
            onSuccess={onClose}
            plannedPayment={state.plannedPayment}
          />
        ) : null}

        {state.mode === 'edit-planned-cost' ? (
          <EditPlannedCostForm
            availableSectionFinancePlans={availableSectionFinancePlans}
            onCancel={onClose}
            onSuccess={onClose}
            plannedCost={state.plannedCost}
          />
        ) : null}

        {state.mode === 'create-actual-payment' ? (
          <CreateActualPaymentForm
            onSuccess={onClose}
            plannedPaymentId={state.plannedPayment.id}
            plannedPaymentName={state.plannedPayment.name}
            projectFinanceId={state.plannedPayment.projectFinanceId}
          />
        ) : null}

        {state.mode === 'create-actual-cost' ? (
          <CreateActualCostForm
            onSuccess={onClose}
            plannedCostId={state.plannedCost.id}
            plannedCostName={state.plannedCost.name}
            projectFinanceId={state.plannedCost.projectFinanceId}
          />
        ) : null}

        {state.mode === 'rollback-payment' ? (
          <ChangePlannedPaymentStatusForm
            onCancel={onClose}
            onSuccess={onClose}
            plannedPayment={state.plannedPayment}
          />
        ) : null}

        {state.mode === 'rollback-cost' ? (
          <ChangePlannedCostStatusForm
            onCancel={onClose}
            onSuccess={onClose}
            plannedCost={state.plannedCost}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CreatePlannedBudgetEntryContent({
  availableSectionFinancePlans,
  mode,
  onSuccess,
  projectFinanceId,
}: {
  availableSectionFinancePlans: SectionFinancePlan[]
  mode: 'payment' | 'cost'
  onSuccess: () => void
  projectFinanceId: string
}) {
  const [selectedSectionFinancePlanId, setSelectedSectionFinancePlanId] = useState<
    string | null
  >(null)
  const selectedSectionFinancePlan =
    availableSectionFinancePlans.find(
      (sectionFinancePlan) => sectionFinancePlan.id === selectedSectionFinancePlanId,
    ) ??
    availableSectionFinancePlans[0] ??
    null
  const selectLabelId = `budget-table-create-${mode}-section-label`

  return (
    <Stack spacing={2.5} sx={{ p: { xs: 2.5, md: 3 } }}>
      <Alert severity="info" variant="outlined">
        Сначала выберите active раздел, к которому будет привязана новая planned-запись.
      </Alert>

      {availableSectionFinancePlans.length === 0 ? (
        <Alert severity="warning" variant="outlined">
          Нет active разделов, к которым можно привязать новую planned-запись.
        </Alert>
      ) : (
        <>
          <FormControl fullWidth>
            <InputLabel id={selectLabelId}>Раздел</InputLabel>
            <Select
              label="Раздел"
              labelId={selectLabelId}
              onChange={(event) => setSelectedSectionFinancePlanId(event.target.value)}
              value={selectedSectionFinancePlan?.id ?? ''}
            >
              {availableSectionFinancePlans.map((sectionFinancePlan) => (
                <MenuItem key={sectionFinancePlan.id} value={sectionFinancePlan.id}>
                  {getSectionFinancePlanLabel(sectionFinancePlan)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSectionFinancePlan ? (
            mode === 'payment' ? (
              <CreatePlannedPaymentForm
                onSuccess={onSuccess}
                projectFinanceId={projectFinanceId}
                sectionFinancePlanId={selectedSectionFinancePlan.id}
                sectionFinancePlanName={selectedSectionFinancePlan.name}
              />
            ) : (
              <CreatePlannedCostForm
                onSuccess={onSuccess}
                projectFinanceId={projectFinanceId}
                sectionFinancePlanId={selectedSectionFinancePlan.id}
                sectionFinancePlanName={selectedSectionFinancePlan.name}
              />
            )
          ) : null}
        </>
      )}
    </Stack>
  )
}
