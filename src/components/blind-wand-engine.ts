import type { AmbientSettings } from '#/lib/ambient-settings'
import { sceneLight, wandPose } from '#/lib/sunlit-scene'
import type { SceneLight } from '#/lib/sunlit-scene'
import { getResolvedScheme, toggleScheme } from '#/lib/theme'
import { playThemeSound, warmThemeSounds } from '#/lib/theme-sounds'

import {
  facetLight,
  lightWand,
  mapRgb,
  mix,
  mixRgb,
  profileFacets,
  smoothstep,
  toCss,
} from './blind-wand-light'
import type { Facet, Rgb, WandLight } from './blind-wand-light'
import {
  HOLE_RADIUS,
  PIVOT_ABOVE,
  ROD_RADIUS,
  ROD_START,
  SECTIONS,
  TIP_END,
  TIP_START,
  UNMEASURED_LENGTH,
  hookPath,
  profiles,
  wandIds,
} from './blind-wand-shape'
import type { Section } from './blind-wand-shape'

// One and a half turns, so the flat tip comes to rest facing the room again.
const TWIST = Math.PI * 3
const SWING_LIMIT = 0.35
// About a 1.3 s period, like a 40 cm wand on a hook, and a few visible swings before it rests.
const SWING_STIFFNESS = ((2 * Math.PI) / 1.3) ** 2
const SWING_DAMPING = 1.5
// Turns over about 0.9 s and settles with a slight overshoot, like a wrist letting go.
const TWIST_STIFFNESS = 38
const TWIST_DAMPING = 9.5
const DRAG_THRESHOLD = 6
const restingAim = { aimX: 1.08, aimY: 0.45 }
const ROOM_LIGHT_X = -0.45 / Math.hypot(0.45, 0.9)
const ROOM_LIGHT_Z = 0.9 / Math.hypot(0.45, 0.9)

type Paint = { color: Rgb; opacity: number }

function sectionPaint(section: Section, facet: Facet, light: WandLight) {
  const { surface, sun, direct, night } = light
  const reach = direct * mix(1, 0.3, night)
  const { diffuse, specular } = facetLight(facet, light, section === 'tip' ? 14 : 36)
  // Clear acrylic: the wall shows through faces toward the viewer, while faces seen at a
  // grazing angle reflect the room: darker than a light wall, brighter than a dark one. The
  // flutes' valleys sit in their own shade, and the molded tip is slightly frosted.
  const grazing = (1 - facet.normalZ) ** 1.5
  const valley = mix(0.7, 1, smoothstep(0.78, 1, facet.ridge)) * mix(1, 1.25, night)
  const room = mix(0.52, 0.34, night)
  const frost = section === 'tip' ? mix(0.05, 0.08, night) : 0
  // A soft reflection of the room behind the viewer, up and to the left. It runs down one
  // face at a time, so it slides across the wand as it turns.
  const sheen = Math.max(0, facet.normalX * ROOM_LIGHT_X + facet.normalZ * ROOM_LIGHT_Z) ** 20
  const tint = (value: number) =>
    mix(mix(value, room, grazing * 0.85) * valley + frost, 1, sheen * 0.45)
  return {
    base: {
      color: mapRgb(surface, tint),
      opacity: section === 'tip' ? 0.94 : 0.9,
    },
    light: {
      color: mixRgb(sun, [1, 1, 1], specular * 0.6),
      opacity: reach * (0.14 + 0.38 * diffuse + specular) * valley,
    },
  }
}

/**
 * Writes facet colors into a horizontal gradient. Flat faces keep hard edges; a `smooth`
 * section blends from one face's center to the next, shading rounded flutes as curves.
 */
function paintStops(stops: SVGStopElement[], facets: Facet[], paints: Paint[], smooth: boolean) {
  const first = facets[0]
  const last = facets.at(-1)
  if (!first || !last) return
  const span = Math.max(last.right - first.left, 1e-6)
  // Gradient offsets must not decrease; faces hidden in a flute's valley would overlap.
  let reached = 0
  for (let slot = 0; slot * 2 + 1 < stops.length; slot++) {
    const index = Math.min(slot, facets.length - 1)
    const facet = facets[index]
    const paint = paints[index]
    if (!facet || !paint) continue
    const visible = slot < facets.length
    const left = (facet.left - first.left) / span
    const right = (facet.right - first.left) / span
    const center = (left + right) / 2
    const from = smooth && slot > 0 ? center : left
    const to = smooth && slot < facets.length - 1 ? center : right
    const start = visible ? Math.max(reached, from) : 1
    const end = visible ? Math.max(start, to) : 1
    reached = end
    const color = toCss(paint.color)
    const opacity = Math.min(1, Math.max(0, paint.opacity)).toFixed(3)
    for (const [stop, offset] of [
      [stops[slot * 2], start],
      [stops[slot * 2 + 1], end],
    ] as const) {
      stop?.setAttribute('offset', offset.toFixed(4))
      stop?.setAttribute('stop-color', color)
      stop?.setAttribute('stop-opacity', opacity)
    }
  }
}

