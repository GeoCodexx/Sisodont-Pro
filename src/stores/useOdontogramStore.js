import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "./useAuthStore";
import {
  initialOdontogramData, emptyTooth, DEFAULT_ACTIONS,
  ADULT_TEETH, CHILD_TEETH,
} from "../pages/odontogram/odontogramConstants";

export const useOdontogramStore = create((set, get) => ({
  data:           null,
  odontogramId:   null,
  odontogramType: "adult",  // 'adult' | 'child'
  actions:        DEFAULT_ACTIONS,
  selectedTooth:  null,
  selectedAction: null,
  loading:        false,
  saving:         false,
  dirty:          false,
  error:          null,

  // ── Cargar acciones desde BD ──────────────────────────────
  fetchActions: async () => {
    const { data } = await supabase
      .from("odontogram_actions")
      .select("*")
      .eq("active", true)
      .order("name");
    if (data?.length) set({ actions: data });
  },

  // ── Cambiar tipo (adulto / niño) ──────────────────────────
  setOdontogramType: (type) => {
    const { data } = get();
    if (!data) { set({ odontogramType: type }); return; }

    const targetTeeth = type === "child" ? CHILD_TEETH : ADULT_TEETH;
    const existing    = Object.fromEntries(data.teeth.map((t) => [t.number, t]));
    const newTeeth    = targetTeeth.map((n) => existing[n] ?? emptyTooth(n));

    set({ odontogramType: type, data: { teeth: newTeeth }, selectedTooth: null });
  },

  // ── Cargar odontograma ────────────────────────────────────
  fetchOdontogram: async (patientId) => {
    set({ loading: true, error: null, dirty: false, selectedTooth: null, selectedAction: null });

    const { data, error } = await supabase
      .from("odontograms")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (error) { set({ error: error.message, loading: false }); return; }

    if (data) {
      const savedTeeth  = data.data?.teeth ?? [];
      const savedMap    = Object.fromEntries(savedTeeth.map((t) => [t.number, t]));
      const hasChild    = savedTeeth.some((t) => t.number >= 51 && t.number <= 85);
      const type        = hasChild ? "child" : "adult";
      const targetTeeth = type === "child" ? CHILD_TEETH : ADULT_TEETH;
      const allTeeth    = targetTeeth.map((n) => savedMap[n] ?? emptyTooth(n));

      set({
        data: { teeth: allTeeth },
        odontogramId:   data.id,
        odontogramType: type,
        loading: false,
      });
    } else {
      set({
        data:           initialOdontogramData("adult"),
        odontogramId:   null,
        odontogramType: "adult",
        loading: false,
      });
    }
  },

  // ── Seleccionar diente / acción ───────────────────────────
  selectTooth:  (number) => set({ selectedTooth: number }),
  selectAction: (action) => set({ selectedAction: action }),

  // ── Pintar una cara ───────────────────────────────────────
  paintFace: (toothNumber, face) => {
    const { data, selectedAction, actions } = get();
    if (!data || !selectedAction) return;

    const actionMeta = actions.find((a) => a.name === selectedAction);
    const color      = actionMeta?.color ?? "#888";

    const newTeeth = data.teeth.map((t) => {
      if (t.number !== toothNumber) return t;
      const newFaces = { ...t.faces };
      if (newFaces[face]?.action === selectedAction) {
        delete newFaces[face]; // toggle: quitar si ya tiene la misma acción
      } else {
        newFaces[face] = { action: selectedAction, color };
      }
      return { ...t, faces: newFaces };
    });
    set({ data: { teeth: newTeeth }, dirty: true });
  },

  // ── Marcar ausente ────────────────────────────────────────
  toggleAbsent: (toothNumber) => {
    const { data } = get();
    if (!data) return;
    const newTeeth = data.teeth.map((t) =>
      t.number === toothNumber
        ? { ...t, absent: !t.absent, faces: {} }
        : t
    );
    set({ data: { teeth: newTeeth }, dirty: true });
  },

  // ── Limpiar diente ────────────────────────────────────────
  clearTooth: (toothNumber) => {
    const { data } = get();
    if (!data) return;
    const newTeeth = data.teeth.map((t) =>
      t.number === toothNumber ? emptyTooth(toothNumber) : t
    );
    set({ data: { teeth: newTeeth }, dirty: true });
  },

  // ── Notas del diente ──────────────────────────────────────
  setToothNote: (toothNumber, notes) => {
    const { data } = get();
    if (!data) return;
    const newTeeth = data.teeth.map((t) =>
      t.number === toothNumber ? { ...t, notes } : t
    );
    set({ data: { teeth: newTeeth }, dirty: true });
  },

  // ── Guardar ───────────────────────────────────────────────
  // updated_by se resuelve internamente — el componente
  // ya no necesita pasar profile?.id como argumento
  saveOdontogram: async (patientId) => {
    const { data, odontogramId } = get();
    if (!data) return { error: "Sin datos para guardar" };

    set({ saving: true, error: null });

    const userId = useAuthStore.getState().user?.id ?? null;

    const payload = {
      patient_id: patientId,
      data,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (odontogramId) {
      const res = await supabase
        .from("odontograms")
        .update(payload)
        .eq("id", odontogramId);
      error = res.error;
    } else {
      const res = await supabase
        .from("odontograms")
        .insert(payload)
        .select("id")
        .single();
      error = res.error;
      if (!error && res.data) set({ odontogramId: res.data.id });
    }

    set({ saving: false, dirty: !!error });
    return { error: error?.message ?? null };
  },

  reset: () => set({
    data:           null,
    odontogramId:   null,
    odontogramType: "adult",
    selectedTooth:  null,
    selectedAction: null,
    dirty:          false,
    error:          null,
  }),
}));