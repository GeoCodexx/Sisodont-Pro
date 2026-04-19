import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      darkMode: false,
      toggle: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: 'sisodont-theme' }
  )
)