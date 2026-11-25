// A photo's exposure as a camera's info display sets it: ƒ for the aperture, a decimal comma, a
// double prime for whole seconds, a true minus and vulgar fractions for exposure compensation.
import type { Exposure } from '#/lib/fuji-settings'

/** `6.3` as `6,3`, at most one decimal, as a camera rounds it. */
function decimal(value: number) {
  return String(Math.round(value * 10) / 10).replace('.', ',')
}

/** `ƒ6,3`. */
export function formatAperture(aperture: number) {
  return `ƒ${decimal(aperture)}`
}

/**
 * `1/250` stays a fraction, with a decimal comma (`1/2,5`); a time without one, such as `0.8`,
 * reads `0,8″`.
 */
export function formatShutter(shutter: string) {
  if (shutter.includes('/')) return shutter.replace('.', ',')
  const seconds = Number(shutter)
  return Number.isNaN(seconds) ? shutter : `${decimal(seconds)}″`
}

/** `24mm`: cameras show a zoom's focal length to the millimetre. */
export function formatFocalLength(focalLength: number) {
  return `${Math.round(focalLength)}mm`
}

/** Thirds of a stop past the whole stops. */
const thirdsOf = ['', '⅓', '⅔']

/** In thirds of a stop, as the camera's dial steps: `±0`, `+⅓`, `−1⅔`, `+2`. */
export function formatExposureCompensation(stops: number) {
  const thirds = Math.round(Math.abs(stops) * 3)
  if (thirds === 0) return '±0'
  const whole = Math.floor(thirds / 3)
  return `${stops < 0 ? '−' : '+'}${whole > 0 ? whole : ''}${thirdsOf[thirds % 3]}`
}

/** The readouts the lightbox shows under a photo, in the order a camera's display lists them. */
export function exposureReadouts(exposure: Exposure) {
  return [
    { label: 'Focal length', value: formatFocalLength(exposure.focalLength) },
    { label: 'Aperture', value: formatAperture(exposure.aperture) },
    { label: 'Shutter', value: formatShutter(exposure.shutter) },
    { label: 'ISO', value: String(exposure.iso) },
    { label: 'EV', value: formatExposureCompensation(exposure.exposureCompensation) },
  ]
}
