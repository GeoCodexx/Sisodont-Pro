import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ListIcon from "@mui/icons-material/List";
import { useAppointmentStore } from "../../stores/useAppointmentStore";
import { useRole } from "../../hooks/useRole";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import AppointmentFormModal from "./AppointmentFormModal";
import AppointmentDetailDrawer from "./AppointmentDetailDrawer";
import PageHeader from "../../components/PageHeader";

const STATUS_COLORS = {
  pendiente: "#BA7517",
  atendido: "#1D9E75",
  cancelado: "#A32D2D",
};

const STATUS_MUI = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

// ─────────────────────────────────────────────────────────────
// AppointmentItem — memo evita re-render de cada fila cuando
// cambia la selección u otro ítem de la lista.
// ─────────────────────────────────────────────────────────────
const AppointmentItem = memo(function AppointmentItem({ appt, onSelect }) {
  return (
    <ListItemButton onClick={() => onSelect(appt)} sx={{ py: 1.25, px: 2 }}>
      <Box
        sx={{
          width: 4,
          height: 36,
          borderRadius: 2,
          bgcolor: STATUS_COLORS[appt.status] ?? "#534AB7",
          mr: 1.5,
          flexShrink: 0,
        }}
      />
      <ListItemText
        primary={
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{ flex: 1, fontWeight: 500 }}
            >
              {appt.patient_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ ml: 1, flexShrink: 0, color: "text.secondary" }}
            >
              {new Date(appt.date).toLocaleTimeString("es-PE", {
                timeStyle: "short",
              })}
            </Typography>
          </Box>
        }
        secondary={
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 0.25,
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{ color: "text.secondary" }}
            >
              {appt.treatment_name ?? "—"} · {appt.doctor_name ?? "—"}
            </Typography>
            <Chip
              label={appt.status}
              color={STATUS_MUI[appt.status] ?? "default"}
              size="small"
              sx={{
                textTransform: "capitalize",
                fontSize: 10,
                height: 18,
                ml: 1,
              }}
            />
          </Box>
        }
        slotProps={{ secondary: { component: "div" } }}
      />
    </ListItemButton>
  );
});

