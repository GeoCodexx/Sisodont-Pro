import { create }       from "zustand";
import { supabase }     from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";

// ─────────────────────────────────────────────────────────────
// useLedgerStore
//
// Reemplaza usePaymentStore + useCasePaymentStore.
// Un solo store para ambos flujos — la diferencia es ref_type.
//
// ref_type = 'appointment' → cita individual
// ref_type = 'case'        → caso multisesión
// ─────────────────────────────────────────────────────────────

export const useLedgerStore = create((set, get) => ({
  // Pagos agrupados por ref_id para acceso O(1) en componentes
  // { [ref_id]: Entry[] }
  entriesByRef: {},
  loading:      false,
  saving:       false,
  error:        null,

  // ── Cargar pagos de una referencia ────────────────────────
  fetchByRef: async (refType, refId) => {
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*, created_by_profile:profiles(full_name)")
      .eq("ref_type", refType)
      .eq("ref_id",   refId)
      .order("created_at");

    if (error) return;

    set((s) => ({
      entriesByRef: {
        ...s.entriesByRef,
        [refId]: data ?? [],
      },
    }));
  },

  // ── Registrar pago ────────────────────────────────────────
  // created_by se resuelve internamente
  register: async ({ refType, refId, amount, method, notes }) => {
    set({ saving: true, error: null });

    const userId = useAuthStore.getState().user?.id ?? null;

    const { data, error } = await supabase
      .from("ledger_entries")
      .insert({
        ref_type:   refType,
        ref_id:     refId,
        amount,
        method,
        notes:      notes || null,
        created_by: userId,
      })
      .select("*, created_by_profile:profiles(full_name)")
      .single();

    if (error) {
      set({ saving: false, error: error.message });
      return { error: error.message };
    }

    // Agregar localmente sin refetch
    set((s) => ({
      entriesByRef: {
        ...s.entriesByRef,
        [refId]: [...(s.entriesByRef[refId] ?? []), data],
      },
      saving: false,
    }));

    return { data, error: null };
  },

  // ── Eliminar pago ─────────────────────────────────────────
  remove: async (entryId, refId) => {
    const { error } = await supabase
      .from("ledger_entries")
      .delete()
      .eq("id", entryId);

    if (error) return { error: error.message };

    // Eliminar localmente
    set((s) => ({
      entriesByRef: {
        ...s.entriesByRef,
        [refId]: (s.entriesByRef[refId] ?? [])
          .filter((e) => e.id !== entryId),
      },
    }));

    return { error: null };
  },

  // ── Totales calculados para un ref_id ─────────────────────
  // Llamar con getState() para cálculos síncronos en componentes
  getTotals: (refId) => {
    const entries = useLedgerStore.getState().entriesByRef[refId] ?? [];
    return entries.reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
  },
}));