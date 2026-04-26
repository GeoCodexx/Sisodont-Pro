import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

/**
 * Menú desplegable con opciones de exportación Excel y PDF.
 *
 * @example
 * <ExportMenu
 *   onExcelExport={handleExcel}
 *   onPdfExport={handlePdf}
 *   totalRows={total}
 *   disabled={loading}
 * />
 */
export default function ExportMenu({
  onExcelExport,
  onPdfExport,
  totalRows = 0,
  disabled = false,
  label = "Exportar",
}) {
  const [anchor, setAnchor] = useState(null);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const open = Boolean(anchor);

  const handleExcel = async () => {
    setLoadingExcel(true);
    try {
      await onExcelExport?.();
    } finally {
      setLoadingExcel(false);
      setAnchor(null);
    }
  };

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await onPdfExport?.();
    } finally {
      setLoadingPdf(false);
      setAnchor(null);
    }
  };

  const isLoading = loadingExcel || loadingPdf;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          isLoading ? <CircularProgress size={14} /> : <FileDownloadIcon />
        }
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={disabled || isLoading || totalRows === 0}
      >
        {label}
      </Button>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        //PaperProps={{ sx: { minWidth: 200 } }}
        slotProps={{
          paper: {
            sx: { minWidth: 200 },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: "1 !important" }}>
          <Typography variant="caption" color="text.secondary">
            {totalRows} registro{totalRows !== 1 ? "s" : ""} (filtros aplicados)
          </Typography>
        </MenuItem>
        <Divider />

        <MenuItem onClick={handleExcel} disabled={loadingExcel}>
          <ListItemIcon>
            {loadingExcel ? (
              <CircularProgress size={18} />
            ) : (
              <TableChartIcon fontSize="small" sx={{ color: "#1D6F42" }} />
            )}
          </ListItemIcon>
          <ListItemText
            primary="Excel (.xlsx)"
            secondary="Abre en Microsoft Excel"
            slotProps={{
              primary: {
                sx: {
                  fontSize: 14,
                },
              },
              secondary: {
                sx: {
                  fontSize: 11,
                },
              },
            }}
          />
        </MenuItem>

        <MenuItem onClick={handlePdf} disabled={loadingPdf}>
          <ListItemIcon>
            {loadingPdf ? (
              <CircularProgress size={18} />
            ) : (
              <PictureAsPdfIcon fontSize="small" sx={{ color: "#D32F2F" }} />
            )}
          </ListItemIcon>
          <ListItemText
            primary="PDF (.pdf)"
            secondary="Hoja A4 horizontal"
            slotProps={{
              primary: {
                sx: {
                  fontSize: 14,
                },
              },
              secondary: {
                sx: {
                  fontSize: 11,
                },
              },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
