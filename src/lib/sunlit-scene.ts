// Shared between the Sunlit renderer and the blind wand, which sit side by side in the scene.
// The renderer publishes the light it draws each frame; the wand publishes its pose so the
// renderer can cast its shadow. Both sides keep working when the other is absent.

/** Scene lighting as the renderer last drew it. Colors are sRGB channels from 0 to 1. */
export type SceneLight = {
  night: number
  direction: number
  entrance: number
  entranceNight: number
  aimX: number
  aimY: number
  /** How far phone tilt has turned the room against the sun, as a rotation in the wall's frame. */
  phoneTilt: [number, number, number]
  /** The angle the wand hangs at to stay plumb as the phone rolls, radians clockwise on screen. */
  plumb: number
  surface: [number, number, number]
}

/**
 * The wand in canvas UV space (0 to 1, y down). (x, y) is the origin of its axis, `hang`
 * above the point where it hangs on the hook, and `angle` swings the wand around that point in
 * radians. Lengths are fractions of the canvas height, measured along the axis from the origin;
 * widths are half-widths as seen.
 */
export type WandPose = {
  x: number
  y: number
  angle: number
  /** Where it hangs on the hook; the hook's wire runs straight up from here. */
  hang: number
  tipStart: number
  tipWidth: number
  tipCorner: number
  /** The tip narrows from `taperStart` into the rod, which is full width from `rodStart`. */
  taperStart: number
  rodStart: number
  holeY: number
  holeWidth: number
  holeHeight: number
  length: number
  radius: number
}

function channel<T>() {
  let value: T | null = null
  const listeners = new Set<(next: T | null) => void>()
  return {
    get: () => value,
    set(next: T | null) {
      value = next
      for (const listener of listeners) listener(next)
    },
    subscribe(listener: (next: T | null) => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const sceneLight = channel<SceneLight>()
export const wandPose = channel<WandPose>()
