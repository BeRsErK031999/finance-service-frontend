import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Stack, Typography } from '@mui/material'

interface ActionAvailabilityHintProps {
  message: string
}

export function ActionAvailabilityHint({
  message,
}: ActionAvailabilityHintProps) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 1,
        maxWidth: 320,
        px: 1,
        py: 0.75,
      }}
    >
      <InfoOutlinedIcon color="action" fontSize="inherit" sx={{ mt: 0.25 }} />
      <Typography color="text.secondary" variant="caption">
        {message}
      </Typography>
    </Stack>
  )
}
