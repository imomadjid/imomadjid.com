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
 * The classes that let a `[data-recede]` wrapper shrink: it scales only while `data-receded`, so
 * it forms a stacking context only then, and not at all with reduced motion.
 */
export const recedeClass =
  'origin-(--recede-origin) transition-[scale] duration-(--recede-duration) ease-(--recede-ease) motion-safe:data-receded:scale-(--recede-scale)'

/**
 * Shrinks the `[data-recede]` wrapper that holds `from` (the page below About in
 * src/routes/index.tsx, or the See more overlay's photos) about the middle of the viewport, or
 * brings it back, as iOS shrinks the Home Screen behind an opening app. The wrapper scales in CSS, on a spring sampled into a
 * `linear()` easing; it scales only while receded, so it forms a stacking context only then.
 * The point it shrinks about is in its own box, so it scrolls with it (revealReceded).
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
    placeOrigin(page)
    page.setAttribute('data-receded', '')
  } else {
    page.removeAttribute('data-receded')
  }
}

/**
 * Where `page`'s box sits on screen at full size: its layout position, which its scale doesn't
 * move. The overlay's photos sit in a scrolling popup, so its scroll counts too.
 */
function layoutBox(page: HTMLElement) {
  const parent = page.offsetParent ?? document.documentElement
  const box = parent.getBoundingClientRect()
  return {
    left: box.left + parent.clientLeft + page.offsetLeft - parent.scrollLeft,
    top: box.top + parent.clientTop + page.offsetTop - parent.scrollTop,
  }
}

/**
 * Sets the point `page` shrinks about to the viewport's middle, in its own box (from its layout
 * position, so a shrink that starts while the last one is still easing back measures it
 * unscaled). Being in the page's box, it scrolls with the page.
 */
function placeOrigin(page: HTMLElement) {
  const { left, top } = layoutBox(page)
  const x = window.innerWidth / 2 - left
  const y = window.innerHeight / 2 - top
  page.style.setProperty('--recede-origin', `${x}px ${y}px`)
  page.dataset.recedeOrigin = `${x} ${y}`
}

/**
 * Scrolls `element` smoothly into view if it isn't all in view, as little as it takes. The open
 * photo's lightbox does this behind its backdrop when it steps to a photo whose tile is out of
 * view, so the close flies home to a tile on screen. The receded page scrolls about the point it
 * shrinks about, which moves with it, so it keeps its place and `fullScaleRect` still holds.
 */
export function revealReceded(element: Element) {
  const rect = element.getBoundingClientRect()
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return
  element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
  if (!page || !origin || !(scale > 0) || scale === 1) return rect
  // The point it shrinks about, on screen now: the page may have scrolled since it receded.
  const { left, top } = layoutBox(page)
  const x = left + origin[0]
  const y = top + origin[1]
  return {
    x: x + (rect.x - x) / scale,
    y: y + (rect.y - y) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  }
}
