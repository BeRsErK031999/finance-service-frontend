import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import { Button } from '@mui/material'

interface ArchiveActionButtonProps {
  isArchived: boolean
  isArchiving: boolean
  onClick: () => void
}

export function ArchiveActionButton({
  isArchived,
  isArchiving,
  onClick,
}: ArchiveActionButtonProps) {
  return (
    <Button
      color="warning"
      disabled={isArchived || isArchiving}
      onClick={onClick}
      startIcon={<ArchiveOutlinedIcon />}
      variant="outlined"
    >
      {isArchiving ? 'Архивируем...' : isArchived ? 'В архиве' : 'Архивировать'}
    </Button>
  )
}
