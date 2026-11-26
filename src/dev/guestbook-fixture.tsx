import { useMemo, useState } from 'react'

import { SiteFooter } from '#/components/site-footer'
import { Button } from '#/components/ui/button'

import { GuestbookPile } from './guestbook-pile'
import { wallPlaces } from './guestbook-places'
import { fakeArrivals, stampRecords } from './guestbook-wall'
import type { Arrival } from './guestbook-wall'

// The Guestbook's pile (guestbook-pile.tsx) with made-up visitors, at any count: the newest
// stamps lie on top where every name shows, the older ones pack tighter as they sink, and the
// foot of the pile darkens and blurs into the footer. The visitor's own stamp lies at the top in
// the middle, marked "you!": at first the newest, or the one Stamp adds. Others visit adds eight
// visitors after them, as a visitor coming back later finds the pile: theirs still on top, the
// rest fresh.

const counts = [12, 60, 300, 1500] as const

/** `arrivals` numbered again among their places' visitors, a visitor every six hours. */
function inOrder(arrivals: readonly Arrival[]): Arrival[] {
  const seen = new Map<string, number>()
  const start = Date.UTC(2026, 0, 1)
  return arrivals.map((arrival, index) => {
    const ordinal = seen.get(arrival.place.key) ?? 0
    seen.set(arrival.place.key, ordinal + 1)
    const day = new Date(start + index * 6 * 3_600_000)
    return {
      place: arrival.place,
      ordinal,
      date: { day: day.getUTCDate(), month: day.getUTCMonth(), year: day.getUTCFullYear() },
    }
  })
}

export function GuestbookFixture() {
  const [count, setCount] = useState<(typeof counts)[number]>(60)
  const [later, setLater] = useState<Arrival[]>([])
  // The visitor's own stamp, by its place in the Guestbook; until they stamp, the newest.
  const [you, setYou] = useState<number>()
  const [placeKey, setPlaceKey] = useState(wallPlaces[0]?.place.key ?? '')

  const arrivals = useMemo(
    () => inOrder([...fakeArrivals(count, wallPlaces), ...later]),
    [count, later],
  )
  const records = useMemo(() => stampRecords(arrivals), [arrivals])
  const yours = you ?? records.length - 1

  function stampVisitor() {
    const chosen = wallPlaces.find(({ place }) => place.key === placeKey)
    if (!chosen) return
    setYou(arrivals.length)
    setLater((current) => [
      ...current,
      { place: chosen.place, ordinal: 0, date: { day: 1, month: 0, year: 2026 } },
    ])
  }

  function othersVisit() {
    setYou(yours)
    setLater((current) => [...current, ...fakeArrivals(8, wallPlaces, `later:${current.length}`)])
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-1">
        <h1 className="text-display font-medium">Guestbook pile</h1>
        <p className="text-body text-muted-foreground">
          The Guestbook as a pile of postmarks under the footer. Each visitor&apos;s stamp is saved
          as it was dealt the day they arrived. The newest lie on top, spread out enough that every
          name shows; older ones pack tighter as they sink, and the pile&apos;s foot darkens and
          blurs into the footer. A stamp keeps its place across the page for good and only sinks.
          Your own stamp lies at the top in the middle, marked &ldquo;you!&rdquo;, however long ago
          you first came: Others visit adds eight visitors after you, as coming back later would.
          The homepage shows it too, with 60 visitors or <code>?guestbook=</code> as many, and
          <code>?you=</code> pins an older stamp as yours.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <fieldset className="flex gap-1">
          <legend className="sr-only">Visitors</legend>
          {counts.map((option) => (
            <Button
              key={option}
              size="compact"
              variant={option === count ? 'secondary' : 'ghost'}
              aria-pressed={option === count}
              onClick={() => {
                setCount(option)
                setLater([])
                setYou(undefined)
              }}
            >
              {`${option.toLocaleString('en')} visitors`}
            </Button>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          A new visitor from
          <select
            className="h-8 rounded-full border border-border bg-surface-1 px-3 text-body text-foreground"
            value={placeKey}
            onChange={(event) => setPlaceKey(event.target.value)}
          >
            {wallPlaces.map(({ place }) => (
              <option key={place.key} value={place.key}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <Button size="compact" onClick={stampVisitor}>
          Stamp
        </Button>
        <Button size="compact" variant="secondary" onClick={othersVisit}>
          Others visit
        </Button>
      </div>

      <GuestbookPile
        records={records}

        you={yours}
        bleed={false}
        className="mt-16"
      >
        <SiteFooter className="mt-0 pb-3" />
      </GuestbookPile>
    </div>
  )
}
