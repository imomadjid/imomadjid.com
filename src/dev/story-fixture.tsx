import { useMemo } from 'react'

import { AmbientLight } from '#/components/ambient-light'
import { defaultAmbientSettings } from '#/lib/ambient-settings'
import type { AmbientSettings } from '#/lib/ambient-settings'

import { tunedNumber, tunedSettings, useTuningQuery } from './scene-tuning'

// The scene's units follow the wall's height, so on a tall portrait screen its leaves and slats
// come out about three times the card's size; these bring them back down.
const storySettings: AmbientSettings = {
  ...defaultAmbientSettings,
  light: { ...defaultAmbientSettings.light, intensity: 1, softness: 0.35, beamWidth: 0.5 },
  blinds: { ...defaultAmbientSettings.blinds, spacing: 0.07 },
  foliage: { ...defaultAmbientSettings.foliage, scale: 0.55 },
}

/**
 * A portrait story of the Sunlit wall alone, for `tools/story/record.ts`, which steps its clock
 * frame by frame and turns it to night. ?sunset= sets the sunset's length in seconds, and the
 * scene-tuning overrides tune the light.
 */
export function StoryFixture() {
  const query = useTuningQuery()
  const settings = useMemo(() => {
    const tuned = tunedSettings(storySettings, query)
    const { sunsetMotion } = tuned.transition
    return {
      ...tuned,
      transition: {
        ...tuned.transition,
        sunsetMotion: { ...sunsetMotion, duration: tunedNumber(query, 'sunset', 9) },
      },
    }
  }, [query])
  return (
    <main data-story className="fixed inset-0 isolate z-50">
      <AmbientLight settings={settings} />
    </main>
  )
}
