import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'

import { Postmark } from './postmark'
import type { PostmarkPlace } from './postmark'
import { checkClearance } from './postmark-clearance'
import { families, familyNames, postmarkDesign, postmarkStyle } from './postmark-kit'
import { PostmarkMixer } from './postmark-mixer'
import { PictorialSheet } from './postmark-pictorial-sheet'
import places from './postmark-places.json'
import { stressPlaces } from './postmark-stress-places'
import { PostmarkSweep } from './postmark-sweep'

// Postmarks for the Guestbook. Each place gets one design, seeded from its key (Remix designs
// reseeds them all): a layout family after real postmarks, a style assembled from independent
// choices the family accepts (ink, lettering weight and tracking, date, ornaments, border), and
// the place's pictorial, or its map outline where it has none. Each visitor's print varies its
// date, angle, serial and how the ink took (New visitors). Mix and match assembles one by hand;
// the combination sweep checks every accepted combination against hard names.

const typedPlaces: PostmarkPlace[] = places
const everyPlace = [...typedPlaces, ...stressPlaces]

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
  const [outline, setOutline] = useState(false)
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
  }, [salt, visitors, outline])

  return (
    <div className="space-y-12 pb-16">
      <div ref={page} className="space-y-12">
        <header className="max-w-3xl space-y-1">
          <h1 className="text-display font-medium">Postmarks</h1>
          <p className="text-body text-muted-foreground">
            Postmarks for the Guestbook, after real ones: scenic and station stamps, special
            handstamps, machine cancels, passport stamps. A place&apos;s design (layout, ink, its
            pictorial) is seeded from the place, so every visitor from Depok gets Depok&apos;s
            stamp; each visitor&apos;s print varies the date, angle, serial and ink. A place without
            a pictorial falls back to its map outline.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button size="compact" onClick={() => setVisitors((value) => value + 4)}>
            New visitors
          </Button>
          <Button size="compact" variant="secondary" onClick={() => setSalt((value) => value + 1)}>
            Remix designs
          </Button>
          <fieldset className="flex gap-1">
            <legend className="sr-only">Picture</legend>
            <Button
              size="compact"
              variant={outline ? 'ghost' : 'secondary'}
              aria-pressed={!outline}
              onClick={() => setOutline(false)}
            >
              Pictorials
            </Button>
            <Button
              size="compact"
              variant={outline ? 'secondary' : 'ghost'}
              aria-pressed={outline}
              onClick={() => setOutline(true)}
            >
              Map outlines
            </Button>
          </fieldset>
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
          <h2 className="text-title font-medium">Mix and match</h2>
          <p className="max-w-3xl text-body text-muted-foreground">
            A family is a structure: its frame, picture and slots for lines. Each style axis is
            chosen apart from it, from what the family accepts, and every line is sized from the
            choice, so any accepted combination fits.
          </p>
          <PostmarkMixer places={everyPlace} salt={salt} visitors={visitors} outline={outline} />
        </section>

        <section className="space-y-3">
          <h2 className="text-title font-medium">Pictorials</h2>
          <p className="max-w-3xl text-body text-muted-foreground">
            Each place&apos;s drawing at 200 px and at 64 px, its size on the wall, with its stored
            ink box dashed. New drawings follow tools/postmarks/pictorial-style.md and should look
            cut by the same hand as these.
          </p>
          <PictorialSheet />
        </section>

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
                  outline={outline}
                  size={128}
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
            const style = postmarkStyle(place.key, salt, design.family)
            return (
              <div key={place.key} className="space-y-3">
                <h3 className="text-body font-medium">
                  {place.name}
                  <span className="ml-2 text-muted-foreground">
                    {place.region}, {place.country} ·{' '}
                    {design.family === 'classic'
                      ? `${design.shape} (classic)`
                      : familyNames[design.family]}
                    , {style.ink} ink, {style.weight} {style.tracking} lettering
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[0, 1, 2, 3].map((index) => (
                    <Postmark
                      key={index}
                      place={place}
                      visitor={visitors + index}
                      salt={salt}
                      outline={outline}
                      size={150}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        <section className="space-y-8">
          <h2 className="text-title font-medium">Every family</h2>
          {families.map((family, row) => (
            <div key={family} className="space-y-3">
              <h3 className="text-body font-medium">{familyNames[family]}</h3>
              <div className="flex flex-wrap items-center gap-6">
                {[0, 1, 2].map((index) => {
                  const place = typedPlaces[(row * 3 + index) % typedPlaces.length]
                  if (!place) return null
                  return (
                    <Postmark
                      key={place.key}
                      place={place}
                      family={family}
                      visitor={visitors + index}
                      salt={salt}
                      outline={outline}
                      size={150}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-title font-medium">Combination sweep</h2>
        <p className="max-w-3xl text-body text-muted-foreground">
          Every combination each family accepts, for one place, checked for lettering over a border,
          an ornament or another line. The hard names come after the real places: the longest and
          widest, stacked accents and cedillas, and names short enough to set at full size.
        </p>
        <PostmarkSweep places={everyPlace} />
      </section>

      <p className="text-caption text-muted-foreground">
        Outlines © OpenStreetMap contributors, ODbL, from tools/postmarks/outlines.ts.
      </p>
    </div>
  )
}
