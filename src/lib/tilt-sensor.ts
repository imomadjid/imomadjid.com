import { type Vec3, toScreen, upFromOrientation } from './device-tilt'

// The motion sensor half of phone tilt. Only the lazily loaded renderer imports it; the wand
// imports the light math from device-tilt.ts eagerly.

type OrientationPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

// Controls a tap could mean to use. Landmark roles and tabindex="-1" focus targets wrap
// plain page content, so they don't count.
const INTERACTIVE = [
  'a[href], button, input, select, textarea, label, summary',
  '[role="button"], [role="link"], [role="slider"], [role="switch"], [role="tab"]',
  '[role="menuitem"], [role="checkbox"], [role="radio"], [tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Calls `onUp` with world up in the screen's frame while the phone moves, and `onReset` when
 * the screen rotates. Runs only on touch-first devices. Safari on iOS asks before it shares
 * motion, and only from a tap: the first tap on the page itself, not on a link or control,
 * asks once. Elsewhere readings start straight away.
 */
export function watchTilt(
  onUp: (up: Vec3) => void,
  onReset: () => void,
  signal: AbortSignal,
  allowed: () => boolean,
) {
  if (!('DeviceOrientationEvent' in window)) return
  if (!window.matchMedia('(pointer: coarse)').matches) return
  const options = { signal }

  function listen() {
    window.addEventListener(
      'deviceorientation',
      (event) => {
        if (event.beta === null || event.gamma === null) return
        const up = upFromOrientation(event.beta, event.gamma)
        onUp(toScreen(up, screen.orientation?.angle ?? 0))
      },
      options,
    )
    screen.orientation?.addEventListener('change', onReset, options)
  }

  // SAFETY: Safari on iOS adds this static method, which resolves to the permission state;
  // other browsers leave it undefined, which the check below handles.
  const { requestPermission } = DeviceOrientationEvent as OrientationPermission
  if (!requestPermission) {
    listen()
    return
  }
  const asking = new AbortController()
  signal.addEventListener('abort', () => asking.abort(), { once: true })
  document.addEventListener(
    'touchend',
    (event) => {
      if (!allowed()) return
      if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
      requestPermission
        .call(DeviceOrientationEvent)
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
