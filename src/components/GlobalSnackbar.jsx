import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import useSnackbarStore from '../stores/useSnackbarStore';


const GlobalSnackbar = () => {
  const { open, message, severity, closeSnackbar } = useSnackbarStore();

  const handleClose = (event, reason) => {
    // Evita que se cierre si el usuario hace clic fuera de la alerta
    if (reason === 'clickaway') return;
    closeSnackbar();
  };

  return (
    <Snackbar
      open={open}
      // Regla clave: null si es error (no se cierra), 4000ms si es éxito u otro tipo
      autoHideDuration={severity === 'error' ? null : 4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        variant="filled" 
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
