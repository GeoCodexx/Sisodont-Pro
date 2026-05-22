import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { supabase } from "../../services/supabaseClient";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { useBreakpoint } from "../../hooks/useBreakpoint";

import FilterDrawer from "../../components/FilterDrawer";
import FilterButton from "../../components/FilterButton";
import PageHeader from "../../components/PageHeader";
import ExportMenu from "../../components/ExportMenu";
import TablePagination from "../../components/TablePagination";

import { useHistoryExport } from "../../hooks/useHistoryExport";

const STATUS_COLOR = {
  pendiente: "warning",
  atendido: "success",
  cancelado: "error",
};

function fmt(iso) {
  return iso
    ? new Date(iso).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

function fmtMoney(value) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

function HistoryCard({ row, onView }) {
  const hasDebt = Number(row.balance) > 0;
  const isMulti = !!row.case_id;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1.2,
              minWidth: 0,
              flex: 1,
            }}
          >
            <Avatar sx={{ width: 40, height: 40 }}>
              {row.patient_name?.[0] ?? "P"}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {row.patient_name}
              </Typography>

              {row.patient_dni && (
                <Typography variant="caption" color="text.secondary">
                  DNI: {row.patient_dni}
                </Typography>
              )}

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                }}
              >
                {fmt(row.date)}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={row.status}
            color={STATUS_COLOR[row.status] ?? "default"}
            size="small"
            sx={{
              textTransform: "capitalize",
              fontWeight: 500,
            }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Body */}
        <Stack spacing={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Tratamiento
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {row.treatment_name ?? "—"}
              </Typography>
            </Box>

            <Chip
              size="small"
              variant="outlined"
              color={isMulti ? "primary" : "default"}
              label={isMulti ? "Multisesión" : "Única"}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Doctor
            </Typography>

            <Typography variant="body2">{row.doctor_name ?? "—"}</Typography>
          </Box>

          {row.specialty_name && (
            <Box>
              <Chip
                size="small"
                label={row.specialty_name}
                variant="outlined"
                /*sx={{
                  bgcolor: row.specialty_color || "primary.main",
                  color: "#fff",
                  fontWeight: 500,
                }}*/
              />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pt: 0.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Costo
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {isMulti ? "—" : fmtMoney(row.total)}
              </Typography>
            </Box>

            {!isMulti && (
              <Chip
                size="small"
                color={hasDebt ? "error" : "success"}
                variant="outlined"
                label={hasDebt ? `Debe ${fmtMoney(row.balance)}` : "Pagado"}
              />
            )}
          </Box>

          {row.notes && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {row.notes}
            </Typography>
          )}
        </Stack>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1.5,
          }}
        >
          <Button
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={() => onView(row.patient_id)}
          >
            Ver ficha
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

const EMPTY_FILTERS = {
  search: "",
  status: "all",
  treatment_id: "",
  dateFrom: "",
  dateTo: "",
};

