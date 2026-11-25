import { useMediaQuery } from '#/lib/media-query'

/**
 * The See more overlay's columns: four, or two below sm, where four would leave thumbnails. The
 * tile is a grid as wide, whose cells lead them (src/components/gallery-overlay.tsx).
 */
export function useOverlayColumns() {
  return useMediaQuery('(min-width: 40rem)', true) ? 4 : 2
}
