import { useMemo, useState } from 'react'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import type { MockAuthRedirectState } from '../../shared/auth/RequireMockAuth'
import { useMockAuth } from '../../shared/auth/mock-auth'
import { PageContainer } from '../../shared/ui/PageContainer'
import { PageTitle } from '../../shared/ui/PageTitle'
import { SectionCard } from '../../shared/ui/SectionCard'

const DEFAULT_AUTHENTICATED_ROUTE = '/project-finances'

export function LoginPage() {
  const { availableUsers, currentUser, login } = useMockAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedUserId, setSelectedUserId] = useState(availableUsers[0]?.id ?? '')
  const redirectTo = useMemo(() => {
    const state = location.state as MockAuthRedirectState | null

    return state?.from || DEFAULT_AUTHENTICATED_ROUTE
  }, [location.state])

  if (currentUser !== null) {
    return <Navigate replace to={redirectTo} />
  }

  const selectedUser = availableUsers.find((user) => user.id === selectedUserId) ?? null

  const handleLogin = () => {
    if (selectedUser === null) {
      return
    }

    login(selectedUser.id)
    navigate(redirectTo, { replace: true })
  }

  return (
    <PageContainer>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 760 }}>
        <Stack spacing={3}>
          <PageTitle
            subtitle="Temporary mock login until the real auth-service integration is implemented."
            title="Demo sign-in"
          />

          <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info">
            This page does not perform real authentication. It stores a demo identity in
            local storage and forwards it to the backend through the existing
            `x-user-id` bridge.
          </Alert>

          <SectionCard
            subtitle="Choose which demo finance access you want to use for this browser session."
            title="Select mock identity"
          >
            <Stack spacing={2}>
              {availableUsers.map((user) => {
                const isSelected = user.id === selectedUserId

                return (
                  <Card
                    key={user.id}
                    sx={{
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    }}
                    variant="outlined"
                  >
                    <CardActionArea onClick={() => setSelectedUserId(user.id)}>
                      <Stack
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ px: 2, py: 2 }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1">{user.label}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            {user.description}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            Backend user ID: {user.id}
                          </Typography>
                        </Stack>
                        <Chip
                          color={isSelected ? 'primary' : 'default'}
                          label={isSelected ? 'Selected' : 'Click to select'}
                          size="small"
                          variant={isSelected ? 'filled' : 'outlined'}
                        />
                      </Stack>
                    </CardActionArea>
                  </Card>
                )
              })}

              <Button
                disabled={selectedUser === null}
                fullWidth
                onClick={handleLogin}
                size="large"
                variant="contained"
              >
                {selectedUser ? `Continue as ${selectedUser.label}` : 'Choose a demo user'}
              </Button>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </PageContainer>
  )
}
