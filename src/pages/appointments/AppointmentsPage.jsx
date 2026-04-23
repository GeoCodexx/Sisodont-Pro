import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin  from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import {
  Box, Button, Typography, Alert, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAppointmentStore } from '../../stores/useAppointmentStore'
import { useRole } from '../../hooks/useRole'
import AppointmentFormModal  from './AppointmentFormModal'
import AppointmentDetailDrawer from './AppointmentDetailDrawer'

const STATUS_COLORS = {
  pendiente:  '#BA7517',
  atendido:   '#1D9E75',
  cancelado:  '#A32D2D',
}

export default function AppointmentsPage() {
  const calendarRef = useRef(null)
  const { can } = useRole()
  const { appointments, loading, error, fetchByRange, setSelected } = useAppointmentStore()

  const [openForm,   setOpenForm]   = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [prefillDate, setPrefillDate] = useState(null)
  const [feedback, setFeedback] = useState('')

  // Convertir citas al formato de FullCalendar
  const events = appointments.map(a => ({
    id:              a.id,
    title:           `${a.patient_name} — ${a.treatment_name ?? 'Sin tratamiento'}`,
    start:           a.date,
    end:             a.end_date ?? undefined,
    backgroundColor: STATUS_COLORS[a.status] ?? '#534AB7',
    borderColor:     STATUS_COLORS[a.status] ?? '#534AB7',
    extendedProps:   a,
  }))

  const handleDatesSet = ({ start, end }) => {
    fetchByRange(start, end)
  }

  const handleDateClick = ({ date }) => {
    if (!can(['ADMIN', 'ASSISTANT'])) return
    setPrefillDate(date)
    setOpenForm(true)
  }

  const handleEventClick = ({ event }) => {
    setSelected(event.extendedProps)
    setOpenDetail(true)
  }

  const handleFormClose = (saved) => {
    setOpenForm(false)
    setPrefillDate(null)
    if (saved) {
      setFeedback('Cita guardada correctamente.')
      // Refrescar el rango visible
      const api = calendarRef.current?.getApi()
      if (api) fetchByRange(api.view.activeStart, api.view.activeEnd)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={500}>Agenda de citas</Typography>
        {can(['ADMIN', 'ASSISTANT']) && (
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => { setPrefillDate(null); setOpenForm(true) }}>
            Nueva cita
          </Button>
        )}
      </Box>

      {feedback && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFeedback('')}>
          {feedback}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Leyenda de estados */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{status}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{
        '& .fc': { fontFamily: 'inherit' },
        '& .fc-button': { textTransform: 'capitalize' },
        '& .fc-event': { cursor: 'pointer', fontSize: '0.75rem', px: 0.5 },
        '& .fc-day-today': { bgcolor: 'primary.light + 22 !important' },
      }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDisplay="block"
          height="auto"
          editable={false}
          selectable={can(['ADMIN', 'ASSISTANT'])}
        />
      </Box>

      <AppointmentFormModal
        open={openForm}
        prefillDate={prefillDate}
        onClose={handleFormClose}
      />

      <AppointmentDetailDrawer
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        onUpdate={() => {
          const api = calendarRef.current?.getApi()
          if (api) fetchByRange(api.view.activeStart, api.view.activeEnd)
        }}
      />
    </Box>
  )
}