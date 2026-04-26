import { useTheme, useMediaQuery } from '@mui/material'

/**
 * Hook centralizado para breakpoints responsive.
 * Úsalo en cualquier componente para adaptar el layout.
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useBreakpoint()
 */
export function useBreakpoint() {
  const theme = useTheme()

  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'))   // < 600px
  const isTablet  = useMediaQuery(theme.breakpoints.between('sm', 'md')) // 600-900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))     // >= 900px
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')) // < 900px

  return { isMobile, isTablet, isDesktop, isSmallScreen }
}