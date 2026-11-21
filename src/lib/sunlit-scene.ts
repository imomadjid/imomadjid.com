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
  surface: [number, number, number]
}

/**
 * The wand in canvas UV space (0 to 1, y down). `angle` swings the rod around its pivot in
 * radians. Lengths are fractions of the canvas height: distances along the rod from the pivot
 * to the flat tip's ends and the rod's end, and the rod's and tip's half widths as seen.
 */
export type WandPose = {
  x: number
  y: number
  angle: number
  tipStart: number
  tipEnd: number
  tipWidth: number
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