// ─────────────────────────────────────────────────────────────
// AppointmentList — memo evita re-render cuando el padre
// cambia estado no relacionado (feedback, modals, etc.)
// ─────────────────────────────────────────────────────────────
const AppointmentList = memo(function AppointmentList({
  appointments,
  onSelect,
}) {
  // useMemo: el agrupado por fecha sólo recalcula cuando cambia appointments
  const groups = useMemo(() => {
    const g = {};
    appointments.forEach((a) => {
      const day = new Date(a.date).toLocaleDateString("es-PE", {
        dateStyle: "full",
      });
      if (!g[day]) g[day] = [];
      g[day].push(a);
    });
    return g;
  }, [appointments]);

  if (appointments.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", mt: 6 }}>
        No hay citas en este período.
      </Typography>
    );
  }

  return (
    <Box>
      {Object.entries(groups).map(([day, items]) => (
        <Box key={day} sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            {day}
          </Typography>
          <Card variant="outlined" sx={{ mt: 0.75 }}>
            <List disablePadding>
              {items.map((a, i) => (
                <Box key={a.id}>
                  {i > 0 && <Divider />}
                  <AppointmentItem appt={a} onSelect={onSelect} />
                </Box>
              ))}
            </List>
          </Card>
        </Box>
      ))}
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────
// Estilos estáticos del calendario — objeto fuera del componente
// para que no se recree en cada render.
// ─────────────────────────────────────────────────────────────
const CALENDAR_SX = {
  "& .fc": { fontFamily: "inherit" },
  "& .fc-button": { textTransform: "capitalize" },
  "& .fc-event": { cursor: "pointer", fontSize: "0.8rem", px: 0.5 },
  "& .fc-header-toolbar": {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 1,
  },
  "& .fc-toolbar-chunk": { display: "flex", alignItems: "center", gap: 1 },

  // ── Vista mes: compactar eventos en una línea con elipsis ──
  "& .fc-daygrid-event .fc-event-title": {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: "0.7rem",
  },
  "& .fc-daygrid-event .fc-event-time": {
    fontSize: "0.7rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  "& .fc-daygrid-event": {
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  "@media (max-width:600px)": {
    "& .fc-header-toolbar": {
      flexDirection: "column",
      gap: 0.5,
      alignItems: "center",
    },
    "& .fc-toolbar-chunk": { justifyContent: "center", width: "100%" },
    "& .fc-button": {
      fontSize: "0.9rem",
      px: 0.6,
      py: 0.3,
      minWidth: "auto",
    },
    "& .fc-toolbar-title": { fontSize: "1rem", textAlign: "center" },
  },
};

const handleEventDidMount = ({ el, event }) => {
  const appt = event.extendedProps;
  const time = new Date(appt.date).toLocaleTimeString("es-PE", { timeStyle: "short" });
  el.title = `${time} · ${appt.patient_name} · ${appt.treatment_name ?? "Sin tratamiento"}`;
};

// ─────────────────────────────────────────────────────────────
// AppointmentsPage
// ─────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const calendarRef = useRef(null);
  const { can } = useRole();
  const { isMobile } = useBreakpoint();
  const { appointments, loading, error, fetchByRange, setSelected } =
    useAppointmentStore();

  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [currentRange, setCurrentRange] = useState({ start: null, end: null });

  // useMemo: transforma appointments → eventos de FullCalendar.
  // Solo recalcula cuando cambia el array de appointments.
  const events = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title: `${a.patient_name} — ${a.treatment_name ?? ""}`,
        start: a.date,
        end: a.end_date ?? undefined,
        backgroundColor: STATUS_COLORS[a.status] ?? "#534AB7",
        borderColor: STATUS_COLORS[a.status] ?? "#534AB7",
        extendedProps: a,
      })),
    [appointments],
  );

  // useMemo: lista ordenada para la vista móvil.
  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments],
  );

  // useCallback: handlers estables — evitan que FullCalendar
  // o los hijos se re-suscriban en cada render del padre.
  const handleDatesSet = useCallback(
    ({ start, end }) => {
      setCurrentRange({ start, end });
      fetchByRange(start, end);
    },
    [fetchByRange],
  );

  const handleDateClick = useCallback(
    ({ date }) => {
      if (!can(["ADMIN", "ASSISTANT"])) return;
      setPrefillDate(date);
      setOpenForm(true);
    },
    [can],
  );

  const handleEventClick = useCallback(
    ({ event }) => {
      setSelected(event.extendedProps);
      setOpenDetail(true);
    },
    [setSelected],
  );

  const handleListSelect = useCallback(
    (appt) => {
      setSelected(appt);
      setOpenDetail(true);
    },
    [setSelected],
  );

  const handleFormClose = useCallback(
    (saved) => {
      setOpenForm(false);
      setPrefillDate(null);
      if (saved) {
        setFeedback("Cita guardada correctamente.");
        if (currentRange.start)
          fetchByRange(currentRange.start, currentRange.end);
      }
    },
    [currentRange, fetchByRange],
  );

  const handleDetailUpdate = useCallback(() => {
    if (currentRange.start) fetchByRange(currentRange.start, currentRange.end);
  }, [currentRange, fetchByRange]);

  const handleViewModeChange = useCallback((_, v) => {
    if (v) setViewMode(v);
  }, []);

  const handleNewCita = useCallback(() => {
    setPrefillDate(null);
    setOpenForm(true);
  }, []);

  const handleCloseFeedback = useCallback(() => setFeedback(""), []);
  const handleCloseDetail = useCallback(() => setOpenDetail(false), []);

  // En móvil vista lista: cargar mes actual al montar
  useEffect(() => {
    if (isMobile && viewMode === "list") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      fetchByRange(start, end);
      setCurrentRange({ start, end });
    }
  }, [isMobile, viewMode]);

  return (
    <Box>
      <PageHeader
        title="Agenda de citas"
        actions={
          <>
            {isMobile && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="list">
                  <ListIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="calendar">
                  <CalendarMonthIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {can(["ADMIN", "ASSISTANT"]) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size={isMobile ? "small" : "medium"}
                onClick={handleNewCita}
              >
                {isMobile ? "Nueva" : "Nueva cita"}
              </Button>
            )}
          </>
        }
      />

      {feedback && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={handleCloseFeedback}>
          {feedback}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Leyenda de estados */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Box
            key={status}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: color,
              }}
            />
            <Typography variant="caption" sx={{ textTransform: "capitalize" }}>
              {status}
            </Typography>
          </Box>
        ))}
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Vista móvil lista */}
      {isMobile && viewMode === "list" && (
        <AppointmentList
          appointments={sortedAppointments}
          onSelect={handleListSelect}
        />
      )}

      {/* Calendario */}
      {(!isMobile || viewMode === "calendar") && (
        <Box sx={CALENDAR_SX}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDisplay="block"
            eventDidMount={handleEventDidMount}   // ← tooltip nativo en hover
            height={isMobile ? 420 : "auto"}
            editable={false}
            selectable={can(["ADMIN", "ASSISTANT"])}
          />
        </Box>
      )}

      <AppointmentFormModal
        open={openForm}
        prefillDate={prefillDate}
        onClose={handleFormClose}
      />
      <AppointmentDetailDrawer
        open={openDetail}
        onClose={handleCloseDetail}
        onUpdate={handleDetailUpdate}
      />
    </Box>
  );
}
