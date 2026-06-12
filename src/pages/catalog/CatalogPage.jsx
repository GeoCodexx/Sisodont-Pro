import { useEffect, useState } from "react";
import { Box, Tabs, Tab, Alert, useTheme, useMediaQuery } from "@mui/material";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useAuthStore } from "../../stores/useAuthStore";
import SpecialtiesTab from "./SpecialtiesTab";
import DoctorsTab from "./DoctorsTab";
import TreatmentsTab from "./TreatmentsTab";
import PageHeader from "../../components/PageHeader";

export default function CatalogPage() {
  const { fetchAll } = useCatalogStore();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const isAdmin = useAuthStore((s) => s.role === "ADMIN");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <Box>
      <PageHeader title="Catálogo clínico" />

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
        }}
        variant={isMobile ? "fullWidth" : "standard"}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab label="Especialidades" sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Doctores" sx={{ fontSize: { xs: 12, sm: 14 } }} />
        <Tab label="Tratamientos" sx={{ fontSize: { xs: 12, sm: 14 } }} />
      </Tabs>

      {/* isSuperAdmin se pasa a cada tab para controlar
          visibilidad de acciones CRUD */}
      {tab === 0 && <SpecialtiesTab isSuperAdmin={isSuperAdmin} />}
      {tab === 1 && <DoctorsTab isAdmin={isAdmin} />}
      {tab === 2 && (
        <TreatmentsTab isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
      )}
    </Box>
  );
}
