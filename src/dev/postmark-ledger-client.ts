import type { LedgerStats, Pile } from '#/lib/postmark-ledger'

// The page's side of the postmark ledger (src/lib/postmark-api.ts), as stores for
// useSyncExternalStore. The pile is looked at once something subscribes, and the visitor is
// stamped on their first click, key, wheel or touch, as the browser reports it rather than as a
// script sends it, so a page that only loads stamps no one. Once they have a stamp, their tab
// checks in every minute it shows, and as it comes back into view, for the online count.

const checkInEvery = 60_000
const actions = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

let pile: Pile | undefined
let started = false
const listeners = new Set<() => void>()

function publish(next: Pile) {
  pile = next
  for (const listener of listeners) listener()
}

async function ask(method: 'GET' | 'POST') {
  const response = await fetch('/api/postmarks', {
    method,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return undefined
  // SAFETY: the ledger's API answers a Pile (src/lib/postmark-api.ts).
  return (await response.json()) as Pile
}

function checkIn() {
  if (document.visibilityState !== 'visible') return
  void fetch('/api/postmarks/here', { method: 'POST' }).catch(() => {})
}

function stampOnAction(event: Event) {
  if (!event.isTrusted) return
  for (const action of actions) window.removeEventListener(action, stampOnAction, true)
  void ask('POST')
    .then((found) => {
      if (!found) return
      publish(found)
      if (!found.you) return
      // For as long as the page is open.
      checkIn()
      setInterval(checkIn, checkInEvery)
      document.addEventListener('visibilitychange', checkIn)
    })
    .catch(() => {})
}

function start() {
  if (started) return
  started = true
  void ask('GET')
    .then((found) => {
      // A stamp that came back first is newer.
      if (found && !pile) publish(found)
    })
    .catch(() => {})
  for (const action of actions)
    window.addEventListener(action, stampOnAction, { capture: true, passive: true })
}

export function subscribePile(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
  }
}

export const currentPile = () => pile

// The ledger's counts, read every few seconds while something shows them.
const statsEvery = 5000
let stats: LedgerStats | undefined
let statsTimer: ReturnType<typeof setInterval> | undefined
const statsListeners = new Set<() => void>()

function readStats() {
  void fetch('/api/postmarks/stats')
    .then(async (response) =>
      // SAFETY: the ledger's API answers its stats (src/lib/postmark-api.ts).
      response.ok ? ((await response.json()) as LedgerStats) : undefined,
    )
    .then((next) => {
      stats = next
      for (const listener of statsListeners) listener()
    })
    .catch(() => {})
}

export function subscribeStats(listener: () => void) {
  statsListeners.add(listener)
  if (!statsTimer) {
    readStats()
    statsTimer = setInterval(readStats, statsEvery)
  }
  return () => {
    statsListeners.delete(listener)
    if (statsListeners.size > 0) return
    clearInterval(statsTimer)
    statsTimer = undefined
  }
}

export const currentStats = () => stats
