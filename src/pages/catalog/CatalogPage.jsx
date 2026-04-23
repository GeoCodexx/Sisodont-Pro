import { useEffect, useState } from 'react'
import { Box, Tabs, Tab, Typography, Alert } from '@mui/material'
import { useCatalogStore } from '../../stores/useCatalogStore'
import SpecialtiesTab from './SpecialtiesTab'
import DoctorsTab from './DoctorsTab'
import TreatmentsTab from './TreatmentsTab'

export default function CatalogPage() {
  const { fetchAll, loading, error } = useCatalogStore()
  const [tab, setTab] = useState(0)
  const [feedback, setFeedback] = useState({ msg: '', type: 'success' })

  useEffect(() => { fetchAll() }, [])

  const notify = (msg, type = 'success') => setFeedback({ msg, type })

  return (
    <Box>
      <Typography variant="h6" fontWeight={500} mb={2}>
        Catálogo clínico
      </Typography>

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback({ msg: '', type: 'success' })}
        >
          {feedback.msg}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Especialidades" />
        <Tab label="Doctores" />
        <Tab label="Tratamientos" />
      </Tabs>

      {tab === 0 && <SpecialtiesTab onNotify={notify} />}
      {tab === 1 && <DoctorsTab    onNotify={notify} />}
      {tab === 2 && <TreatmentsTab onNotify={notify} />}
    </Box>
  )
}