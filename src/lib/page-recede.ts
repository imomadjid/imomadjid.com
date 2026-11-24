import type { TransitionConfig } from 'dialkit'

import { cssSpring } from '#/lib/flight-springs'
import type { Rect } from '#/lib/gallery-flight-geometry'

export type RecedeTuning = {
  /** How small the page gets behind an open Gallery dialog: 0.94 is 94%. */
  scale: number
  /** The spring it shrinks on. */
  open: TransitionConfig
  /** The spring it comes back on, quicker than the shrink. */
  close: TransitionConfig
}

/**
 * Shrinks the part of the page that holds `from` (the `[data-recede]` wrapper in
 * src/routes/index.tsx) about the middle of the viewport, or brings it back, as iOS shrinks the
 * Home Screen behind an opening app. The wrapper scales in CSS, on a spring sampled into a
 * `linear()` easing; it scales only while receded, so it forms a stacking context only then.
 * Scrolling is locked while a dialog is open, so the middle it shrinks about stays put.
 */
export function recedePage(from: Element, receded: boolean, tuning: RecedeTuning) {
  const page = from.closest<HTMLElement>('[data-recede]')
  if (!page) return
  page.style.setProperty('--recede-scale', String(tuning.scale))
  if (receded === page.hasAttribute('data-receded')) return
  const { duration, easing } = cssSpring(receded ? tuning.open : tuning.close)
  page.style.setProperty('--recede-duration', `${duration}s`)
  page.style.setProperty('--recede-ease', easing)
  if (receded) {
    // The viewport's middle in the wrapper's own box, from its layout position, so a shrink that
    // starts while the last one is still easing back measures it unscaled.
    const parent = page.offsetParent ?? document.documentElement
    const box = parent.getBoundingClientRect()
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    page.style.setProperty(
      '--recede-origin',
      `${x - box.left - page.offsetLeft}px ${y - box.top - page.offsetTop}px`,
    )
    page.dataset.recedeOrigin = `${x} ${y}`
    page.setAttribute('data-receded', '')
  } else {
    page.removeAttribute('data-receded')
  }
}

/**
 * Where `element` sits once the receded page around it is back to full size: its box now, scaled
 * back up about the point the page shrinks about. A photo flying back to its tile lands there,
 * while the page grows back under it.
 */
export function fullScaleRect(element: Element): Rect {
  const rect = element.getBoundingClientRect()
  const page = element.closest<HTMLElement>('[data-recede]')
  const scale = page ? Number.parseFloat(getComputedStyle(page).scale) : Number.NaN
  const origin = page?.dataset.recedeOrigin?.split(' ').map(Number)
  if (!origin || !(scale > 0) || scale === 1) return rect
  const [x, y] = origin
  return {
    x: x + (rect.x - x) / scale,
    y: y + (rect.y - y) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  }
}
