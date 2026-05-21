import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Alert, CircularProgress,
  Typography, Divider, InputAdornment, IconButton,
} from "@mui/material";
import { Box } from "@mui/material";
import BusinessIcon   from "@mui/icons-material/Business";
import PersonIcon     from "@mui/icons-material/Person";
import Visibility     from "@mui/icons-material/Visibility";
import VisibilityOff  from "@mui/icons-material/VisibilityOff";
import { useAuthStore } from "../../stores/useAuthStore";

// ─────────────────────────────────────────────────────────────
// Edge Function: create-tenant
// Solo accesible para SUPER_ADMIN.
// Crea el tenant y su usuario ADMIN en una sola operación.
// ─────────────────────────────────────────────────────────────
const EDGE_CREATE_TENANT =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-tenant`;

const EMPTY = {
  tenant_name:     "",
  tenant_slug:     "",
  admin_full_name: "",
  admin_email:     "",
  admin_password:  "",
};

// Auto-genera slug desde el nombre: "Mi Clínica" → "mi-clinica"
function toSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // quita tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ─────────────────────────────────────────────────────────────
// CreateTenantDialog
// ─────────────────────────────────────────────────────────────
export default function CreateTenantDialog({ open, onClose, onCreated }) {
  const session = useAuthStore((s) => s.session);

  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const setField = (f) => (e) => {
    const val = e.target.value;
    setForm((p) => {
      const next = { ...p, [f]: val };
      // Auto-slug solo si el usuario no lo ha editado manualmente
      if (f === "tenant_name" && !slugEdited) {
        next.tenant_slug = toSlug(val);
      }
      return next;
    });
  };

  const handleSlugChange = (e) => {
    setSlugEdited(true);
    setForm((p) => ({ ...p, tenant_slug: e.target.value }));
  };

  const handleClose = () => {
    setForm(EMPTY);
    setError("");
    setSlugEdited(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    // Validaciones básicas
    if (!form.tenant_name.trim())     { setError("El nombre de la clínica es requerido."); return; }
    if (!form.tenant_slug.trim())     { setError("El slug es requerido."); return; }
    if (!/^[a-z0-9-]+$/.test(form.tenant_slug)) {
      setError("El slug solo puede contener letras minúsculas, números y guiones."); return;
    }
    if (!form.admin_full_name.trim()) { setError("El nombre del administrador es requerido."); return; }
    if (!form.admin_email.trim())     { setError("El correo del administrador es requerido."); return; }
    if (form.admin_password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }

    setSaving(true);

    try {
      const res = await fetch(EDGE_CREATE_TENANT, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenant_name:     form.tenant_name.trim(),
          tenant_slug:     form.tenant_slug.trim(),
          admin_email:     form.admin_email.trim(),
          admin_password:  form.admin_password,
          admin_full_name: form.admin_full_name.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Error al crear la clínica.");
        setSaving(false);
        return;
      }

      // Éxito — notificar al padre para refrescar la lista
      onCreated?.(json.tenant);
      handleClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva clínica</DialogTitle>

      <DialogContent sx={{ pt: "16px !important" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Datos de la clínica */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            DATOS DE LA CLÍNICA
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Nombre de la clínica *"
              value={form.tenant_name}
              onChange={setField("tenant_name")}
              size="small"
              fullWidth
              autoFocus
              placeholder="Ej: Clínica Dental San Marcos"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Slug (identificador único) *"
              value={form.tenant_slug}
              onChange={handleSlugChange}
              size="small"
              fullWidth
              placeholder="clinica-san-marcos"
              helperText="Solo minúsculas, números y guiones. Se genera automáticamente."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="caption" color="text.secondary">
                        /
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Datos del administrador */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            ADMINISTRADOR INICIAL
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }} icon={false}>
          <Typography variant="caption">
            Se creará automáticamente un usuario con rol ADMIN para gestionar esta clínica.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Nombre completo *"
              value={form.admin_full_name}
              onChange={setField("admin_full_name")}
              size="small"
              fullWidth
              placeholder="Ej: Dr. Carlos Rodríguez"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Correo electrónico *"
              type="email"
              value={form.admin_email}
              onChange={setField("admin_email")}
              size="small"
              fullWidth
              placeholder="admin@clinica.com"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Contraseña temporal *"
              type={showPw ? "text" : "password"}
              value={form.admin_password}
              onChange={setField("admin_password")}
              size="small"
              fullWidth
              helperText="El administrador podrá cambiarla desde su perfil."
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPw((v) => !v)}
                        edge="end"
                      >
                        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? "Creando clínica..." : "Crear clínica"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}