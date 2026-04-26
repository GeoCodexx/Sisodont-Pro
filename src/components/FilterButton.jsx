import { Badge, Button } from '@mui/material'
import FilterIcon from '@mui/icons-material/FilterList'

/**
 * Botón que abre el FilterDrawer en móvil.
 * Muestra un badge con la cantidad de filtros activos.
 */
export default function FilterButton({ onClick, activeCount = 0, label = 'Filtros' }) {
  return (
    <Badge badgeContent={activeCount} color="primary" overlap="circular">
      <Button
        variant="outlined"
        startIcon={<FilterIcon />}
        onClick={onClick}
        size="small"
        sx={{ whiteSpace: 'nowrap' }}
      >
        {label}
      </Button>
    </Badge>
  )
}