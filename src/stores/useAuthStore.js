import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

let authListener = null; // 🔥 evitar múltiples listeners
let fetchingProfile = false; // 🔥 bandera para evitar múltiples fetches simultáneos

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ loading }),

  // 🔥 NUEVO: inicializar auth una sola vez
  initAuthListener: async () => {
    if (authListener) return;

    const { setSession, setProfile, setLoading, fetchProfile } = get();

    try {
      // 🔥 1. Obtener sesión inicial
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("INITIAL SESSION:", session);

      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Initial session error:", err);
    } finally {
      // 🔥 IMPORTANTE: quitar loading aquí SIEMPRE
      setLoading(false);
    }

    // 🔥 2. Luego escuchar cambios
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("EVENT:", event);

      try {
        setSession(session);

        if (session?.user) {
          const { profile } = get();

          if (
            !profile &&
            (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
          ) {
            await fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    });

    authListener = data.subscription;
  },

  // 🔥 fetch centralizado
  fetchProfile: async (userId) => {
    if (fetchingProfile) return;
    fetchingProfile = true;
    const { setProfile } = get();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        return;
      }

      setProfile(data || null);
    } catch (err) {
      console.error("Fetch profile failed:", err);
      setProfile(null);
    } finally {
      fetchingProfile = false;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, loading: false });
  },
}));
