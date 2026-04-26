import { Box, Pagination, Typography, MenuItem, Select, FormControl } from '@mui/material'

/**
 * Paginación reutilizable con selector de filas por página.
 *
 * @example
 * <TablePagination
 *   total={120}
 *   page={page}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 * />
 */
export default function TablePagination({
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1.5,
      mt: 2,
      px: { xs: 0, sm: 1 },
    }}>
      {/* Info de registros */}
      <Typography variant="caption" color="text.secondary">
        {total === 0
          ? 'Sin registros'
          : `${from}–${to} de ${total} registro${total !== 1 ? 's' : ''}`}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Selector de filas por página */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Filas:
          </Typography>
          <FormControl size="small" variant="outlined">
            <Select
              value={pageSize}
              onChange={e => { onPageSizeChange?.(Number(e.target.value)); onPageChange?.(1) }}
              sx={{ fontSize: 13, height: 28, '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
            >
              {pageSizeOptions.map(opt => (
                <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Paginación */}
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, p) => onPageChange?.(p)}
          size="small"
          siblingCount={0}
          boundaryCount={1}
          shape="rounded"
          sx={{
            '& .MuiPaginationItem-root': { fontSize: 12, minWidth: 28, height: 28 },
          }}
        />
      </Box>
    </Box>
  )
}