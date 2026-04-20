import { useAuthStore } from '../stores/useAuthStore'

export function useRole() {
  const { profile } = useAuthStore()
  const role = profile?.role ?? null

  return {
    role,
    isAdmin:     role === 'ADMIN',
    isDoctor:    role === 'DOCTOR',
    isAssistant: role === 'ASSISTANT',
    isPatient:   role === 'PATIENT',
    isStaff:     ['ADMIN', 'DOCTOR', 'ASSISTANT'].includes(role),
    can: (allowed = []) => allowed.includes(role),
  }
}