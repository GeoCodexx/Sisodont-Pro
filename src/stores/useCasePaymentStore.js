import { create }      from "zustand";
import { supabase }    from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

export const useCasePaymentStore = create((set, get) => ({
  paymentsByCase: {},
  loading:        false,
  saving:         false,
  error:          null,

  // ── Pagos de un caso ──────────────────────────────────────
  fetchByCase: async (caseId) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("case_payments")
      .select("*, created_by_profile:profiles(full_name)")
      .eq("case_id", caseId)
      .order("created_at");

    if (error) { set({ error: error.message, loading: false }); return []; }

    set((s) => ({
      paymentsByCase: { ...s.paymentsByCase, [caseId]: data ?? [] },
      loading: false,
    }));
    return data ?? [];
  },

  // ── Registrar pago de caso multisesión ────────────────────
  // created_by se resuelve internamente
  registerPayment: async ({ caseId, amount, method, notes }) => {
    set({ saving: true, error: null });

    const userId = useAuthStore.getState().user?.id ?? null;

    const { data, error: payErr } = await supabase
      .from("case_payments")
      .insert({
        case_id:    caseId,
        amount,
        method,
        notes:      notes || null,
        created_by: userId,
      })
      .select("*, created_by_profile:profiles(full_name)")
      .single();

    if (payErr) { set({ saving: false }); return { error: payErr.message }; }

    // Actualizar localmente
    set((s) => ({
      paymentsByCase: {
        ...s.paymentsByCase,
        [caseId]: [...(s.paymentsByCase[caseId] ?? []), data],
      },
      saving: false,
    }));

    return { data, error: null };
  },

  // ── Eliminar pago de caso ─────────────────────────────────
  deletePayment: async (paymentId, caseId) => {
    const { error } = await supabase
      .from("case_payments")
      .delete()
      .eq("id", paymentId);

    if (error) return { error: error.message };

    // Eliminar localmente
    set((s) => ({
      paymentsByCase: {
        ...s.paymentsByCase,
        [caseId]: (s.paymentsByCase[caseId] ?? [])
          .filter((p) => p.id !== paymentId),
      },
    }));

    return { error: null };
  },
}));