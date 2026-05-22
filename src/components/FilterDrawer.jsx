import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FilterIcon from "@mui/icons-material/FilterList";

/**
 * Drawer de filtros para vista móvil.
 * En desktop los filtros se muestran inline (children normales).
 * En móvil se ocultan y se muestran en este drawer.
 *
 * @example
 * <FilterDrawer
 *   open={filterOpen}
 *   onClose={() => setFilterOpen(false)}
 *   onApply={() => { fetchData(); setFilterOpen(false) }}
 *   onClear={handleClear}
 *   activeCount={2}
 * >
 *   <TextField label="Buscar" ... />
 *   <Select label="Estado" ... />
 * </FilterDrawer>
 */
export default function FilterDrawer({
  open,
  onClose,
  onApply,
  onClear,
  activeCount = 0,
  title = "Filtros",
  children,
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px 16px 0 0",
            maxHeight: "85vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Handle visual */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
        <Box
          sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }}
        />
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{fontWeight:600}}>
            {title}
          </Typography>
          {activeCount > 0 && (
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {activeCount}
            </Box>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Contenido scrollable */}
      <Box
        sx={{
          overflow: "auto",
          flex: 1,
          px: 2.5,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {children}
      </Box>

      {/* Acciones */}
      <Divider />
      <Box sx={{ display: "flex", gap: 1.5, p: 2 }}>
        {onClear && (
          <Button variant="outlined" fullWidth onClick={onClear}>
            Limpiar
          </Button>
        )}
        {onApply && (
          <Button variant="contained" fullWidth onClick={onApply}>
            Aplicar filtros
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
