import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button, Stack, Typography } from '@mui/material'

import { PageContainer } from '../../shared/ui/PageContainer'
import { SectionCard } from '../../shared/ui/SectionCard'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(
    error: Error,
  ): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('AppErrorBoundary caught an error', error, errorInfo)
    }
  }

  private readonly reset = () => {
    this.setState({
      hasError: false,
      error: undefined,
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <PageContainer>
          <SectionCard title="Application error">
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {this.state.error?.message ??
                  'Unexpected render error. Check the console for details.'}
              </Typography>
              <Button onClick={this.reset} variant="contained">
                Try again
              </Button>
            </Stack>
          </SectionCard>
        </PageContainer>
      )
    }

    return this.props.children
  }
}