export default function HistoryPage() {
  const navigate = useNavigate();

  const { isMobile } = useBreakpoint();

  const { treatments, fetchAll } = useCatalogStore();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [localFilters, setLocalFilters] = useState(EMPTY_FILTERS);

  const { handleExcel, handlePdf } = useHistoryExport(filters);

  const setF = (k) => (v) =>
    setFilters((p) => ({
      ...p,
      [k]: v,
    }));

  const setLocal = (k) => (v) =>
    setLocalFilters((p) => ({
      ...p,
      [k]: v,
    }));

  useEffect(() => {
    fetchAll();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("appointments_full")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(from, to);

    if (filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.treatment_id) {
      query = query.eq("treatment_id", filters.treatment_id);
    }

    if (filters.search.trim()) {
      query = query.or(
        "patient_name.ilike.%" +
          filters.search +
          "%,patient_dni.ilike.%" +
          filters.search +
          "%,doctor_name.ilike.%" +
          filters.search +
          "%",
      );
    }

    if (filters.dateFrom) {
      query = query.gte("date", new Date(filters.dateFrom).toISOString());
    }

    if (filters.dateTo) {
      const d = new Date(filters.dateTo);

      d.setHours(23, 59, 59);

      query = query.lte("date", d.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      setError(error.message);
    } else {
      setRows(data ?? []);
      setTotal(count ?? 0);
    }

    setLoading(false);
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const applyFilters = () => {
    setFilters({ ...localFilters });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = [
    !!filters.search,
    filters.status !== "all",
    !!filters.treatment_id,
    !!filters.dateFrom,
    !!filters.dateTo,
  ].filter(Boolean).length;

  const attendedCount = rows.filter((r) => r.status === "atendido").length;

  const pendingCount = rows.filter((r) => r.status === "pendiente").length;

  const cancelledCount = rows.filter((r) => r.status === "cancelado").length;

  const filterFields = (f, set) => (
    <>
      <TextField
        label="Paciente, DNI o doctor"
        size="small"
        fullWidth
        value={f.search}
        onChange={(e) => set("search")(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        select
        label="Estado"
        size="small"
        fullWidth
        value={f.status}
        onChange={(e) => set("status")(e.target.value)}
      >
        <MenuItem value="all">Todos</MenuItem>

        <MenuItem value="pendiente">Pendiente</MenuItem>

        <MenuItem value="atendido">Atendido</MenuItem>

        <MenuItem value="cancelado">Cancelado</MenuItem>
      </TextField>

      <TextField
        select
        label="Tratamiento"
        size="small"
        fullWidth
        value={f.treatment_id}
        onChange={(e) => set("treatment_id")(e.target.value)}
      >
        <MenuItem value="">Todos</MenuItem>

        {treatments.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Desde"
        type="date"
        size="small"
        fullWidth
        slotProps={{
          inputLabel: { shrink: true },
        }}
        value={f.dateFrom}
        onChange={(e) => set("dateFrom")(e.target.value)}
      />

      <TextField
        label="Hasta"
        type="date"
        size="small"
        fullWidth
        slotProps={{
          inputLabel: { shrink: true },
        }}
        value={f.dateTo}
        onChange={(e) => set("dateTo")(e.target.value)}
      />
    </>
  );

  return (
    <Box>
      <PageHeader
        title="Historial clínico"
        subtitle={`${total} registro${total !== 1 ? "s" : ""}`}
        actions={
          <ExportMenu
            onExcelExport={handleExcel}
            onPdfExport={handlePdf}
            totalRows={total}
            disabled={loading}
          />
        }
      />

      {/* KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Atendidas
              </Typography>

              <Typography
                variant="h6"
                color="success.main"
                sx={{ fontWeight: 700 }}
              >
                {attendedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pendientes
              </Typography>

              <Typography
                variant="h6"
                color="warning.main"
                sx={{ fontWeight: 700 }}
              >
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Canceladas
              </Typography>

              <Typography
                variant="h6"
                color="error.main"
                sx={{ fontWeight: 700 }}
              >
                {cancelledCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      {!isMobile && (
        <Card variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Paciente, DNI o doctor..."
                  value={filters.search}
                  onChange={(e) => setF("search")(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  select
                  label="Estado"
                  size="small"
                  fullWidth
                  value={filters.status}
                  onChange={(e) => setF("status")(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>

                  <MenuItem value="pendiente">Pendiente</MenuItem>

                  <MenuItem value="atendido">Atendido</MenuItem>

                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  select
                  label="Tratamiento"
                  size="small"
                  fullWidth
                  value={filters.treatment_id}
                  onChange={(e) => setF("treatment_id")(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>

                  {treatments.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  fullWidth
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  value={filters.dateFrom}
                  onChange={(e) => setF("dateFrom")(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  fullWidth
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  value={filters.dateTo}
                  onChange={(e) => setF("dateTo")(e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <FilterButton
            onClick={() => {
              setLocalFilters({
                ...filters,
              });

              setFilterOpen(true);
            }}
            activeCount={activeFilterCount}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {isMobile ? (
            <Box>
              {rows.length === 0 ? (
                <Typography
                  color="text.secondary"
                  mt={4}
                  sx={{
                    textAlign: "center",
                  }}
                >
                  No se encontraron registros
                </Typography>
              ) : (
                rows.map((r) => (
                  <HistoryCard
                    key={r.id}
                    row={r}
                    onView={(id) => navigate("/patients/" + id)}
                  />
                ))
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>

                    <TableCell>Tratamiento</TableCell>

                    <TableCell>Fecha</TableCell>

                    <TableCell>Tipo</TableCell>

                    <TableCell>Pago</TableCell>

                    <TableCell>Estado</TableCell>

                    <TableCell align="right">Ficha</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 5,
                          color: "text.secondary",
                        }}
                      >
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.map((r) => {
                    const hasDebt = Number(r.balance) > 0;

                    const isMulti = !!r.case_id;

                    return (
                      <TableRow
                        key={r.id}
                        hover
                        onClick={() => navigate("/patients/" + r.patient_id)}
                        sx={{
                          cursor: "pointer",
                          transition: "0.15s",
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        {/* Paciente */}
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                            }}
                          >
                            {/* <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                              }}
                            >
                              {r.patient_name?.[0] ?? "P"}
                            </Avatar> */}

                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                }}
                              >
                                {r.patient_name}
                              </Typography>

                              {r.patient_dni && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  DNI: {r.patient_dni}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Tratamiento */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                            }}
                          >
                            {r.treatment_name ?? "—"}
                          </Typography>

                          {r.specialty_name && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {r.specialty_name}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <Typography variant="body2">{fmt(r.date)}</Typography>
                        </TableCell>

                        {/* Tipo */}
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={isMulti ? "primary" : "default"}
                            label={isMulti ? "Multisesión" : "Única"}
                          />
                        </TableCell>

                        {/* Pago */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {isMulti ? "—" : fmtMoney(r.total)}
                          </Typography>

                          {!isMulti && (
                            <Chip
                              size="small"
                              color={hasDebt ? "error" : "success"}
                              variant="outlined"
                              label={
                                hasDebt
                                  ? `Debe ${fmtMoney(r.balance)}`
                                  : "Pagado"
                              }
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <Chip
                            label={r.status}
                            color={STATUS_COLOR[r.status] ?? "default"}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>

                        {/* Acción */}
                        <TableCell align="right">
                          <Button
                            size="small"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();

                              navigate("/patients/" + r.patient_id);
                            }}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setPageSize(ps);
              setPage(1);
            }}
          />
        </>
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      >
        {filterFields(localFilters, setLocal)}
      </FilterDrawer>
    </Box>
  );
}
