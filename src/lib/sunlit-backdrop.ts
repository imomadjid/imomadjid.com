import { smoothStep } from './ambient-transition'

/**
 * The most direct light the light pass delivers to any point on the wall: its irradiance peaks
 * near 1.09 over the frame at the default settings, for any aspect ratio and pointer aim.
 */
const MAX_IRRADIANCE = 1.1

const srgbToLinear = (channel: number) =>
  channel > 0.04045 ? ((channel + 0.055) / 1.055) ** 2.4 : channel / 12.92
const linearToSrgb = (channel: number) =>
  channel > 0.0031308 ? 1.055 * Math.max(channel, 0) ** (1 / 2.4) - 0.055 : channel * 12.92
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const between = (edge0: number, edge1: number, value: number) =>
  smoothStep((value - edge0) / (edge1 - edge0))

export type GlowState = {
  /** The surface color, sRGB channels from 0 to 255. */
  surface: readonly number[]
  night: number
  direction: number
  warmth: number
  intensity: number
}

/**
 * The plain wall the lit-content layer is encoded against, sRGB channels from 0 to 255.
 *
 * Hard-light can only brighten by screening, which lifts dark text toward white with the wall, so
 * the sunrise and sunset glow, the one light brighter than the surface while the text is dark,
 * would wash it out. Encoded against a backdrop at least as bright as that glow, the glow is
 * shade instead: the wall stays exact, and content takes the light by multiplying, as on a real
 * wall, only all of it a little dimmer while the glow lasts. Outside the glow this is the surface.
 *
 * Mirrors the glow in `ambient-surface.wgsl` at full sun, and lifts the channels together, so
 * the dimming stays neutral rather than tinting the content against the glow's warmth.
 */
export function glowBackdrop({ surface, night, direction, warmth, intensity }: GlowState) {
  // The shader's glow window, let go before the text turns light at the tone crossover (n≈0.74),
  // where dimming would cost light text contrast and the glow has mostly faded.
  const glow =
    between(0, 0.3, night) * (1 - between(0.3, 0.85, night)) * (1 - between(0.6, 0.74, night))
  if (glow <= 0 || intensity <= 0) return surface
  const plain = surface.map((channel) => channel / 255)
  const linear = plain.map(srgbToLinear)
  const luminance =
    0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0)
  const tint = direction * warmth
  const sunset = [mix(0.7, 0.96, tint), mix(0.77, 0.59, tint), mix(0.85, 0.29, tint)]
  const lift = luminance * glow * MAX_IRRADIANCE * intensity * 2
  let gain = 1
  for (const [index, channel] of linear.entries()) {
    const lit = linearToSrgb(channel + srgbToLinear(sunset[index] ?? 0) * lift)
    gain = Math.max(gain, lit / Math.max(plain[index] ?? 0, 1e-4))
  }
  return plain.map((channel) => Math.min(1, channel * gain) * 255)
}
