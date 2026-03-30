import { Alert, AlertTitle } from '@mui/material'

interface AccessNoticeProps {
  message: string
}

export function AccessNotice({ message }: AccessNoticeProps) {
  return (
    <Alert severity="info" variant="outlined">
      <AlertTitle>Read-only access</AlertTitle>
      {message}
    </Alert>
  )
}
