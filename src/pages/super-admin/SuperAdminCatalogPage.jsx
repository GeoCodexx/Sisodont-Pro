import { useEffect, useState } from "react";
import { Box, Tabs, Tab, Alert, useTheme, useMediaQuery } from "@mui/material";
import { useCatalogStore }    from "../../stores/useCatalogStore";
import SpecialtiesTab         from "../catalog/SpecialtiesTab";
import TreatmentsTab          from "../catalog/TreatmentsTab";
import OdontogramActionsTab   from "./OdontogramActionsTab";
import PageHeader             from "../../components/PageHeader";

// ─────────────────────────────────────────────────────────────
// SuperAdminCatalogPage
//
// Gestión global del catálogo SaaS:
// · Especialidades  — globales, todas las clínicas las comparten
// · Tratamientos    — globales, precio y duración base
// · Acciones odontograma — colores y nombres del odontograma
//
// isSuperAdmin = true siempre aquí — esta ruta solo es
// accesible desde SuperAdminRoute.
// ─────────────────────────────────────────────────────────────

export default function SuperAdminCatalogPage() {
  const { fetchAll }  = useCatalogStore();
  const theme         = useTheme();
  const isMobile      = useMediaQuery(theme.breakpoints.down("sm"));

  const [tab,      setTab]      = useState(0);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  useEffect(() => { fetchAll(); }, []);

  const notify      = (msg, type = "success") => setFeedback({ msg, type });
  const clearFeedback = () => setFeedback({ msg: "", type: "success" });

  return (
    <Box>
      <PageHeader
        title="Catálogo global"
        subtitle="Especialidades, tratamientos y acciones compartidas por todas las clínicas"
      />

      {feedback.msg && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={clearFeedback}
        >
          {feedback.msg}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); clearFeedback(); }}
        variant={isMobile ? "fullWidth" : "standard"}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab label="Especialidades"         sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Tratamientos"           sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Acciones odontograma"   sx={{ fontSize: { xs: 12, sm: 14 } }} />
      </Tabs>

      {/* isSuperAdmin siempre true en este módulo */}
      {tab === 0 && <SpecialtiesTab       onNotify={notify} isSuperAdmin={true} />}
      {tab === 1 && <TreatmentsTab        onNotify={notify} isSuperAdmin={true} />}
      {tab === 2 && <OdontogramActionsTab onNotify={notify} />}
    </Box>
  );
}