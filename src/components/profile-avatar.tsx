import { Suspense, lazy } from 'react'

// Sleep Focus is a development-only DialKit toggle; production never loads the particles.
const SleepParticles = import.meta.env.DEV ? lazy(() => import('./sleep-particles')) : null

export function ProfileAvatar({ isSleeping }: { isSleeping: boolean }) {
  return (
    <div className="relative isolate size-12 shrink-0">
      <img
        src="/images/imo-avatar.webp"
        alt="Imo smiling in a field of blue flowers"
        width={144}
        height={144}
        className="relative z-10 size-full rounded-full bg-surface-1"
      />
      {SleepParticles && (
        <Suspense>
          <SleepParticles isSleeping={isSleeping} />
        </Suspense>
      )}
    </div>
  )
}
