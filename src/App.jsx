import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { router } from './router'
import { lightTheme, darkTheme } from './theme'
import { useAuthStore } from './stores/useAuthStore'
import { useThemeStore } from './stores/useThemeStore'
import { supabase } from './services/supabaseClient'

export default function App() {
  const { setSession, setProfile, setLoading } = useAuthStore()
  const { darkMode } = useThemeStore()

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) await fetchProfile(session.user.id)
      setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) await fetchProfile(session.user.id)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}