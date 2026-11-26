import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'

import { Postmark } from './postmark'
import type { PostmarkPlace } from './postmark'
import { checkClearance } from './postmark-clearance'
import { houseStyle, pictorialPool } from './postmark-deal'
import { families, familyNames } from './postmark-kit'
import type { PictorialKey } from './postmark-kit'
import { PostmarkMixer } from './postmark-mixer'
import { PictorialSheet } from './postmark-pictorial-sheet'
import { pictorials } from './postmark-pictorials'
import places from './postmark-places.json'
import { stressPlaces } from './postmark-stress-places'
import { PostmarkSweep } from './postmark-sweep'

// Postmarks for the postmark footer, dealt per visitor (postmark-deal.ts). A city has a house style
// (an ink and three or four frame families that letter its name readably); each visitor gets the
// next family and pictorial from the city's shuffle bags, the pictorials drawn from the city, its
// region and its country, plus their own lettering, date format, ornaments, border and print
// (New visitors deals the next ones; Remix designs reseeds everything). Mix and match assembles
// one by hand; the combination sweep checks every accepted combination against hard names.

const typedPlaces: PostmarkPlace[] = places
const everyPlace = [...typedPlaces, ...stressPlaces]

// A wall as visitors might fill it: mostly Depok, then nearby cities, and a few from farther away.
const crowd = [
  'depok',
  'jakarta-barat',
  'depok',
  'san-francisco',
  'bandung',
  'depok',
  'jakarta-barat',
  'depok',
  'shibuya',
  'yogyakarta',
  'depok',
  'bandung',
  'london',
  'depok',
  'jakarta-barat',
  'singapore',
  'depok',
  'depok',
] as const

// Where each stamp lands in the collage, as fractions of its box, so the layout survives a resize:
// six columns over three rows, nudged off the grid.
const collageSpots = crowd.map((_, index) => {
  const [column, row] = [index % 6, Math.floor(index / 6)]
  const nudge = ((index * 37) % 11) / 100
  return [0.01 + column * 0.16 + nudge * 0.6, 0.03 + row * 0.3 + nudge] as const
})

// Each crowd member's ordinal among their place's visitors.
const ordinals = crowd.map(
  (key, index) => crowd.slice(0, index).filter((other) => other === key).length,
)

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
            Postmarks for the postmark footer, after real ones: scenic and station stamps, special
            handstamps, machine cancels, passport stamps. Each city has a house style, an ink and
            three or four frames that letter its name readably, so its stamps read as related; each
            visitor is dealt the next frame and pictorial from the city&apos;s shuffle bags, with
            their own lettering, date, ornaments, border and print. Pictorials come from the city,
            its region and its country, weighted to the city; a place without any falls back to its
            map outline.
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
          <p className="max-w-3xl text-body text-muted-foreground">
            Eighteen visitors, eight of them from Depok: its stamps share an ink and a set of
            frames, and no two repeat.
          </p>
          <div className="relative isolate h-[600px] overflow-hidden rounded-2xl bg-surface-2">
            {collageSpots.map(([left, top], index) => {
              const place = typedPlaces.find((candidate) => candidate.key === crowd[index])
              if (!place) return null
              return (
                <Postmark
                  key={`${left}:${top}`}
                  place={place}
                  visitor={visitors + (ordinals[index] ?? 0)}
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
          <h2 className="text-title font-medium">Each place, eight visitors</h2>
          {typedPlaces.map((place) => {
            const house = houseStyle(place, salt)
            const pool = pictorialPool(place)
            const counts = new Map<PictorialKey, number>()
            for (const key of pool) counts.set(key, (counts.get(key) ?? 0) + 1)
            return (
              <div key={place.key} className="space-y-3">
                <h3 className="text-body font-medium">
                  {place.name}
                  <span className="ml-2 text-muted-foreground">
                    {place.region}, {place.country} · {house.ink} ink,{' '}
                    {house.families.map((family) => familyNames[family]).join(', ')}
                  </span>
                </h3>
                <p className="text-caption text-muted-foreground">
                  {pool.length === 0
                    ? 'No pictorials yet: map outline'
                    : `Pictorial bag: ${[...counts]
                        .map(([key, count]) => `${pictorials[key].subject} ×${count}`)
                        .join(', ')}`}
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
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
