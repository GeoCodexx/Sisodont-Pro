import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useUsersStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) set({ error: error.message })
    else set({ users: data })
    set({ loading: false })
  },

  updateRole: async (userId, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) return { error: error.message }
    await get().fetchUsers()
    return { error: null }
  },

  toggleActive: async (userId, active) => {
    const { error } = await supabase
      .from('profiles')
      .update({ active: !active })
      .eq('id', userId)

    if (error) return { error: error.message }
    await get().fetchUsers()
    return { error: null }
  },

  // Crear usuario invitado (Supabase Admin API via Edge Function en producción)
  // Por ahora usamos signUp directamente
  inviteUser: async ({ email, full_name, role, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    })
    if (error) return { error: error.message }
    await get().fetchUsers()
    return { error: null, user: data.user }
  },
}))