import { useSyncExternalStore } from 'react'

import type { LedgerStats, Pile } from '#/lib/postmark-ledger'

// The page's side of the postmark ledger (src/lib/postmark-api.ts), as stores for
// useSyncExternalStore. The homepage subscribes as it opens (PostmarkStamp), so the pile is
// looked at then and the visitor is stamped on their first move of the mouse, click, key,
// wheel or touch anywhere on the page, however far they scroll. It takes an action as the
// browser reports it rather than as a script sends it, so a page that only loads stamps no one.
// With the dev tools, once they have a stamp, their tab checks in every minute it shows, and as it
// comes back into view, for the online count.

const checkInEvery = 60_000
const actions = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const
// A stamp that fails (the network, or the ledger) is asked for again on a later action, a few
// seconds on, a few times at most.
const retryAfter = 5000
const attempts = 3

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
  return withOutlines((await response.json()) as Pile)
}

/** The pile with each newest stamp's place outline back in it, from the pile's `outlines`. */
export function withOutlines(pile: Pile): Pile {
  return {
    ...pile,
    newest: pile.newest.map((record) => {
      const outline = pile.outlines[record.place.key]
      return outline ? { ...record, place: { ...record.place, outline } } : record
    }),
  }
}

function checkIn() {
  if (document.visibilityState !== 'visible') return
  void fetch('/api/postmarks/here', { method: 'POST' }).catch(() => {})
}

let stamping = false
let failures = 0
let retryAt = 0

function stopListening() {
  for (const action of actions) window.removeEventListener(action, stampOnAction, true)
}

function stampOnAction(event: Event) {
  if (!event.isTrusted || stamping || performance.now() < retryAt) return
  stamping = true
  void ask('POST')
    .then((found) => {
      if (!found) throw new Error('The ledger answered no pile')
      stopListening()
      publish(found)
      // The online count is the dev fixture's, so only the dev tools check in.
      if (!import.meta.env.DEV_TOOLS || !found.you) return
      // For as long as the page is open.
      checkIn()
      setInterval(checkIn, checkInEvery)
      document.addEventListener('visibilitychange', checkIn)
    })
    .catch(() => {
      failures += 1
      if (failures >= attempts) stopListening()
      else retryAt = performance.now() + retryAfter
    })
    .finally(() => {
      stamping = false
    })
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

const unchanged = () => undefined

/** Starts the ledger as the page opens: looks at the pile, and stamps on the first action. */
export function PostmarkStamp() {
  // Subscribing is what starts it; the snapshot never changes, so this never renders again.
  useSyncExternalStore(subscribePile, unchanged, unchanged)
  return null
}

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
