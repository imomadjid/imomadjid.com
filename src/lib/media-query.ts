import { useCallback, useSyncExternalStore } from 'react'

/** A touch screen's primary pointer, as Tailwind's `pointer-coarse` variant matches it. */
export const coarsePointerQuery = '(pointer: coarse)'

/** Whether `query` matches, following its changes; `serverValue` until hydration. */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (change: () => void) => {
      const list = matchMedia(query)
      list.addEventListener('change', change)
      return () => list.removeEventListener('change', change)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => serverValue,
  )
}
