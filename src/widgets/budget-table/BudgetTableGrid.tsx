import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { PlannedCost } from '../../entities/planned-cost/model/types'
import type { PlannedPayment } from '../../entities/planned-payment/model/types'
import type { FinanceCapabilities } from '../../shared/access/finance-capabilities'
import type { BudgetRow } from '../../shared/lib/budget-table'
import { formatAmount } from '../../shared/lib/format'
import { FinanceStatusChip } from '../../shared/ui/FinanceStatusChip'
import { BudgetActionButton } from './BudgetActionButton'
import { BudgetActualCell } from './BudgetActualCell'
import {
  getArchiveActualDisabledReason,
  getArchivePlannedDisabledReason,
  getBudgetRowKey,
  getBudgetTypeLabel,
  getCreateActualDisabledReason,
  getEditDisabledReason,
  getEventCount,
  getPlannedDateLabel,
  getPrimaryStatusChipVariant,
  getRollbackDisabledReason,
  toFinanceStatusValue,
  type BudgetSectionFinancePlansQueryState,
} from './budget-table.helpers'

interface BudgetTableGridProps {
  filteredRows: BudgetRow[]
  financeCapabilities: FinanceCapabilities
  onArchiveActual: (row: BudgetRow) => Promise<void>
  onArchivePlanned: (row: BudgetRow) => Promise<void>
  onCreateActual: (row: BudgetRow) => void
  onEdit: (row: BudgetRow) => void
  onRollback: (row: BudgetRow) => void
  pendingActionKey: string | null
  plannedCostById: Map<string, PlannedCost>
  plannedPaymentById: Map<string, PlannedPayment>
  sectionFinancePlansQueryState: BudgetSectionFinancePlansQueryState
}

export function BudgetTableGrid({
  filteredRows,
  financeCapabilities,
  onArchiveActual,
  onArchivePlanned,
  onCreateActual,
  onEdit,
  onRollback,
  pendingActionKey,
  plannedCostById,
  plannedPaymentById,
  sectionFinancePlansQueryState,
}: BudgetTableGridProps) {
  return (
    <TableContainer>
      <Table sx={{ minWidth: 1080 }} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Тип</TableCell>
            <TableCell>Название</TableCell>
            <TableCell align="right">Сумма</TableCell>
            <TableCell>Дата</TableCell>
            <TableCell>Факт</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell sx={{ minWidth: 280 }}>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRows.map((row) => {
            const plannedRecord =
              row.type === 'payment'
                ? plannedPaymentById.get(row.id) ?? null
                : plannedCostById.get(row.id) ?? null
            const editDisabledReason = getEditDisabledReason({
              financeCapabilities,
              row,
              sectionFinancePlansQueryState,
            })
            const createActualDisabledReason = getCreateActualDisabledReason({
              financeCapabilities,
              row,
            })
            const archivePlannedDisabledReason = getArchivePlannedDisabledReason({
              financeCapabilities,
              row,
            })
            const rollbackDisabledReason = getRollbackDisabledReason({
              financeCapabilities,
              row,
            })
            const archiveActualDisabledReason = getArchiveActualDisabledReason({
              financeCapabilities,
              row,
            })
            const primaryActionLabel = row.hasActual ? 'Rollback' : 'Добавить факт'
            const primaryActionDisabledReason = row.hasActual
              ? rollbackDisabledReason
              : createActualDisabledReason
            const primaryActionIcon = row.hasActual ? (
              <SyncAltRoundedIcon />
            ) : (
              <AddRoundedIcon />
            )
            const archiveDisabledReason = row.hasActual
              ? archiveActualDisabledReason
              : archivePlannedDisabledReason
            const isArchivePending = row.hasActual
              ? pendingActionKey === `actual-archive:${row.type}:${row.id}`
              : pendingActionKey === `planned-archive:${row.type}:${row.id}`

            return (
              <TableRow
                hover
                key={getBudgetRowKey(row)}
                sx={
                  row.hasActual
                    ? {
                        '& > .MuiTableCell-root': {
                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                        },
                        '&:hover > .MuiTableCell-root': {
                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.09),
                        },
                        '& > .MuiTableCell-root:first-of-type': {
                          borderLeft: (theme) =>
                            `4px solid ${alpha(theme.palette.success.main, 0.28)}`,
                        },
                      }
                    : undefined
                }
              >
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Chip
                    color={row.type === 'payment' ? 'success' : 'warning'}
                    label={getBudgetTypeLabel(row.type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Stack spacing={0.75}>
                    <Typography fontWeight={600} variant="body2">
                      {row.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }} useFlexGap>
                      <Typography color="text.secondary" variant="caption">
                        Связанных разделов: {row.sectionIds.length}
                      </Typography>
                      {row.hasActual ? (
                        <Chip
                          color="warning"
                          icon={<LockOutlinedIcon />}
                          label="Редактирование заблокировано"
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                  {formatAmount(row.amount)}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">{getPlannedDateLabel(plannedRecord)}</Typography>
                    {plannedRecord?.conditionSource === 'EVENTS' ? (
                      <Typography color="text.secondary" variant="caption">
                        Событий: {getEventCount(plannedRecord)}
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <BudgetActualCell row={row} />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }} useFlexGap>
                    <FinanceStatusChip
                      value={toFinanceStatusValue(row.status)}
                      variant={getPrimaryStatusChipVariant(row.status)}
                    />
                    {row.state !== 'ACTIVE' ? <FinanceStatusChip value={row.state} /> : null}
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <BudgetActionButton
                      disabledReason={primaryActionDisabledReason}
                      onClick={() => (row.hasActual ? onRollback(row) : onCreateActual(row))}
                      startIcon={primaryActionIcon}
                      variant="contained"
                    >
                      {primaryActionLabel}
                    </BudgetActionButton>

                    <BudgetActionButton
                      disabledReason={editDisabledReason}
                      onClick={() => onEdit(row)}
                      startIcon={<EditOutlinedIcon />}
                    >
                      Редактировать
                    </BudgetActionButton>

                    <BudgetActionButton
                      disabledReason={archiveDisabledReason}
                      isPending={isArchivePending}
                      onClick={() =>
                        row.hasActual
                          ? void onArchiveActual(row)
                          : void onArchivePlanned(row)
                      }
                      startIcon={<ArchiveOutlinedIcon />}
                    >
                      В архив
                    </BudgetActionButton>
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
