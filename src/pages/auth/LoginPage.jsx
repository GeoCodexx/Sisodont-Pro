import { Box, Typography } from '@mui/material'

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="h5" color="text.secondary">
        Login — se construye en Fase 1
      </Typography>
    </Box>
  )
}