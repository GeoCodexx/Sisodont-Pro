import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────
// Módulo-level guards para evitar duplicados
// ─────────────────────────────────────────────
let authListener = null;
let fetchingProfile = false;

// ─────────────────────────────────────────────
// Helper: deriva campos calculados del profile
// ─────────────────────────────────────────────
function deriveFromProfile(profile) {
  if (!profile) {
    return {
      role: null,
      tenantId: null,
      isSuperAdmin: false,
      isAuthenticated: false,
    };
  }
  return {
    role: profile.role,
    tenantId: profile.tenant_id,
    isSuperAdmin: profile.role === "SUPER_ADMIN",
    isAuthenticated: true,
  };
}

export const useAuthStore = create((set, get) => ({
  // ── Estado base ───────────────────────────
  user: null,
  session: null,
  profile: null,
  loading: true,

  // ── Estado derivado (SaaS-aware) ──────────
  // Estos campos se calculan automáticamente
  // cada vez que setProfile es llamado.
  // Los componentes los leen directamente
  // sin tocar profile.role nunca más.
  role: null,
  tenantId: null,
  isSuperAdmin: false,
  isAuthenticated: false,

  // ─────────────────────────────────────────
  // Setters internos
  // ─────────────────────────────────────────

  setSession: (session) => set({ session, user: session?.user ?? null }),

  // setProfile es el único lugar donde se
  // actualizan los campos derivados.
  setProfile: (profile) => set({ profile, ...deriveFromProfile(profile) }),

  setLoading: (loading) => set({ loading }),

  // ─────────────────────────────────────────
  // initAuthListener
  // Llamado UNA sola vez desde App.jsx
  // ─────────────────────────────────────────
  initAuthListener: async () => {
    // Evitar registrar múltiples listeners
    if (authListener) return;

    const { setSession, setProfile, setLoading, fetchProfile } = get();

    // 1. Sesión inicial (página cargada / refresh)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("[Auth] Error obteniendo sesión inicial:", err);
      setProfile(null);
    } finally {
      // loading se apaga SIEMPRE, con o sin error
      setLoading(false);
    }

    // 2. Listener para cambios posteriores
    // (login, logout, token refresh)
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session);

        if (event === "SIGNED_OUT") {
          // Limpiar todo el estado derivado
          setProfile(null);
          // Resetear la bandera para permitir
          // un nuevo fetch en el próximo login
          fetchingProfile = false;
          return;
        }

        if (session?.user) {
          const { profile } = get();

          // Solo fetch si no hay perfil aún
          // (evita re-fetch en TOKEN_REFRESHED
          // cuando el perfil ya está cargado)
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
        console.error("[Auth] Error en listener:", err);
      }
    });

    authListener = data.subscription;
  },

  // ─────────────────────────────────────────
  // fetchProfile
  // Único punto de fetch del perfil.
  // Incluye la validación de active.
  // ─────────────────────────────────────────
  fetchProfile: async (userId) => {
    if (fetchingProfile) return;
    fetchingProfile = true;

    const { setProfile, signOut } = get();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Error fetching profile:", error);
        setProfile(null);
        return;
      }

      if (!data) {
        // Perfil no existe (puede pasar si el
        // trigger handle_new_user falló)
        console.warn("[Auth] Profile not found para user:", userId);
        setProfile(null);
        return;
      }

      // Usuario desactivado por el ADMIN:
      // cerrar sesión inmediatamente
      if (!data.active) {
        console.warn("[Auth] Usuario inactivo, cerrando sesión");
        await signOut();
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("[Auth] fetchProfile falló:", err);
      setProfile(null);
    } finally {
      fetchingProfile = false;
    }
  },

  // ─────────────────────────────────────────
  // signOut
  // Limpia todo el estado local y cierra
  // la sesión en Supabase
  // ─────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    fetchingProfile = false;
    authListener = null; // Permitir re-init si fuera necesario
    set({
      user: null,
      session: null,
      profile: null,
      loading: false,
      role: null,
      tenantId: null,
      isSuperAdmin: false,
      isAuthenticated: false,
    });
  },

  // ─────────────────────────────────────────
  // refreshProfile
  // Para llamar después de editar el perfil
  // propio (ej: cambio de nombre en ProfilePage)
  // ─────────────────────────────────────────
  refreshProfile: async () => {
    const { user, fetchProfile } = get();
    if (user?.id) {
      fetchingProfile = false; // forzar re-fetch
      await fetchProfile(user.id);
    }
  },
}));
