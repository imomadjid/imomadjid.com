import { useSyncExternalStore } from 'react'

import { sleepPath } from './sleep-focus'
import type { SleepState } from './sleep-focus'

// Whether Imo is asleep, for the homepage avatar: read once subscribed, again whenever the tab
// comes back into view, and every minute while it's in view, so a phone turning Sleep Focus on or
// off reaches an open page within a minute.

const pollEvery = 60_000

let asleep = false
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

async function refresh() {
  try {
    const response = await fetch(sleepPath, { cache: 'no-store' })
    if (!response.ok) return
    // SAFETY: a 200 from /api/sleep is a SleepState (src/lib/sleep-focus.ts).
    const next = ((await response.json()) as SleepState).asleep === true
    if (next === asleep) return
    asleep = next
    for (const listener of listeners) listener()
  } catch {
    // Offline or the request failed: keep what we had, and try again on the next poll.
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') void refresh()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refresh()
    document.addEventListener('visibilitychange', onVisibility)
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, pollEvery)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size) return
    document.removeEventListener('visibilitychange', onVisibility)
    clearInterval(timer)
  }
}

/** Whether Imo's phone is in its Sleep Focus; false on the server and until the first answer. */
export function useSleepFocus() {
  return useSyncExternalStore(
    subscribe,
    () => asleep,
    () => false,
  )
}
