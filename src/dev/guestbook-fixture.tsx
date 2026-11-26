import { useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import { useMediaQuery } from '#/lib/media-query'

import { wallPlaces } from './guestbook-places'
import { fakeArrivals, fillPages, page } from './guestbook-wall'
import type { Arrival, StampRecord } from './guestbook-wall'
import { Postmark } from './postmark'

// The Guestbook wall as one shared passport (guestbook-wall.ts): made-up visitors' stamps, saved
// as they arrived, fill its pages in order, and it opens on the newest. A phone shows one page,
// a wider screen the open spread. Only the open pages render, so the wall stays as fast at 1,500
// visitors as at 12.

const counts = [12, 60, 300, 1500] as const

// How wide a stamp's 220-unit round postmark shows on a page about 440 px wide: it only sets the
// ink speckle's grain, since the page sizes the stamps.
const speckleSize = 150

function PassportPage({
  number,
  stamps,
  yours,
  side,
}: {
  number: number
  stamps: readonly StampRecord[]
  yours: ReadonlySet<number>
  side: 'left' | 'right' | 'single'
}) {
  return (
    <div
      data-page={number}
      className={`relative isolate aspect-[88/125] w-full overflow-hidden bg-surface-2 ${
        side === 'left'
          ? 'rounded-l-2xl border-r border-border'
          : side === 'right'
            ? 'rounded-r-2xl'
            : 'rounded-2xl'
      }`}
    >
      {stamps.map((stamp) => (
        <Postmark
          key={stamp.index}
          place={stamp.place}
          visitor={stamp.ordinal}
          deal={stamp.deal}
          print={stamp.print}
          size={speckleSize}
          className={`absolute mix-blend-multiply dark:mix-blend-screen ${
            yours.has(stamp.index)
              ? 'outline-2 outline-offset-4 outline-foreground/50 outline-dashed'
              : ''
          }`}
          style={{
            left: `${(stamp.x / page.width) * 100}%`,
            top: `${(stamp.y / page.height) * 100}%`,
            width: `${(stamp.width / page.width) * 100}%`,
            height: 'auto',
            translate: '-50% -50%',
          }}
        />
      ))}
      <span className="absolute inset-x-0 bottom-2 text-center text-caption text-muted-foreground tabular-nums">
        {number + 1}
      </span>
    </div>
  )
}

export function GuestbookFixture() {
  const [count, setCount] = useState<(typeof counts)[number]>(60)
  const [stamped, setStamped] = useState<Arrival[]>([])
  const [placeKey, setPlaceKey] = useState(wallPlaces[0]?.place.key ?? '')
  // The open spread's first page, or undefined for the newest.
  const [opened, setOpened] = useState<number>()

  const arrivals = useMemo(() => [...fakeArrivals(count, wallPlaces), ...stamped], [count, stamped])
  const records = useMemo(() => fillPages(arrivals), [arrivals])
  const pageCount = (records.at(-1)?.page ?? 0) + 1
  const byPage = useMemo(() => {
    const pages = Array.from({ length: pageCount }, (): StampRecord[] => [])
    for (const record of records) pages[record.page]?.push(record)
    return pages
  }, [records, pageCount])
  const yours = useMemo(
    () => new Set(records.slice(records.length - stamped.length).map((record) => record.index)),
    [records, stamped.length],
  )

  // Spreads pair pages 1 and 2, 3 and 4, ...: the newest page and the one beside it. A wider
  // screen turns a spread at a time, a phone a page.
  const wide = useMediaQuery('(min-width: 40rem)')
  const turn = wide ? 2 : 1
  const newest = pageCount - 1
  const shown = Math.min(opened ?? newest, newest)
  const left = shown - (shown % 2)
  const spread = [left, left + 1] as const

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
    setOpened(undefined)
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="max-w-3xl space-y-1">
        <h1 className="text-display font-medium">Guestbook wall</h1>
        <p className="text-body text-muted-foreground">
          The wall as one shared passport. Each visitor&apos;s stamp is saved as it was dealt the
          day they arrived, with where it landed: stamps fill a page as passport stamps do,
          overlapping a little at the angle they were pressed, and a full page opens the next. It
          opens on the newest page; a phone shows one page, a wider screen the spread.
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
                setOpened(undefined)
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

      <section aria-label="Guestbook passport" className="mx-auto max-w-4xl space-y-4">
        <p className="text-body text-muted-foreground tabular-nums">
          {`${records.length.toLocaleString('en')} stamps on ${pageCount} pages, about ${(records.length / pageCount).toFixed(1)} a page`}
        </p>
        {/* A phone shows the newest of the two pages; a wider screen shows both. */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {spread.map((number, index) => {
            const side = index === 0 ? 'left' : 'right'
            const hiddenOnPhone = number !== shown ? 'max-sm:hidden' : ''
            return (
              <div key={number} className={hiddenOnPhone}>
                <PassportPage
                  number={number}
                  stamps={byPage[number] ?? []}
                  yours={yours}
                  side={side}
                />
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="compact"
            variant="secondary"
            disabled={(wide ? left : shown) === 0}
            onClick={() => setOpened(Math.max(0, (wide ? left : shown) - turn))}
          >
            Earlier
          </Button>
          <Button
            size="compact"
            variant="secondary"
            disabled={(wide ? left + 1 : shown) >= newest}
            onClick={() => {
              const next = (wide ? left : shown) + turn
              setOpened(next >= newest ? undefined : next)
            }}
          >
            Later
          </Button>
          <input
            type="range"
            min={0}
            max={newest}
            value={shown}
            aria-label="Page"
            className="min-w-40 flex-1 accent-foreground"
            onChange={(event) => {
              const value = Number(event.target.value)
              setOpened(value >= newest ? undefined : value)
            }}
          />
          <span className="text-body text-muted-foreground tabular-nums">
            {`Page ${shown + 1} of ${pageCount}`}
          </span>
        </div>
      </section>
    </div>
  )
}
