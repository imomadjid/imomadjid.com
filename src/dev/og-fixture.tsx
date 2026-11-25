import { AmbientLight } from '#/components/ambient-light'
import { Logo } from '#/components/logo'
import { defaultAmbientSettings } from '#/lib/ambient-settings'
import type { AmbientSettings } from '#/lib/ambient-settings'

// The scene hangs from the wall's right edge, so on a 1200 x 630 card it lights only the right
// half. A taller wall, cropped to its middle, spreads the light and the blinds across the card.
const WALL_HEIGHT = 1000

// A wide, crisp beam with sharper leaves than the site's, which reads better at card size.
const settings: AmbientSettings = {
  ...defaultAmbientSettings,
  light: {
    ...defaultAmbientSettings.light,
    intensity: 1,
    softness: 0.35,
    progressiveSoftness: 1.5,
    beamWidth: 0.7,
  },
}

/**
 * The social card: the Sunlit wall with the logo printed small in the middle, lit as the page's
 * content is. It covers the viewport; `tools/og/shoot.ts` aims the beam and captures it.
 */
export function OgFixture() {
  return (
    <main data-og className="fixed inset-0 isolate z-50 grid place-items-center">
      <style>{`[data-og] > div > * { top: calc(50% - ${WALL_HEIGHT / 2}px) !important; height: ${WALL_HEIGHT}px !important }`}</style>
      <AmbientLight settings={settings} />
      <Logo aria-label="Imo Madjid" className="relative h-10 text-neutral-700" />
    </main>
  )
}
