import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, loading: false });
  },
}));
