// Three-component vector helpers shared by the Sunlit light math on the CPU.

export type Vec3 = [number, number, number]

export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
/** Linear interpolation from `a` to `b`. */
export const lerp = (a: Vec3, b: Vec3, t: number) => add(a, scale(sub(b, a), t))
/** Unit vector along `a`; a zero vector stays zero. */
export const normalize = (a: Vec3) => scale(a, 1 / Math.max(length(a), 1e-9))
