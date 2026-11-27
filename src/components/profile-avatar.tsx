import { Suspense, lazy, useRef, useState } from 'react'

// The Z's load only once the avatar first falls asleep, so a page that never sees Imo asleep
// never loads them. Once loaded they stay mounted, so waking plays their exit.
const SleepParticles = lazy(() => import('./sleep-particles'))

export function ProfileAvatar({ isSleeping }: { isSleeping: boolean }) {
  const [hasSlept, setHasSlept] = useState(false)
  // The photo breathes while Imo sleeps; the particles drive it.
  const photo = useRef<HTMLImageElement>(null)
  if (isSleeping && !hasSlept) setHasSlept(true)

  return (
    <div className="relative isolate size-12 shrink-0">
      <img
        ref={photo}
        src="/images/imo-avatar.webp"
        alt="Imo smiling in a field of blue flowers"
        width={144}
        height={144}
        className="relative z-10 size-full rounded-full bg-surface-1"
      />
      {hasSlept && (
        <Suspense>
          <SleepParticles isSleeping={isSleeping} photo={photo} />
        </Suspense>
      )}
    </div>
  )
}
