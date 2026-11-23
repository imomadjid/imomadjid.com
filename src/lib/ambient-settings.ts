import type { DialConfig, ResolvedValues } from 'dialkit'

export const ambientControls = {
  reset: { type: 'action', label: 'Reset Sunlit' },
  light: {
    angle: [-28, -65, 10, 1],
    intensity: [0.7, 0, 1, 0.01],
    warmth: [0.55, 0, 1, 0.01],
    softness: [0.65, 0.1, 1.5, 0.01],
    progressiveSoftness: [3, 0, 6, 0.1],
    beamWidth: [0.32, 0.18, 0.7, 0.01],
    pointerInfluence: [0.9, 0, 1, 0.01],
  },
  blinds: {
    opening: [0.76, 0.1, 0.9, 0.01],
    spacing: [0.12, 0.08, 0.35, 0.01],
    railWidth: [0.018, 0, 0.06, 0.001],
    distance: [0.25, 0.1, 0.6, 0.01],
  },
  // Whether the light falls on the page's content too, as if it were printed on the wall.
  content: {
    lit: true,
  },
  // The tilt wand's distance from the wall, which sets how far its shadow falls.
  wand: {
    depth: [0.09, 0.02, 0.3, 0.01],
  },
  foliage: {
    movement: [0.7, 0, 1, 0.01],
    speed: [1, 0, 1.5, 0.01],
    density: [0.9, 0, 1, 0.01],
    depth: [0.4, 0, 1, 0.01],
    scale: [1, 0.65, 1.5, 0.01],
  },
  breeze: {
    strength: [0.7, 0, 1.5, 0.01],
    recovery: [1.3, 0.4, 3, 0.1],
  },
  // Phone tilt turns the room against the sun. Range is the most it turns, in degrees.
  phoneTilt: {
    influence: [0.15, 0, 1, 0.01],
    range: [3, 0, 12, 0.5],
    recenter: [3, 0.5, 10, 0.1],
  },
  transition: {
    dawnEntrance: { type: 'easing', duration: 3.2, ease: [0.3, 0, 0.2, 1] },
    duskEntrance: { type: 'easing', duration: 3.6, ease: [0.25, 0, 0.3, 1] },
    sunsetMotion: { type: 'easing', duration: 1.7, ease: [0.32, 0, 0.16, 1] },
    sunriseMotion: { type: 'easing', duration: 1.4, ease: [0.16, 1, 0.3, 1] },
  },
} satisfies DialConfig

export type AmbientSettings = ResolvedValues<typeof ambientControls>

const { light, blinds, content, wand, foliage, breeze, phoneTilt, transition } = ambientControls

// Production values; DialKit only tunes these in development.
export const defaultAmbientSettings: AmbientSettings = {
  reset: ambientControls.reset,
  light: {
    angle: light.angle[0],
    intensity: light.intensity[0],
    warmth: light.warmth[0],
    softness: light.softness[0],
    progressiveSoftness: light.progressiveSoftness[0],
    beamWidth: light.beamWidth[0],
    pointerInfluence: light.pointerInfluence[0],
  },
  blinds: {
    opening: blinds.opening[0],
    spacing: blinds.spacing[0],
    railWidth: blinds.railWidth[0],
    distance: blinds.distance[0],
  },
  content: { lit: content.lit },
  wand: { depth: wand.depth[0] },
  foliage: {
    movement: foliage.movement[0],
    speed: foliage.speed[0],
    density: foliage.density[0],
    depth: foliage.depth[0],
    scale: foliage.scale[0],
  },
  breeze: { strength: breeze.strength[0], recovery: breeze.recovery[0] },
  phoneTilt: {
    influence: phoneTilt.influence[0],
    range: phoneTilt.range[0],
    recenter: phoneTilt.recenter[0],
  },
  transition,
}
