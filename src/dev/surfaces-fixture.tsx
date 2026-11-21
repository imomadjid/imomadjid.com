import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { normalizeSurfaceLevel, surfaceClasses } from '#/lib/surface-classes'
import { SurfaceProvider, useSurface } from '#/lib/surface-context'

const levels = [1, 2, 3, 4, 5, 6, 7, 8] as const

export function SurfacesFixture() {
  return (
    <div className="max-w-5xl space-y-14">
      <header className="space-y-1">
        <h1 className="text-display font-medium">Surfaces</h1>
        <p className="text-body text-muted-foreground">
          The surface ladder from src/styles.css. Toggle the theme to compare light shadows with
          dark brightness steps.
        </p>
      </header>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Ladder</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {levels.map((level) => (
            <div
              key={level}
              className={`flex aspect-[4/3] items-end rounded-xl p-3 ${surfaceClasses(level)}`}
            >
              <span className="text-caption text-muted-foreground">Level {level}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b border-border pb-2 text-title font-medium">Nested elevation</h2>
        <p className="text-body text-muted-foreground">
          Each panel reads its parent level and rises by one, the pattern overlays use.
        </p>
        <Elevated label="Card">
          <Elevated label="Inner panel">
            <Elevated label="Popover">
              <div className="flex gap-2">
                <Button variant="secondary" size="compact">
                  Secondary
                </Button>
                <Button variant="tertiary" size="compact">
                  Tertiary
                </Button>
              </div>
            </Elevated>
          </Elevated>
        </Elevated>
      </section>
    </div>
  )
}

function Elevated({ label, children }: { label: string; children: ReactNode }) {
  const level = normalizeSurfaceLevel(useSurface() + 1)

  return (
    <div className={`space-y-3 rounded-xl p-4 ${surfaceClasses(level)}`}>
      <p className="text-caption text-muted-foreground">
        {label} · level {level}
      </p>
      <SurfaceProvider value={level}>{children}</SurfaceProvider>
    </div>
  )
}
