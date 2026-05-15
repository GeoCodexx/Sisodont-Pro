import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

export const useCasePaymentStore = create((set, get) => ({
  paymentsByCase: {},
  loading: false,
  saving: false,
  error: null,

  fetchByCase: async (caseId) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("case_payments")
      .select("*, created_by_profile:profiles(full_name)")
      .eq("case_id", caseId)
      .order("created_at");

    if (error) {
      set({
        error: error.message,
        loading: false,
      });

      return [];
    }

    set((state) => ({
      paymentsByCase: {
        ...state.paymentsByCase,
        [caseId]: data ?? [],
      },
      loading: false,
    }));

    return data ?? [];
  },

  registerPayment: async ({
    caseId,
    amount,
    method,
    notes,
    createdBy,
  }) => {
    set({ saving: true, error: null });

    const { data, error } = await supabase
      .from("case_payments")
      .insert({
        case_id: caseId,
        amount,
        method,
        notes: notes || null,
        created_by: createdBy,
      })
      .select("*, created_by_profile:profiles(full_name)")
      .single();

    set({ saving: false });

    if (error) {
      set({ error: error.message });

      return { error: error.message };
    }

    // ✅ Actualización LOCAL sin refetch
    set((state) => ({
      paymentsByCase: {
        ...state.paymentsByCase,
        [caseId]: [
          ...(state.paymentsByCase[caseId] || []),
          data,
        ],
      },
    }));

    return { error: null, data };
  },

  deletePayment: async (paymentId, caseId) => {
    const { error } = await supabase
      .from("case_payments")
      .delete()
      .eq("id", paymentId);

    if (error) {
      return { error: error.message };
    }

    // ✅ Eliminar LOCALMENTE
    set((state) => ({
      paymentsByCase: {
        ...state.paymentsByCase,
        [caseId]: (
          state.paymentsByCase[caseId] || []
        ).filter((p) => p.id !== paymentId),
      },
    }));

    return { error: null };
  },

  clearPayments: (caseId) =>
    set((state) => {
      const updated = { ...state.paymentsByCase };

      delete updated[caseId];

      return { paymentsByCase: updated };
    }),
}));