/** Distance from an element's layout box to an ancestor's, ignoring entrance transforms. */
function offsetWithin(element: HTMLElement, ancestor: HTMLElement) {
  let left = 0
  let top = 0
  let current: Element | null = element
  while (current instanceof HTMLElement && current !== ancestor) {
    left += current.offsetLeft
    top += current.offsetTop
    current = current.offsetParent
  }
  return { left, top }
}

function readSurface(canvas: HTMLCanvasElement | null): Rgb {
  const fallback: Rgb = document.documentElement.classList.contains('dark')
    ? [0.09, 0.09, 0.09]
    : [0.98, 0.98, 0.98]
  const channels = canvas && getComputedStyle(canvas).backgroundColor.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return fallback
  return [Number(channels[0]) / 255, Number(channels[1]) / 255, Number(channels[2]) / 255]
}

export type WandEngine = {
  /** Repaints after a settings change. */
  wake: () => void
  /** Turns the wand to the scheme on screen, at once on mount and animated afterwards. */
  sync: (animate: boolean) => void
  dispose: () => void
}

/**
 * Runs the wand: measures it against the page, simulates its swing and twist, lights it from
 * the Sunlit scene, and handles brushing, dragging, and turning it. Everything it adds is
 * removed by `dispose`.
 */
export function startBlindWand(
  button: HTMLButtonElement,
  id: string,
  getSettings: () => AmbientSettings,
): WandEngine | null {
  const host = button.closest('main')
  const svg = button.querySelector('svg')
  if (!host || !svg) return null
  // Hoisted handlers below read this without the narrowing above.
  const main: HTMLElement = host
  const ids = wandIds(id)
  const canvas = main.querySelector('canvas')
  const listeners = new AbortController()
  const options = { signal: listeners.signal }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const query = <T extends Element>(selector: string) => [...svg.querySelectorAll<T>(selector)]
  const swing = svg.querySelector<SVGGElement>('[data-wand-swing]')
  const hit = svg.querySelector<SVGLineElement>('[data-wand-hit]')
  const hook = svg.querySelector<SVGPathElement>('[data-wand-hook]')
  const hole = svg.querySelector<SVGEllipseElement>('[data-wand-hole]')
  const focusRing = svg.querySelector<SVGRectElement>('[data-wand-focus]')
  const stripes = svg.querySelector<SVGLinearGradientElement>(`#${ids.stripes}`)
  const stripeStops = query<SVGStopElement>(`#${ids.stripes} stop`)
  const shadeStops = query<SVGStopElement>(`#${ids.shade} stop`)
  const shade = svg.querySelector<SVGLinearGradientElement>(`#${ids.shade}`)
  const parts = SECTIONS.map((section) => ({
    section,
    rects: query<SVGRectElement>(`[data-wand-section="${section}"]`),
    base: query<SVGStopElement>(`#${ids.gradient(section, 'base')} stop`),
    light: query<SVGStopElement>(`#${ids.gradient(section, 'light')} stop`),
  }))

  let width = 1
  let height = 1
  let pivotX = 0
  let length = UNMEASURED_LENGTH
  let angle = 0
  let swingVelocity = 0
  let turnTarget = getResolvedScheme() === 'dark' ? TWIST : 0
  let turn = turnTarget
  let turnVelocity = 0
  let fallbackNight = turnTarget > 0 ? 1 : 0
  let fallbackSurface = readSurface(canvas)
  let surfaceTarget = fallbackSurface
  let tipWidth = ROD_RADIUS
  let drag: { pointerId: number; startX: number; startY: number; target: number } | null = null
  let moved = false
  let suppressClick = false
  let frameId = 0
  let lastTime = 0
  let previousPointer: { x: number; y: number; time: number } | null = null

  const pointerIn = (event: PointerEvent) => {
    const bounds = main.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }
  const rodX = (y: number) => pivotX + (y + PIVOT_ABOVE) * Math.tan(angle)

  function measure() {
    width = Math.max(main.clientWidth, 1)
    height = Math.max(main.clientHeight, 1)
    const row = button.parentElement
    if (!row) return
    const { left, top } = offsetWithin(row, main)
    const reach = top + row.offsetHeight
    button.style.height = `${reach}px`
    pivotX = left + button.offsetLeft + button.offsetWidth / 2
    length = reach + PIVOT_ABOVE
    layout()
    wake()
  }

  // Geometry along the wand that only changes with its length.
  function layout() {
    const spans = { tip: [TIP_START, TIP_END - TIP_START], rod: [ROD_START, length - ROD_START] }
    for (const { section, rects } of parts) {
      const [y, size] = spans[section]
      for (const rect of rects) {
        rect.setAttribute('y', String(y))
        rect.setAttribute('height', String(Math.max(0, size)))
      }
    }
    hit?.setAttribute('y2', String(length))
    focusRing?.setAttribute('height', String(length - ROD_START + 4))
    stripes?.setAttribute('y2', String(length))
    shade?.setAttribute('y2', String(length))
  }

  function scene(): SceneLight {
    return (
      sceneLight.get() ?? {
        night: fallbackNight,
        direction: turnTarget > 0 ? 1 : 0,
        entrance: 0,
        entranceNight: 0,
        ...restingAim,
        surface: fallbackSurface,
      }
    )
  }

  function paint() {
    const downX = Math.sin(angle)
    const downY = Math.cos(angle)
    const last = Math.max(stripeStops.length - 1, 1)
    const points = stripeStops.map((_, index) => {
      const along = TIP_START + ((length - TIP_START) * index) / last
      return [(pivotX + downX * along) / width, (downY * along - PIVOT_ABOVE) / height] as const
    })
    const current = getSettings()
    const light = lightWand(current, scene(), points, width / height, current.wand.depth)
    // The static fallback background has no direct light, so neither does the wand.
    if (!sceneLight.get()) light.direct = 0
    // Slats shade the wand as they shade the wall: by the share of light that is direct.
    const shadeColor = toCss(mapRgb(light.surface, (value) => value * 0.25))
    for (const [index, stop] of stripeStops.entries()) {
      const through = light.stripes[index] ?? 1
      stop.setAttribute('stop-opacity', through.toFixed(3))
      shadeStops[index]?.setAttribute('stop-color', shadeColor)
      shadeStops[index]?.setAttribute(
        'stop-opacity',
        // A clear rod mostly shows the wall through it, so the slats darken it less.
        (light.direct * (1 - through) * 0.55).toFixed(3),
      )
    }
    for (const { section, rects, base, light: lit } of parts) {
      const facets = profileFacets(profiles[section], turn)
      const first = facets[0]
      const final = facets.at(-1)
      if (!first || !final) continue
      if (section === 'tip') tipWidth = ((final.right - first.left) * ROD_RADIUS) / 2
      for (const rect of rects) {
        rect.setAttribute('x', (first.left * ROD_RADIUS).toFixed(3))
        rect.setAttribute('width', ((final.right - first.left) * ROD_RADIUS).toFixed(3))
      }
      const paints = facets.map((facet) => sectionPaint(section, facet, light))
      paintStops(
        base,
        facets,
        paints.map((entry) => entry.base),
        section === 'rod',
      )
      paintStops(
        lit,
        facets,
        paints.map((entry) => entry.light),
        section === 'rod',
      )
    }
    // The hole faces the room at rest and closes to a slit as the flat tip turns edge-on.
    const facing = Math.abs(Math.cos(turn))
    hole?.setAttribute('rx', (HOLE_RADIUS * smoothstep(0.12, 1, facing)).toFixed(3))
    hook?.setAttribute('d', hookPath(turn))
    const metal = mixRgb(light.surface, [0.55, 0.57, 0.6], 0.6)
    hook?.setAttribute('stroke', toCss(mixRgb(metal, light.sun, light.direct * 0.4)))
    const degrees = ((-angle * 180) / Math.PI).toFixed(3)
    swing?.setAttribute('transform', `translate(0 ${-length}) rotate(${degrees})`)
    wandPose.set({
      x: pivotX / width,
      y: -PIVOT_ABOVE / height,
      angle,
      tipStart: TIP_START / height,
      tipEnd: TIP_END / height,
      tipWidth: tipWidth / height,
      length: length / height,
      radius: ROD_RADIUS / height,
    })
  }

  function wake() {
    if (!frameId) frameId = requestAnimationFrame(step)
  }

  function step(now: number) {
    frameId = 0
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60
    lastTime = now
    const still = reducedMotion.matches
    if (still) {
      angle = swingVelocity = turnVelocity = 0
      turn = turnTarget
    } else {
      // Semi-implicit Euler in small substeps keeps the stiff twist spring stable.
      const substeps = Math.ceil(delta * 240)
      const dt = delta / substeps
      for (let index = 0; index < substeps; index++) {
        let swingForce = -SWING_STIFFNESS * angle - SWING_DAMPING * swingVelocity
        if (drag) swingForce += 140 * (drag.target - angle) - 14 * swingVelocity
        swingVelocity += swingForce * dt
        angle = Math.max(-SWING_LIMIT, Math.min(SWING_LIMIT, angle + swingVelocity * dt))
        const twistForce = TWIST_STIFFNESS * (turnTarget - turn) - TWIST_DAMPING * turnVelocity
        turnVelocity += twistForce * dt
        turn += turnVelocity * dt
      }
    }
    const nightTarget = turnTarget > 0 ? 1 : 0
    fallbackNight = still
      ? nightTarget
      : fallbackNight + (nightTarget - fallbackNight) * (1 - Math.exp(-delta * 3))
    // Follow the page's short color fade when no renderer supplies the surface.
    const fade = still ? 1 : 1 - Math.exp(-delta * 16)
    fallbackSurface = mixRgb(fallbackSurface, surfaceTarget, fade)
    const settled =
      !drag &&
      Math.abs(angle) + Math.abs(swingVelocity) < 1e-4 &&
      Math.abs(turnTarget - turn) + Math.abs(turnVelocity) < 1e-4 &&
      Math.abs(nightTarget - fallbackNight) < 1e-3 &&
      fallbackSurface.every(
        (channel, index) => Math.abs(channel - (surfaceTarget[index] ?? channel)) < 1e-3,
      )
    if (settled) {
      angle = swingVelocity = turnVelocity = 0
      turn = turnTarget
      fallbackNight = nightTarget
      fallbackSurface = surfaceTarget
      lastTime = 0
    }
    paint()
    if (!settled) wake()
  }

  // Brushing past the rod nudges it the way the pointer travels.
  function brush(event: PointerEvent) {
    if (event.pointerType === 'touch' || drag || reducedMotion.matches) return
    const point = pointerIn(event)
    const previous = previousPointer
    previousPointer = { ...point, time: event.timeStamp }
    if (!previous) return
    const elapsed = (event.timeStamp - previous.time) / 1000
    if (elapsed <= 0 || elapsed > 0.1) return
    if (point.y < TIP_START - PIVOT_ABOVE || point.y > length - PIVOT_ABOVE) return
    const before = previous.x - rodX(previous.y)
    const after = point.x - rodX(point.y)
    if (Math.sign(before) === Math.sign(after)) return
    const velocity = (point.x - previous.x) / elapsed
    const leverage = (point.y + PIVOT_ABOVE) / length
    const push = (velocity / length) * 0.5 * leverage
    swingVelocity += Math.max(-0.35, Math.min(0.35, push))
    wake()
  }

  function grab(event: PointerEvent) {
    if (event.button !== 0 || !hit) return
    warmThemeSounds()
    hit.setPointerCapture(event.pointerId)
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      target: angle,
    }
    moved = false
    hit.dataset.dragging = ''
    wake()
  }

  function pull(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
    if (distance > DRAG_THRESHOLD) moved = true
    if (!moved) return
    const point = pointerIn(event)
    const target = Math.atan2(point.x - pivotX, point.y + PIVOT_ABOVE)
    drag.target = Math.max(-SWING_LIMIT, Math.min(SWING_LIMIT, target))
    wake()
  }

  function release(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    drag = null
    suppressClick = moved
    if (hit) delete hit.dataset.dragging
    wake()
  }

  function activate() {
    // A drag swings the wand; only a touch or a key press turns it.
    if (suppressClick) {
      suppressClick = false
      return
    }
    playThemeSound(toggleScheme())
  }

  const engine: Omit<WandEngine, 'dispose'> = {
    wake,
    sync(animate) {
      const next = getResolvedScheme()
      const target = next === 'dark' ? TWIST : 0
      if (target === turnTarget) return
      turnTarget = target
      surfaceTarget = readSurface(canvas)
      if (!animate) turn = target
      // A twist of the wrist jostles the wand on its hook.
      else if (!reducedMotion.matches) swingVelocity += next === 'dark' ? 0.18 : -0.18
      wake()
    },
  }

  main.addEventListener('pointermove', brush, { ...options, passive: true })
  main.addEventListener(
    'pointerleave',
    () => {
      previousPointer = null
    },
    options,
  )
  hit?.addEventListener('pointerdown', grab, options)
  hit?.addEventListener('pointermove', pull, options)
  hit?.addEventListener('pointerup', release, options)
  hit?.addEventListener('pointercancel', release, options)
  button.addEventListener('click', activate, options)
  reducedMotion.addEventListener('change', wake, options)
  const unsubscribe = sceneLight.subscribe(wake)
  const resizeObserver = new ResizeObserver(measure)
  resizeObserver.observe(main)
  const anchor = main.querySelector('[data-sunlit-anchor]')
  if (anchor) resizeObserver.observe(anchor)
  measure()

  return {
    ...engine,
    dispose() {
      listeners.abort()
      unsubscribe()
      resizeObserver.disconnect()
      cancelAnimationFrame(frameId)
      wandPose.set(null)
    },
  }
}
