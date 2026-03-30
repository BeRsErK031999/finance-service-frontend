import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import {
  AppBar,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom'

import { useMockAuth } from '../../shared/auth/mock-auth'
import { appConfig } from '../../shared/config/env'

export function AppShell() {
  const { availableUsers, currentUser, logout, switchUser } = useMockAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (currentUser === null) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ width: '100%' }}
          >
            <Stack alignItems="center" direction="row" spacing={1.5}>
              <Box
                sx={{
                  alignItems: 'center',
                  backgroundColor: 'primary.main',
                  borderRadius: 2.5,
                  color: 'primary.contrastText',
                  display: 'flex',
                  height: 42,
                  justifyContent: 'center',
                  width: 42,
                }}
              >
                <AccountBalanceWalletOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography
                  color="text.primary"
                  component={RouterLink}
                  sx={{ display: 'inline-flex', fontWeight: 700 }}
                  to="/project-finances"
                  variant="h6"
                >
                  Финансовый сервис
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  MVP интерфейс финансовых планов
                </Typography>
              </Box>
            </Stack>

            <Stack
              alignItems={{ xs: 'stretch', md: 'center' }}
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
            >
              <Button component={RouterLink} to="/project-finances" variant="outlined">
                Финансовые планы
              </Button>

              <Stack alignItems="flex-end" spacing={0.25} sx={{ display: { xs: 'none', lg: 'flex' } }}>
                <Typography color="text.secondary" variant="caption">
                  Демо-сессия
                </Typography>
                <Typography color="text.primary" variant="body2">
                  {currentUser.label}
                </Typography>
              </Stack>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  onChange={(event) => {
                    switchUser(event.target.value)
                  }}
                  value={currentUser.id}
                >
                  {availableUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button onClick={handleLogout} variant="text">
                Выйти
              </Button>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="main">
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          mt: 6,
          py: 2,
        }}
      >
        <Container>
          <Typography color="text.secondary" variant="body2">
            Адрес API: {appConfig.apiBaseUrl}
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
