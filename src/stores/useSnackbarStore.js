import { create } from 'zustand';

const useSnackbarStore = create((set) => ({
  open: false,
  message: '',
  severity: 'success', // 'success' | 'error' | 'info' | 'warning'
  
  // Función única para disparar cualquier notificación
  showSnackbar: (message, severity = 'success') => set({
    open: true,
    message,
    severity
  }),

  // Función para cerrar el snackbar
  closeSnackbar: () => set({ open: false }),
}));

export default useSnackbarStore;