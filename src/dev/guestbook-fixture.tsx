import { useMemo, useState } from 'react'

import { SiteFooter } from '#/components/site-footer'
import { Button } from '#/components/ui/button'

import { GuestbookPile } from './guestbook-pile'
import { wallPlaces } from './guestbook-places'
import { fakeArrivals, stampRecords } from './guestbook-wall'
import type { Arrival } from './guestbook-wall'

// The Guestbook's pile (guestbook-pile.tsx) with made-up visitors, at any count: the newest
// stamps lie on top where every name shows, the older ones pack tighter as they sink, and the
// foot of the pile darkens and blurs into the footer. Stamp adds a visitor on top, and every
// stamp below sinks a little.

const counts = [12, 60, 300, 1500] as const

export function GuestbookFixture() {
  const [count, setCount] = useState<(typeof counts)[number]>(60)
  const [stamped, setStamped] = useState<Arrival[]>([])
  const [placeKey, setPlaceKey] = useState(wallPlaces[0]?.place.key ?? '')

  const arrivals = useMemo(() => [...fakeArrivals(count, wallPlaces), ...stamped], [count, stamped])
  const records = useMemo(() => stampRecords(arrivals), [arrivals])
  const yours = useMemo(
    () => new Set(records.slice(records.length - stamped.length).map((record) => record.index)),
    [records, stamped.length],
  )

  function stampVisitor() {
    const chosen = wallPlaces.find(({ place }) => place.key === placeKey)
    if (!chosen) return
    const ordinal = arrivals.filter((arrival) => arrival.place.key === chosen.place.key).length
    const today = new Date(Date.UTC(2026, 0, 1) + arrivals.length * 6 * 3_600_000)
    setStamped((current) => [
      ...current,
      {
        place: chosen.place,
        ordinal,
        date: { day: today.getUTCDate(), month: today.getUTCMonth(), year: today.getUTCFullYear() },
      },
    ])
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
          The homepage shows it too, with 60 visitors or <code>?guestbook=</code> as many.
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
                setStamped([])
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
      </div>

      <GuestbookPile
        records={records}

        yours={yours}
        bleed={false}
        className="mt-16"
      >
        <SiteFooter className="mt-0 pb-3" />
      </GuestbookPile>
    </div>
  )
}
