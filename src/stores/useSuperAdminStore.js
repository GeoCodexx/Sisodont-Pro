import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// useSuperAdminStore
//
// Solo accesible para SUPER_ADMIN.
// El RLS de Supabase enforce esto — cualquier query aquí
// fallará silenciosamente para roles sin bypass.
// ─────────────────────────────────────────────────────────────

export const useSuperAdminStore = create((set, get) => ({
  tenants:  [],
  selected: null,
  kpis:     null,
  loading:  false,
  saving:   false,
  error:    null,

  // ── KPIs globales del SaaS ────────────────────────────────
  fetchGlobalKpis: async () => {
    const [tenantsRes, profilesRes, apptsRes, casesRes] = await Promise.all([
      supabase.from("tenants").select("id, active"),
      supabase.from("profiles").select("id, role, tenant_id, created_at"),
      supabase.from("appointments").select("id, status, total, paid, tenant_id"),
      supabase
        .from("treatment_cases")
        .select("id, status, tenant_id")
        .eq("status", "en_curso"),
    ]);

    const tenants  = tenantsRes.data  ?? [];
    const profiles = profilesRes.data ?? [];
    const appts    = apptsRes.data    ?? [];
    const cases    = casesRes.data    ?? [];

    const totalTenants  = tenants.length;
    const activeTenants = tenants.filter((t) => t.active).length;
    const totalUsers    = profiles.filter((p) => p.role !== "SUPER_ADMIN").length;
    const totalAppts    = appts.length;
    const grossRevenue  = appts.reduce((s, a) => s + Number(a.total ?? 0), 0);
    const collected     = appts.reduce((s, a) => s + Number(a.paid  ?? 0), 0);
    const activeCases   = cases.length;

    set({
      kpis: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        totalUsers,
        totalAppts,
        grossRevenue,
        collected,
        pendingBalance: grossRevenue - collected,
        activeCases,
      },
    });
  },

  // ── Lista de tenants con métricas por clínica ─────────────
  fetchTenants: async () => {
    set({ loading: true, error: null });

    const [tenantsRes, profilesRes, apptsRes] = await Promise.all([
      supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, tenant_id, role")
        .neq("role", "SUPER_ADMIN"),
      supabase
        .from("appointments")
        .select("id, tenant_id, status, total, paid, date"),
    ]);

    const tenants  = tenantsRes.data  ?? [];
    const profiles = profilesRes.data ?? [];
    const appts    = apptsRes.data    ?? [];

    // Agregar métricas por tenant
    const enriched = tenants.map((t) => {
      const tProfiles = profiles.filter((p) => p.tenant_id === t.id);
      const tAppts    = appts.filter((a) => a.tenant_id === t.id);
      const attended  = tAppts.filter((a) => a.status === "atendido");
      const lastAppt  = tAppts.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];

      return {
        ...t,
        users_count:   tProfiles.length,
        appts_count:   tAppts.length,
        appts_attended: attended.length,
        gross_revenue: tAppts.reduce((s, a) => s + Number(a.total ?? 0), 0),
        collected:     tAppts.reduce((s, a) => s + Number(a.paid  ?? 0), 0),
        last_activity: lastAppt?.date ?? null,
      };
    });

    set({ tenants: enriched, loading: false });
    await get().fetchGlobalKpis();
  },

  // ── Detalle de un tenant ──────────────────────────────────
  fetchTenantById: async (id) => {
    set({ loading: true, error: null });

    const [tenantRes, profilesRes, apptsRes, casesRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, active, created_at")
        .eq("tenant_id", id)
        .neq("role", "SUPER_ADMIN")
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments_full")
        .select("*")
        .eq("tenant_id", id)
        .order("date", { ascending: false })
        .limit(10),
      supabase
        .from("treatment_cases_full")
        .select("*")
        .eq("tenant_id", id)
        .eq("status", "en_curso")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (tenantRes.error) { set({ error: tenantRes.error.message, loading: false }); return; }

    set({
      selected: {
        ...tenantRes.data,
        profiles: profilesRes.data ?? [],
        recent_appointments: apptsRes.data ?? [],
        active_cases: casesRes.data ?? [],
      },
      loading: false,
    });
  },

  // ── Activar / desactivar tenant ───────────────────────────
  toggleTenantActive: async (id, currentActive) => {
    set({ saving: true });
    const { error } = await supabase
      .from("tenants")
      .update({ active: !currentActive })
      .eq("id", id);

    if (!error) {
      set((s) => ({
        tenants: s.tenants.map((t) =>
          t.id === id ? { ...t, active: !currentActive } : t
        ),
        selected: s.selected?.id === id
          ? { ...s.selected, active: !currentActive }
          : s.selected,
      }));
    }
    set({ saving: false });
    return { error: error?.message ?? null };
  },
}));