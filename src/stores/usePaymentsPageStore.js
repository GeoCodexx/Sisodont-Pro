import { create }   from "zustand";
import { supabase } from "../services/supabaseClient";

// ─────────────────────────────────────────────────────────────
// usePaymentsPageStore
// (antes: usePaymentStore para el listado de PaymentsPage)
//
// Lee desde financial_summary en lugar de payments_summary.
// financial_summary calcula balances desde ledger_entries.
// ─────────────────────────────────────────────────────────────

export const usePaymentsPageStore = create((set, get) => ({
  rows:    [],
  total:   0,
  loading: false,
  error:   null,

  filters: {
    status:      "all",
    balance:     "all",
    search:      "",
    dateFrom:    "",
    dateTo:      "",
    refType:     "all", // 'all' | 'appointment' | 'case'
  },

  setFilter: (key, val) =>
    set((s) => ({ filters: { ...s.filters, [key]: val } })),

  fetchPayments: async ({ page = 1, pageSize = 20 } = {}) => {
    set({ loading: true, error: null });
    const { filters } = get();

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    let query = supabase
      .from("financial_summary")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(from, to);

    if (filters.refType !== "all")
      query = query.eq("ref_type", filters.refType);

    if (filters.status !== "all")
      query = query.eq("status", filters.status);

    if (filters.balance === "pending") query = query.gt("balance", 0);
    else if (filters.balance === "paid") query = query.lte("balance", 0);

    if (filters.search.trim())
      query = query.or(
        `patient_name.ilike.%${filters.search}%,` +
        `patient_dni.ilike.%${filters.search}%`
      );

    if (filters.dateFrom)
      query = query.gte("date", new Date(filters.dateFrom).toISOString());

    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59);
      query = query.lte("date", d.toISOString());
    }

    const { data, error, count } = await query;
    if (error) set({ error: error.message });
    else       set({ rows: data ?? [], total: count ?? 0 });
    set({ loading: false });
  },
}));