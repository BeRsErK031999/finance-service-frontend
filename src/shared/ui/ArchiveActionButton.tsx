import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import { Button } from '@mui/material'

interface ArchiveActionButtonProps {
  isArchived: boolean
  isArchiving: boolean
  onClick: () => void
  disabled?: boolean
}

export function ArchiveActionButton({
  isArchived,
  isArchiving,
  onClick,
  disabled = false,
}: ArchiveActionButtonProps) {
  return (
    <Button
      color="warning"
      disabled={disabled || isArchived || isArchiving}
      onClick={onClick}
      startIcon={<ArchiveOutlinedIcon />}
      variant="outlined"
    >
      {isArchiving ? 'Архивируем...' : isArchived ? 'В архиве' : 'Архивировать'}
    </Button>
  )
}
