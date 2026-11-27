import { useCallback, useMemo, useState } from 'react'

import { ProfileAvatar } from '#/components/profile-avatar'
import type { SleepFlight } from '#/components/sleep-flight'
import { flightPose } from '#/components/sleep-flight'

// How many recent Z's the path overlay keeps, newest drawn strongest.
const keptFlights = 6

// The stage, in px before zooming: the avatar sits near its bottom left, with room above and to
// the right for the farthest Z (about 70 px up and 50 px across from the avatar's centre).
const stage = { width: 170, height: 150, avatarX: 48, avatarY: 110 }

function FlightPaths({ flights }: { flights: SleepFlight[] }) {
  // Each path samples its flight while the Z is visible, from the avatar's centre.
  const paths = useMemo(
    () =>
      flights.map((flight) => {
        const points: string[] = []
        for (let step = 0; step <= 60; step++) {
          const pose = flightPose(flight, step / 60)
          if (pose.opacity > 0.05) points.push(`${pose.x.toFixed(2)},${pose.y.toFixed(2)}`)
        }
        return { id: flight.start, points: points.join(' ') }
      }),
    [flights],
  )
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-muted-foreground"
      viewBox={`${-stage.avatarX} ${-stage.avatarY} ${stage.width} ${stage.height}`}
    >
      {paths.map(({ id, points }, age) => (
        <polyline
          key={id}
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.6}
          strokeLinecap="round"
          strokeDasharray="1.5 1.5"
          opacity={0.2 + (0.6 * (age + 1)) / paths.length}
        />
      ))}
    </svg>
  )
}

export function SleepFixture() {
  const [asleep, setAsleep] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [zoom, setZoom] = useState(3)
  const [showPaths, setShowPaths] = useState(true)
  const [flights, setFlights] = useState<SleepFlight[]>([])
  const onFlight = useCallback(
    (flight: SleepFlight) => setFlights((kept) => [...kept.slice(1 - keptFlights), flight]),
    [],
  )
  const tuning = useMemo(() => ({ speed, onFlight }), [speed, onFlight])
  const last = flights.at(-1)
  const gap =
    flights.length > 1 && last ? (last.start - flights[flights.length - 2].start) * speed : null

  return (
    <div className="max-w-5xl space-y-10">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Sleep</h1>
        <p className="text-body text-muted-foreground">
          The homepage avatar while Imo’s phone is in its Sleep Focus: a steady stream of Z’s, one
          every 1.6 to 1.9 s along the sleep’s one path, growing as they rise
          (src/components/sleep-flight.ts). The photo breathes on its own clock. Turn sleep off to
          see the Z’s already out float on; changing the speed starts a new stream. Emulate reduced
          motion in the browser’s dev tools to see the resting Z. Here the rings take the plain
          surface colour; on the homepage they follow the lit wall.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-6 text-caption text-muted-foreground">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={asleep}
            className="accent-foreground"
            onChange={(event) => setAsleep(event.target.checked)}
          />
          Asleep
        </label>
        <label className="flex flex-col gap-1">
          {`Speed: ${speed}×`}
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={speed}
            className="w-48 accent-foreground"
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          {`Zoom: ${zoom}×`}
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={zoom}
            className="w-48 accent-foreground"
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showPaths}
            className="accent-foreground"
            onChange={(event) => setShowPaths(event.target.checked)}
          />
          {`Paths of the last ${keptFlights} Z’s`}
        </label>
      </div>

      <section className="grid place-items-center overflow-hidden rounded-2xl border border-border bg-surface-1 p-6">
        <div
          className="relative"
          style={{ width: stage.width, height: stage.height, zoom }}
          data-sleep-stage
        >
          {showPaths && <FlightPaths flights={flights} />}
          <div className="absolute" style={{ left: stage.avatarX - 24, top: stage.avatarY - 24 }}>
            <ProfileAvatar isSleeping={asleep} sleepTuning={tuning} />
          </div>
        </div>
      </section>

      <p className="text-caption text-muted-foreground tabular-nums">
        {last
          ? `Last Z: heading ${last.heading.toFixed(0)}° right of up, ` +
            `floating ${last.distance.toFixed(0)} px over ${((last.duration * speed) / 1000).toFixed(1)} s, ` +
            `swaying ${last.swayCycles.toFixed(2)} times` +
            (gap === null ? '' : `, ${(gap / 1000).toFixed(2)} s after the one before`)
          : 'Waiting for the first Z…'}
      </p>
    </div>
  )
}
