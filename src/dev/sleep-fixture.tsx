import { useCallback, useMemo, useState } from 'react'

import { ProfileAvatar } from '#/components/profile-avatar'
import type { SleepFlight } from '#/components/sleep-flight'
import { flightPose } from '#/components/sleep-flight'

// How many recent breaths the path overlay keeps, newest drawn strongest.
const keptBreaths = 4

// The stage, in px before zooming: the avatar sits near its bottom left, with room above and to
// the right for the farthest Z (about 70 px up and 50 px across from the avatar's centre).
const stage = { width: 170, height: 150, avatarX: 48, avatarY: 110 }

function FlightPaths({ breaths }: { breaths: SleepFlight[][] }) {
  // Each path samples its flight while the Z is visible, from the avatar's centre.
  const paths = useMemo(
    () =>
      breaths.map((flights) =>
        flights.map((flight) => {
          const points: string[] = []
          for (let step = 0; step <= 60; step++) {
            const pose = flightPose(flight, step / 60)
            if (pose.opacity > 0.05) points.push(`${pose.x.toFixed(2)},${pose.y.toFixed(2)}`)
          }
          return points.join(' ')
        }),
      ),
    [breaths],
  )
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-muted-foreground"
      viewBox={`${-stage.avatarX} ${-stage.avatarY} ${stage.width} ${stage.height}`}
    >
      {paths.map((breath, age) =>
        breath.map((points, index) => (
          <polyline
            // Paths are redrawn whole each breath, so their place in the list is their identity.
            // eslint-disable-next-line react/no-array-index-key
            key={`${age}-${index}`}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.6}
            strokeLinecap="round"
            strokeDasharray="1.5 1.5"
            opacity={0.2 + (0.6 * (age + 1)) / paths.length}
          />
        )),
      )}
    </svg>
  )
}

export function SleepFixture() {
  const [asleep, setAsleep] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [zoom, setZoom] = useState(3)
  const [showPaths, setShowPaths] = useState(true)
  const [breaths, setBreaths] = useState<SleepFlight[][]>([])
  const onBreath = useCallback(
    (flights: SleepFlight[]) => setBreaths((kept) => [...kept.slice(1 - keptBreaths), flights]),
    [],
  )
  const tuning = useMemo(() => ({ speed, onBreath }), [speed, onBreath])
  const last = breaths.at(-1)

  return (
    <div className="max-w-5xl space-y-10">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Sleep</h1>
        <p className="text-body text-muted-foreground">
          The homepage avatar while Imo’s phone is in its Sleep Focus: each breath lets out two or
          three Z’s that float off and settle into zzZ (src/components/sleep-flight.ts). Turn sleep
          off to see the Z’s already out float on. Slow motion takes effect from the next breath.
          Emulate reduced motion in the browser’s dev tools to see the resting Z. Here the rings
          take the plain surface colour; on the homepage they follow the lit wall.
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
          {`Paths of the last ${keptBreaths} breaths`}
        </label>
      </div>

      <section className="grid place-items-center overflow-hidden rounded-2xl border border-border bg-surface-1 p-6">
        <div
          className="relative"
          style={{ width: stage.width, height: stage.height, zoom }}
          data-sleep-stage
        >
          {showPaths && <FlightPaths breaths={breaths} />}
          <div className="absolute" style={{ left: stage.avatarX - 24, top: stage.avatarY - 24 }}>
            <ProfileAvatar isSleeping={asleep} sleepTuning={tuning} />
          </div>
        </div>
      </section>

      <p className="text-caption text-muted-foreground tabular-nums">
        {last
          ? `Last breath: ${last.length} Z’s, heading ${last[0].heading.toFixed(0)}° right of up, ` +
            `floating ${last.map((flight) => flight.distance.toFixed(0)).join(', ')} px, ` +
            `swaying ${last[0].swayCycles.toFixed(2)} times`
          : 'Waiting for the first breath…'}
      </p>
    </div>
  )
}
