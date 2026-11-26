import { easing } from '#/lib/transition'

// The Sunlit scene's settings. The capture pages (/dev/og, /dev/story) start from these and
// override a few, and their query overrides (src/dev/scene-tuning.ts) tune them further.
export const defaultAmbientSettings = {
  light: {
    angle: -28,
    intensity: 0.7,
    warmth: 0.55,
    softness: 0.65,
    progressiveSoftness: 3,
    beamWidth: 0.32,
    pointerInfluence: 0.9,
  },
  blinds: {
    opening: 0.76,
    spacing: 0.12,
    railWidth: 0.018,
    distance: 0.25,
  },
  // Whether the light falls on the page's content too, as if it were printed on the wall.
  content: {
    lit: true,
  },
  // The tilt wand's distance from the wall, which sets how far its shadow falls.
  wand: {
    depth: 0.09,
  },
  foliage: {
    movement: 0.7,
    speed: 1,
    density: 0.9,
    depth: 0.4,
    scale: 1,
  },
  // Pointer gusts swing the branches and make the leaves near the stroke flicker.
  breeze: {
    strength: 0.7,
    recovery: 1.3,
    rustle: 0.7,
  },
  // Phone tilt turns the room against the sun. Range is the most it turns, in degrees.
  phoneTilt: {
    influence: 0.15,
    range: 3,
    recenter: 3,
    wandSwing: 1,
  },
  transition: {
    dawnEntrance: easing(3.2, [0.3, 0, 0.2, 1]),
    duskEntrance: easing(3.6, [0.25, 0, 0.3, 1]),
    sunsetMotion: easing(1.7, [0.32, 0, 0.16, 1]),
    sunriseMotion: easing(1.4, [0.16, 1, 0.3, 1]),
  },
}

export type AmbientSettings = typeof defaultAmbientSettings
