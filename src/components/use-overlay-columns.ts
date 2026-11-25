import { useSyncExternalStore } from 'react'

const wideQuery = '(min-width: 40rem)'

function subscribeWide(change: () => void) {
  const query = matchMedia(wideQuery)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}

/**
 * The See more overlay's columns: four, or two below sm, where four would leave thumbnails. The
 * tile is a grid as wide, whose cells lead them (src/components/gallery-overlay.tsx).
 */
export function useOverlayColumns() {
  return useSyncExternalStore(
    subscribeWide,
    () => (matchMedia(wideQuery).matches ? 4 : 2),
    () => 4,
  )
}
