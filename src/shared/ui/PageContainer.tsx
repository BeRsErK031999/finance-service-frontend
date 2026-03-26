import type { PropsWithChildren } from 'react'

import { Container, Stack } from '@mui/material'

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <Container sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>{children}</Stack>
    </Container>
  )
}
