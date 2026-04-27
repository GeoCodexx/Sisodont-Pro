import { useEffect, useState } from 'react'
import { Box, Tabs, Tab, Typography, Alert, useTheme, useMediaQuery } from '@mui/material'
import { useCatalogStore } from '../../stores/useCatalogStore'
import SpecialtiesTab from './SpecialtiesTab'
import DoctorsTab     from './DoctorsTab'
import TreatmentsTab  from './TreatmentsTab'
import PageHeader     from '../../components/PageHeader'

export default function CatalogPage() {
  const { fetchAll } = useCatalogStore()
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [tab,      setTab]      = useState(0)
  const [feedback, setFeedback] = useState({ msg: '', type: 'success' })

  useEffect(() => { fetchAll() }, [])

  const notify = (msg, type = 'success') => setFeedback({ msg, type })

  return (
    <Box>
      <PageHeader title="Catálogo clínico" />

      {feedback.msg && (
        <Alert severity={feedback.type} sx={{ mb: 2 }}
          onClose={() => setFeedback({ msg: '', type: 'success' })}>
          {feedback.msg}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant={isMobile ? 'fullWidth' : 'standard'}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Especialidades" sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Doctores"       sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Tratamientos"   sx={{ fontSize: { xs: 12, sm: 14 } }} />
      </Tabs>

      {tab === 0 && <SpecialtiesTab onNotify={notify} />}
      {tab === 1 && <DoctorsTab    onNotify={notify} />}
      {tab === 2 && <TreatmentsTab onNotify={notify} />}
    </Box>
  )
}