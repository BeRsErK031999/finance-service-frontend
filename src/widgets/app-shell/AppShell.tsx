import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'

import { appConfig } from '../../shared/config/env'

export function AppShell() {
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
                  Finance Service
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Expandable frontend shell
                </Typography>
              </Box>
            </Stack>

            <Button component={RouterLink} to="/project-finances" variant="outlined">
              Project finances
            </Button>
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
            API base URL: {appConfig.apiBaseUrl}
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
