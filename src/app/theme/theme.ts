import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  spacing: 8,
  shape: {
    borderRadius: 14,
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#145da0',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h4: {
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.25,
    },
    h6: {
      fontWeight: 600,
      lineHeight: 1.3,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
        },
      },
    },
  },
})
