import { useMemo } from 'react'

import { AmbientLight } from '#/components/ambient-light'
import { Logo } from '#/components/logo'
import { defaultAmbientSettings } from '#/lib/ambient-settings'
import type { AmbientSettings } from '#/lib/ambient-settings'

import { tunedNumber, tunedSettings, useTuningQuery } from './scene-tuning'

// Lit from the right: dense slats and small leaves there, blurring and tapering off into plain
// wall to the left, as most leaf-shadow photographs do. A narrow beam aimed past the logo gives
// the falloff.
const card = {
  // The wall's height in CSS pixels. The scene hangs from its right edge; a wall taller than the
  // card, cropped to its middle, enlarges the shadows and carries them further left.
  wall: 630,
  logo: 88,
  opacity: 0.38,
}

const cardSettings: AmbientSettings = {
  ...defaultAmbientSettings,
  light: {
    ...defaultAmbientSettings.light,
    intensity: 1,
    softness: 0.35,
    progressiveSoftness: 3,
    beamWidth: 0.3,
  },
  blinds: { ...defaultAmbientSettings.blinds, spacing: 0.1 },
  foliage: { ...defaultAmbientSettings.foliage, scale: 0.75 },
}

/**
 * The social card: the Sunlit wall with the logo printed in the middle, lit as the page's
 * content is. It covers the viewport; `tools/og/shoot.ts` aims the beam and captures it.
 * ?wall=, ?logo=, ?opacity= and the scene-tuning overrides tune it.
 */
export function OgFixture() {
  const query = useTuningQuery()
  const settings = useMemo(() => tunedSettings(cardSettings, query), [query])
  const wall = tunedNumber(query, 'wall', card.wall)
  const logo = tunedNumber(query, 'logo', card.logo)
  const opacity = tunedNumber(query, 'opacity', card.opacity)
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
