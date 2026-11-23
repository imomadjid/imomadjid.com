// CPU copies of the light and canopy geometry in src/shaders/ambient-light.wgsl. World units
// are wall heights in the wall's frame: x right with the wall's right edge at 0, y down from
// its top edge, z toward the viewer.

import { tiltSource } from './device-tilt'
import type { Vec3 } from './vec3'

/** The sun's position for a light angle in degrees, before phone tilt turns it. */
export function sunSource(angle: number, night: number, tilt: Vec3, aspect: number): Vec3 {
  const lightAngle = ((angle + night * 42) * Math.PI) / 180
  return tiltSource([2.6, Math.tan(lightAngle) * 5, 5], tilt, aspect)
}

/** Where each branch is attached, in its canopy's texture coordinates. */
export const BRANCH_ANCHOR = [1, 0.95] as const

/** A canopy plane: its texture's top-left corner and its width in wall heights. */
export type Canopy = { origin: Vec3; size: number }

export type Canopies = { near: Canopy; far: Canopy }

/** The near and far canopy planes for the foliage settings. */
export function canopies(scale: number, depth: number): Canopies {
  // Both canopies grow about their attachment, not their texture's corner.
  const canopyScale = 2 * scale
  const plane = (x: number, y: number, z: number, size: number): Canopy => ({
    origin: [
      x + BRANCH_ANCHOR[0] * size * (1 - canopyScale),
      y + BRANCH_ANCHOR[1] * size * (1 - canopyScale),
      z,
    ],
    size: size * canopyScale,
  })
  return {
    near: plane(-0.352, -0.625, 0.85 + depth * 0.5, 0.932),
    far: plane(0.21, 0.22, 1.55 + depth * 0.65, 0.85),
  }
}

/** Where a branch's attachment casts its shadow on the wall, from the middle of the sun. */
export function anchorShadow({ origin, size }: Canopy, source: Vec3): [number, number] {
  const x = origin[0] + BRANCH_ANCHOR[0] * size
  const y = origin[1] + BRANCH_ANCHOR[1] * size
  const reach = origin[2] / (source[2] - origin[2])
  return [x - (source[0] - x) * reach, y - (source[1] - y) * reach]
}
