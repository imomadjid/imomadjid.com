import { toScreen, upFromOrientation } from './device-tilt'
import { coarsePointerQuery } from './media-query'
import type { Vec3 } from './vec3'

// The motion sensor half of phone tilt. Only the lazily loaded renderer imports it; the wand
// imports the light math from device-tilt.ts eagerly.

type OrientationPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

// Controls a tap could mean to use. Landmark roles and tabindex="-1" focus targets wrap
// plain page content, so they don't count.
function screenAngle() {
  if ('orientation' in screen) return screen.orientation.angle
  return 'orientation' in window ? Number(window.orientation) : 0
}

const INTERACTIVE = [
  'a[href], button, input, select, textarea, label, summary',
  '[role="button"], [role="link"], [role="slider"], [role="switch"], [role="tab"]',
  '[role="menuitem"], [role="checkbox"], [role="radio"], [tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Calls `onUp` with world up in the screen's frame while the phone moves, and `onReset` when
 * the screen rotates. Readings keep coming while `allowed` is false, so the pose is current
 * when it turns true; the caller decides whether to redraw. Runs only on touch-first devices.
 *
 * Browsers with `DeviceOrientationEvent.requestPermission` (Safari on iOS, and Chromium since
 * it added the method) are asked once on load. Chromium, and Safari once allowed, grant it
 * then. Otherwise Safari only asks from a tap, so the first tap on the page itself, not on a
 * link or control, asks.
 */
export function watchTilt(
  onUp: (up: Vec3) => void,
  onReset: () => void,
  signal: AbortSignal,
  allowed: () => boolean,
) {
  if (!('DeviceOrientationEvent' in window)) return
  if (!window.matchMedia(coarsePointerQuery).matches) return
  const options = { signal }
  let listening = false

  function listen() {
    if (listening || signal.aborted) return
    listening = true
    window.addEventListener(
      'deviceorientation',
      (event) => {
        if (event.beta === null || event.gamma === null) return
        onUp(toScreen(upFromOrientation(event.beta, event.gamma), screenAngle()))
      },
      options,
    )
    // Safari before 16.4 has no screen.orientation, only the older window.orientation.
    if ('orientation' in screen) screen.orientation.addEventListener('change', onReset, options)
    else window.addEventListener('orientationchange', onReset, options)
  }

  // SAFETY: Safari on iOS and recent Chromium add this static method, which resolves to the
  // permission state; other browsers leave it undefined, which the check below handles.
  const { requestPermission } = DeviceOrientationEvent as OrientationPermission
  if (!requestPermission) {
    listen()
    return
  }
  const ask = () => requestPermission.call(DeviceOrientationEvent)
  const asking = new AbortController()
  signal.addEventListener('abort', () => asking.abort(), { once: true })
  function waitForTap() {
    document.addEventListener(
      'touchend',
      (event) => {
        if (!allowed()) return
        if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
        ask()
          .then((state) => {
            if (asking.signal.aborted) return
            asking.abort()
            if (state === 'granted') listen()
          })
          // Without a fresh tap, Safari refuses before asking; the next tap tries again.
          .catch(() => {})
      },
      { signal: asking.signal, passive: true },
    )
  }
  // Without a tap Safari refuses unless already allowed, and never shows its prompt.
  ask().then(
    (state) => (state === 'granted' ? listen() : waitForTap()),
    () => waitForTap(),
  )
}
