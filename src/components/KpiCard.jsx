import { Box, Card, CardContent, Typography, Skeleton } from "@mui/material";

export default function KpiCard({ label, value, sub, icon, color, loading }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
            >
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={36} />
            ) : (
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, color: color ?? "text.primary" }}
              >
                {value}
              </Typography>
            )}
            {sub && !loading && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
              >
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                bgcolor: (color ?? "primary.main") + "18",
                color: color ?? "primary.main",
                borderRadius: 2,
                p: 1,
                display: "flex",
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
