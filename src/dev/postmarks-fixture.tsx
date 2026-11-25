import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'

import { Postmark, postmarkDesign } from './postmark'
import type { PostmarkPlace } from './postmark'
import { checkClearance } from './postmark-clearance'
import places from './postmark-places.json'

// A first look at passport-style postmarks for the Guestbook. Each place gets one design, seeded
// from its key (Remix designs reseeds them all); each visitor's print varies its date, angle,
// serial and how the ink took (New visitors).

const typedPlaces: PostmarkPlace[] = places

// Where each stamp lands in the collage, as fractions of its box, so the layout survives a resize.
const collageSpots = [
  [0.06, 0.08],
  [0.3, 0.02],
  [0.55, 0.12],
  [0.76, 0.04],
  [0.14, 0.46],
  [0.4, 0.4],
  [0.64, 0.5],
  [0.84, 0.42],
  [0.02, 0.7],
  [0.26, 0.74],
  [0.5, 0.72],
  [0.72, 0.76],
] as const

export function PostmarksFixture() {
  const [salt, setSalt] = useState(0)
  const [visitors, setVisitors] = useState(0)
  const page = useRef<HTMLDivElement>(null)
  const [clearance, setClearance] = useState<ReturnType<typeof checkClearance>>()

  // Measures the rendered lettering once Allo has loaded, and again for every new set of prints.
  useEffect(() => {
    let current = true
    void document.fonts.ready.then(() => {
      if (current && page.current) setClearance(checkClearance(page.current))
    })
    return () => {
      current = false
    }
  }, [salt, visitors])

  return (
    <div ref={page} className="space-y-12 pb-16">
      <header className="max-w-3xl space-y-1">
        <h1 className="text-display font-medium">Postmarks</h1>
        <p className="text-body text-muted-foreground">
          Passport-style stamps for the Guestbook. A place&apos;s design (shape, ink, rings, how its
          outline is drawn) is seeded from the place, so every visitor from Depok gets Depok&apos;s
          stamp; each visitor&apos;s print varies the date, angle, serial and ink.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="compact" onClick={() => setVisitors((value) => value + 4)}>
          New visitors
        </Button>
        <Button size="compact" variant="secondary" onClick={() => setSalt((value) => value + 1)}>
          Remix designs
        </Button>
        {clearance && (
          <p
            className="self-center text-body text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {clearance.clashed === 0
              ? `Lettering clears every border in all ${clearance.checked} postmarks`
              : `${clearance.clashed} of ${clearance.checked} postmarks have lettering over a border (dashed red)`}
          </p>
        )}
        {salt > 0 && (
          <Button size="compact" variant="tertiary" onClick={() => setSalt(0)}>
            Back to the first designs
          </Button>
        )}
      </div>

      {clearance && clearance.messages.length > 0 && (
        <ul className="space-y-1 text-body text-red-600 dark:text-red-400">
          {clearance.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-title font-medium">On the wall</h2>
        <div className="relative isolate h-[560px] overflow-hidden rounded-2xl bg-surface-2">
          {collageSpots.map(([left, top], index) => {
            const place = typedPlaces[index % typedPlaces.length]
            if (!place) return null
            return (
              <Postmark
                key={`${left}:${top}`}
                place={place}
                visitor={visitors * 31 + index}
                salt={salt}
                size={170}
                className="absolute mix-blend-multiply dark:mix-blend-screen"
                style={{ left: `${left * 100}%`, top: `${top * 100}%` }}
              />
            )
          })}
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-title font-medium">Each place, four visitors</h2>
        {typedPlaces.map((place) => {
          const design = postmarkDesign(place.key, salt)
          return (
            <div key={place.key} className="space-y-3">
              <h3 className="text-body font-medium">
                {place.name}
                <span className="ml-2 text-muted-foreground">
                  {place.region}, {place.country} · {design.shape}, {design.ink.name} ink,{' '}
                  {design.outlineStyle} outline
                </span>
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                {[0, 1, 2, 3].map((index) => (
                  <Postmark
                    key={index}
                    place={place}
                    visitor={visitors + index}
                    salt={salt}
                    size={170}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <p className="text-caption text-muted-foreground">
        Outlines © OpenStreetMap contributors, ODbL, from tools/postmarks/outlines.ts.
      </p>
    </div>
  )
}
