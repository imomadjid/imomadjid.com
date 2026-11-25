import { useSyncExternalStore } from 'react'

import { AmbientLight } from '#/components/ambient-light'
import { Logo } from '#/components/logo'
import { defaultAmbientSettings } from '#/lib/ambient-settings'
import type { AmbientSettings } from '#/lib/ambient-settings'

// Lit from the right and fading out to the left, as most leaf-shadow photographs are: the
// leaves smaller and denser than the site's, a few thin slats, a narrower beam.
const card = {
  // The scene hangs from the wall's right edge; a wall taller than the card, cropped to its
  // middle, carries the light toward the left.
  wall: 760,
  logo: 64,
  opacity: 0.38,
}

const cardSettings: AmbientSettings = {
  ...defaultAmbientSettings,
  light: {
    ...defaultAmbientSettings.light,
    intensity: 1,
    softness: 0.35,
    progressiveSoftness: 1.5,
    beamWidth: 0.55,
  },
  blinds: { ...defaultAmbientSettings.blinds, opening: 0.9, spacing: 0.2 },
  foliage: { ...defaultAmbientSettings.foliage, density: 1, depth: 0.6, scale: 0.68 },
}

// Tuning aid: ?wall=&logo=&opacity= and light., blinds. or foliage.<key>= (such as
// foliage.scale=0.7) override the card's values.
const untuned = { ...card, settings: cardSettings }
let clientTuning: typeof untuned | undefined

function tuned() {
  const search = new URLSearchParams(location.search)
  const read = (key: string, fallback: number) =>
    search.has(key) ? Number(search.get(key)) : fallback
  const settings = structuredClone(cardSettings)
  const groups = Object.entries({
    light: settings.light,
    blinds: settings.blinds,
    foliage: settings.foliage,
  })
  for (const [key, value] of search) {
    const [group, name = ''] = key.split('.')
    const values = groups.find(([named]) => named === group)?.[1]
    if (values && name in values) Reflect.set(values, name, Number(value))
  }
  return {
    wall: read('wall', card.wall),
    logo: read('logo', card.logo),
    opacity: read('opacity', card.opacity),
    settings,
  }
}

const noChanges = () => () => {}

/**
 * The social card: the Sunlit wall with the logo printed in the middle, lit as the page's
 * content is. It covers the viewport; `tools/og/shoot.ts` aims the beam and captures it.
 */
export function OgFixture() {
  // The server renders the defaults; the query applies after hydration, which keeps its own
  // attributes.
  const { wall, logo, opacity, settings } = useSyncExternalStore(
    noChanges,
    () => (clientTuning ??= tuned()),
    () => untuned,
  )
  return (
    <main data-og className="fixed inset-0 isolate z-50 grid place-items-center">
      <style>{`[data-og] > div > * { top: calc(50% - ${wall / 2}px) !important; height: ${wall}px !important }`}</style>
      <AmbientLight settings={settings} />
      <Logo
        aria-label="Imo Madjid"
        className="relative text-neutral-700"
        style={{ height: logo, opacity }}
      />
    </main>
  )
}
