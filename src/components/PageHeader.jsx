import { Box, Typography } from "@mui/material";

/**
 * Header de página estandarizado.
 * - title: string
 * - actions: ReactNode (botones de la derecha)
 * - subtitle: string opcional
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h6" fontWeight={500} sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0, flexWrap: "wrap" }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
