import { useMemo, useState, useSyncExternalStore } from 'react'

import { Button } from '#/components/ui/button'
import { currentStats, subscribeStats } from '#/lib/postmark-client'

import { PostmarkPile } from './postmark-pile'
import { visitorPlaces } from './postmark-visitor-places'
import { fakeArrivals, stampRecords } from './postmark-visits'
import type { Arrival } from './postmark-visits'

// The postmark footer's pile (postmark-pile.tsx) with made-up visitors, at any count: the newest
// stamps lie on top where every name shows, the older ones pack tighter as they sink, and the
// foot of the pile darkens and blurs. The visitor's own stamp lies at the top in the middle,
// marked "thanks for visiting!": at first the newest, or the one Stamp adds. Others visit adds
// eight visitors after them, as a visitor coming back later finds the pile: theirs still on top,
// the rest fresh. Shuffle shows another day: other visitors, and however many had come by then.
// Above them, the ledger's live counts (src/lib/postmark-ledger.ts), which the site doesn't show.

const counts = [12, 60, 300, 1500] as const
// Shuffle's days run from this many visitors in to this many, evenly on a log scale, so a young
// pile turns up as often as a full one.
const shuffled = { fewest: 8, most: 600 }

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

export function PostmarkFooterFixture() {
  const [count, setCount] = useState(60)
  // Who the made-up visitors are: the same list until Shuffle.
  const [seed, setSeed] = useState('wall')
  const [later, setLater] = useState<Arrival[]>([])
  // The visitor's own stamp, by its place among the visitors; until they stamp, the newest.
  const [you, setYou] = useState<number>()
  const [placeKey, setPlaceKey] = useState(visitorPlaces[0]?.place.key ?? '')

  const arrivals = useMemo(
    () => inOrder([...fakeArrivals(count, visitorPlaces, seed), ...later]),
    [count, seed, later],
  )
  const records = useMemo(() => stampRecords(arrivals), [arrivals])
  const yours = you ?? records.length - 1
  const newest = records.at(-1)
  const stats = useSyncExternalStore(subscribeStats, currentStats, () => undefined)

  function stampVisitor() {
    const chosen = visitorPlaces.find(({ place }) => place.key === placeKey)
    if (!chosen) return
    setYou(arrivals.length)
    setLater((current) => [
      ...current,
      { place: chosen.place, ordinal: 0, date: { day: 1, month: 0, year: 2026 } },
    ])
  }

  function shuffle() {
    const { fewest, most } = shuffled
    setSeed(`shuffle:${Math.random()}`)
    setCount(Math.round(fewest * (most / fewest) ** Math.random()))
    setLater([])
    setYou(undefined)
  }

  function othersVisit() {
    setYou(yours)
    setLater((current) => [
      ...current,
      ...fakeArrivals(8, visitorPlaces, `later:${current.length}`),
    ])
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-1">
        <h1 className="text-display font-medium">Postmark footer</h1>
        <p className="text-body text-muted-foreground">
          The page&apos;s footer as a pile of visitors&apos; postmarks. Each visitor&apos;s stamp is
          saved as it was dealt the day they arrived. The newest lie on top, spread out enough that
          every name shows; older ones pack tighter as they sink, and the pile&apos;s foot darkens
          and blurs. A stamp keeps its place across the page for good and only sinks. Your own stamp
          lies at the top in the middle, marked &ldquo;thanks for visiting!&rdquo;, however long ago
          you first came: Others visit adds eight visitors after you, as coming back later would.
          Shuffle shows another day, with other visitors. The homepage shows the live ledger: real
          visitors&apos; stamps over 60 made-up ones, which they bury as they come.{' '}
          <code>?postmarks=</code> shows that many made-up visitors there instead, and{' '}
          <code>?you=</code> pins one of them as yours.
        </p>
      </header>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-caption text-muted-foreground tabular-nums">
        {stats ? (
          (
            [
              ['Visitors', stats.visitors],
              ['Visits', stats.visits],
              ['Returning', stats.returning],
              ['New today', stats.newToday],
              ['Places', stats.places],
              ['Countries', stats.countries],
              ['Online', stats.online],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt>{label}</dt>
              <dd className="text-foreground">{value.toLocaleString('en')}</dd>
            </div>
          ))
        ) : (
          <div>The ledger isn&apos;t running here.</div>
        )}
      </dl>

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
            {visitorPlaces.map(({ place }) => (
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
        <Button size="compact" variant="secondary" onClick={shuffle}>
          Shuffle
        </Button>
        <p className="min-h-8 content-center text-caption text-muted-foreground tabular-nums">
          {newest &&
            `${records.length.toLocaleString('en')} visitors by ${new Date(
              Date.UTC(newest.date.year, newest.date.month, newest.date.day),
            ).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
            })}`}
        </p>
      </div>

      <PostmarkPile
        records={records}

        you={yours}
        bleed={false}
        className="mt-16"
      />
    </div>
  )
}
