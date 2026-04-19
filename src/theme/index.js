import { createTheme } from '@mui/material/styles'

const baseTokens = {
  primary: '#534AB7',
  secondary: '#1D9E75',
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: baseTokens.primary },
    secondary: { main: baseTokens.secondary },
    background: {
      default: '#F8F7FC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: baseTokens.fontFamily,
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none', border: '0.5px solid rgba(0,0,0,0.08)' },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7F77DD' },
    secondary: { main: baseTokens.secondary },
    background: {
      default: '#111014',
      paper: '#1C1B22',
    },
  },
  typography: {
    fontFamily: baseTokens.fontFamily,
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none', border: '0.5px solid rgba(255,255,255,0.08)' },
      },
    },
  },
})