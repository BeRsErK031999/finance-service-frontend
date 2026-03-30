import { CircularProgress, Stack, Typography } from '@mui/material'

interface LoadingStateProps {
  title?: string
  description?: string
}

export function LoadingState({
  title = 'Загрузка',
  description = 'Подождите, данные подготавливаются.',
}: LoadingStateProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ minHeight: 240 }}
      textAlign="center"
    >
      <CircularProgress />
      <Stack spacing={0.5}>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
    </Stack>
  )
}
