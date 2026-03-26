import type { ReactNode } from 'react'

import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { Alert, AlertTitle } from '@mui/material'

interface ErrorStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function ErrorState({
  title,
  description,
  action,
}: ErrorStateProps) {
  return (
    <Alert
      action={action}
      icon={<ReportProblemOutlinedIcon fontSize="inherit" />}
      severity="error"
      variant="outlined"
    >
      <AlertTitle>{title}</AlertTitle>
      {description}
    </Alert>
  )
}
