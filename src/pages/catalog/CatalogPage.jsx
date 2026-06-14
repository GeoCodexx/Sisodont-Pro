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

      {/** Build tabs based on role: SuperAdmin -> [Specialties, Doctors, Treatments]
          Admin -> [Doctors, Treatments] */}
      {(() => {
        const tabs = [];
        if (isSuperAdmin) {
          tabs.push({
            key: "specialties",
            label: "Especialidades",
            component: <SpecialtiesTab isSuperAdmin={isSuperAdmin} />,
          });
        }
        if (isSuperAdmin || isAdmin) {
          tabs.push({
            key: "doctors",
            label: "Doctores",
            component: <DoctorsTab isAdmin={isAdmin} />,
          });
          tabs.push({
            key: "treatments",
            label: "Tratamientos",
            component: (
              <TreatmentsTab isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
            ),
          });
        }

        // Ensure current tab index is in range
        if (tab >= tabs.length) setTab(0);

        return (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
            >
              {tabs.map((t) => (
                <Tab key={t.key} label={t.label} sx={{ fontSize: { xs: 12, sm: 14 } }} />
              ))}
            </Tabs>

            {tabs[tab] && tabs[tab].component}
          </>
        );
      })()}
    </Box>
  );
}
