import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

// ─────────────────────────────────────────────────────────────
// URL de la Edge Function create-user
// ─────────────────────────────────────────────────────────────
const EDGE_CREATE_USER =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;

export const useUsersStore = create((set, get) => ({
  users:   [],
  loading: false,
  saving:  false,
  error:   null,

  // ── Fetch usuarios del tenant ─────────────────────────────
  // El RLS ya filtra por tenant_id del usuario autenticado.
  // Excluimos explícitamente SUPER_ADMIN para que
  // un ADMIN nunca lo vea en su listado.
  fetchUsers: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("role", "SUPER_ADMIN")
      .order("created_at", { ascending: false });

    if (error) set({ error: error.message });
    else       set({ users: data ?? [] });

    set({ loading: false });
  },

  // ── Crear usuario vía Edge Function ──────────────────────
  // La Edge Function create-user:
  //   · Valida que quien llama sea ADMIN o SUPER_ADMIN
  //   · Asigna tenant_id automáticamente (ADMIN → su tenant)
  //   · Llama a auth.admin.createUser (no signUp público)
  //   · El trigger handle_new_user crea el profile
  inviteUser: async ({ email, full_name, role, password }) => {
    set({ saving: true, error: null });

    try {
      const session = useAuthStore.getState().session;

      const res = await fetch(EDGE_CREATE_USER, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, full_name, role, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        set({ saving: false });
        return { error: json.error ?? "Error al crear usuario" };
      }

      // Refrescar listado para incluir el nuevo usuario
      await get().fetchUsers();
      set({ saving: false });
      return { error: null };

    } catch (err) {
      set({ saving: false });
      return { error: err.message };
    }
  },

  // ── Cambiar rol ───────────────────────────────────────────
  // Solo permite roles clínicos — nunca SUPER_ADMIN.
  // El RLS impide que un ADMIN modifique profiles
  // fuera de su tenant.
  updateRole: async (userId, role) => {
    const ALLOWED_ROLES = ["ADMIN", "DOCTOR", "ASSISTANT", "PATIENT"];
    if (!ALLOWED_ROLES.includes(role)) {
      return { error: "Rol no permitido" };
    }

    set({ saving: true });

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    set({ saving: false });

    if (error) return { error: error.message };

    // Actualizar localmente sin refetch completo
    set((s) => ({
      users: s.users.map((u) =>
        u.id === userId ? { ...u, role } : u
      ),
    }));

    return { error: null };
  },

  // ── Activar / desactivar usuario ──────────────────────────
  // Usa la RPC update_user_active que valida internamente
  // que quien llama sea ADMIN.
  // No permite desactivar al propio usuario
  // (esa validación se hace en la Page).
  toggleActive: async (userId, currentActive) => {
    set({ saving: true });

    const { error } = await supabase.rpc("update_user_active", {
      target_user_id: userId,
      new_active:     !currentActive,
    });

    set({ saving: false });

    if (error) return { error: error.message };

    // Actualizar localmente
    set((s) => ({
      users: s.users.map((u) =>
        u.id === userId ? { ...u, active: !currentActive } : u
      ),
    }));

    return { error: null };
  },
}));