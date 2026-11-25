import { useSyncExternalStore } from 'react'

import type { AmbientSettings } from '#/lib/ambient-settings'

// Query overrides for the capture pages (/dev/og, /dev/story), so tools can tune them without
// editing a fixture: light., blinds. and foliage.<key>=<number>, such as foliage.scale=0.7.

const serverQuery = new URLSearchParams()
let clientQuery: URLSearchParams | undefined
const noChanges = () => () => {}

/**
 * The page's query. The server renders without it and the client reads it after hydration,
 * which would otherwise keep the server's attributes.
 */
export function useTuningQuery() {
  return useSyncExternalStore(
    noChanges,
    () => (clientQuery ??= new URLSearchParams(location.search)),
    () => serverQuery,
  )
}

/** `key` from the query as a number, or `fallback` without it. */
export function tunedNumber(query: URLSearchParams, key: string, fallback: number) {
  return query.has(key) ? Number(query.get(key)) : fallback
}

/** `settings` with the query's light., blinds. and foliage. overrides. */
export function tunedSettings(settings: AmbientSettings, query: URLSearchParams): AmbientSettings {
  const tuned = structuredClone(settings)
  const groups = Object.entries({
    light: tuned.light,
    blinds: tuned.blinds,
    foliage: tuned.foliage,
  })
  for (const [key, value] of query) {
    const [group, name = ''] = key.split('.')
    const values = groups.find(([named]) => named === group)?.[1]
    if (values && name in values) Reflect.set(values, name, Number(value))
  }
  return tuned
}
