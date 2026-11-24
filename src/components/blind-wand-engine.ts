import { play } from 'cuelume'

import type { AmbientSettings } from '#/lib/ambient-settings'
import { lightFrame, lightOverscan } from '#/lib/light-frame'
import { wakeSound } from '#/lib/sound'
import { sceneLight, wandPose } from '#/lib/sunlit-scene'
import type { SceneLight } from '#/lib/sunlit-scene'
import { getResolvedScheme, toggleScheme } from '#/lib/theme'
import type { Scheme } from '#/lib/theme'

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
  HANG_Y,
  HOLE_RADIUS,
  HOLE_Y,
  PIVOT_ABOVE,
  ROD_RADIUS,
  ROD_START,
  SECTIONS,
  TAPER_START,
  TIP_CORNER,
  TIP_START,
  UNMEASURED_LENGTH,
  hookPaths,
  profiles,
  rodPath,
  tipPath,
  wandIds,
} from './blind-wand-shape'
import type { Section } from './blind-wand-shape'

// One and a half turns, so the flat tip comes to rest facing the room again.
const TWIST = Math.PI * 3
const SWING_LIMIT = 0.35
// About a 1.3 s period, like a 40 cm wand on a hook, and a few visible swings before it rests.
const SWING_STIFFNESS = ((2 * Math.PI) / 1.3) ** 2
const SWING_DAMPING = 2.5
// Opening turns over about 0.9 s and settles with a slight overshoot, like a wrist letting go;
// most of it is seen within 0.5 s, just ahead of the sunrise, whose change reads mostly in its
// first 0.4 s. The sunset is felt over about 0.8 s, from a quarter second in, so closing runs
// the same spring at half speed: the wand still leads the room by about 0.15 s.
// Each spring's top spin, about 24 and 12 rad/s, sets how loud its gear ticks get; the slower
// closing turn ticks a little softer.
const OPENING = { stiffness: 38, damping: 9.5, tickSpeed: 20 }
const CLOSING = { stiffness: 38 / 4, damping: 9.5 / 2, tickSpeed: 12 }
const DRAG_THRESHOLD = 6
// A tap's own click, if the browser sends one, follows within this many ms.
const TAP_CLICK_WINDOW = 800
const BOX_BELOW = 16
// Hovering starts the turn a little, so the hook and hole move before the click.
const HOVER_TWIST = 0.3
// Opening switches the theme once the twist is this far along, so the page changes with the
// wand. Closing switches soon after the press instead, so the sunset's slow start overlaps the
// turn rather than following it.
const SWITCH_PROGRESS = 0.4
const CLOSING_SWITCH_DELAY = 0.1
// The tilter's gear: eight teeth tick by over a full turn of the wand, loudest near the middle
// of the turn, where it spins fastest.
const TOOTH = TWIST / 8
// Brushing past swings the wand in proportion to the pointer's speed, up to a firm knock.
const BRUSH_GAIN = 0.15
const BRUSH_LIMIT = 0.5
const restingAim = { aimX: 1.08, aimY: 0.45 }
const ROOM_LIGHT_X = -0.45 / Math.hypot(0.45, 0.9)
const ROOM_LIGHT_Z = 0.9 / Math.hypot(0.45, 0.9)

type Paint = { color: Rgb; opacity: number }

function sectionPaint(section: Section, facet: Facet, light: WandLight) {
  const { surface, sun, direct, night } = light
  const reach = direct * mix(1, 0.3, night)
  const { diffuse, specular } = facetLight(facet, light, section === 'tip' ? 14 : 36)
  // Clear acrylic is a window onto the wall behind it. Only toward its silhouette, where the
  // view refracts and reflects off at a grazing angle, does it show the room instead: darker
  // than a light wall, brighter than a dark one. The flutes' valleys catch a little of that
  // too, which keeps the ribs visible, and the molded tip is lightly frosted.
  const edge = smoothstep(0.05, 0.7, 1 - facet.normalZ)
  const valley = section === 'rod' ? 1 - smoothstep(0.78, 1, facet.ridge) : 0
  const lightness = (surface[0] + surface[1] + surface[2]) / 3
  const room = lightness > 0.5 ? 0.4 : 0.36
  const roomShare = Math.min(1, edge + valley * 0.35)
  const clear = section === 'tip' ? 0.2 : 0.1
  // A soft reflection of the room behind the viewer, up and to the left. It runs down one
  // face at a time, so it slides across the wand as it turns.
  const sheen = Math.max(0, facet.normalX * ROOM_LIGHT_X + facet.normalZ * ROOM_LIGHT_Z) ** 20
  const tint = (value: number) => mix(mix(value, room, roomShare), 1, sheen * 0.5)
  return {
    base: {
      color: mapRgb(surface, tint),
      opacity: Math.max(mix(clear, 0.92, roomShare), sheen * 0.55),
    },
    light: {
      color: mixRgb(sun, [1, 1, 1], specular * 0.6),
      opacity: reach * (0.1 + 0.3 * diffuse + specular) * (1 - valley * 0.3),
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
  onInteract: () => void,
): WandEngine | null {
  const host = button.closest('main')
  const svg = button.querySelector('svg')
  if (!host || !svg) return null
  // Hoisted handlers below read this without the narrowing above.
  const main: HTMLElement = host
  const box: SVGSVGElement = svg
  const ids = wandIds(id)
  const canvas = main.querySelector('canvas')
  const listeners = new AbortController()
  const options = { signal: listeners.signal }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const query = <T extends Element>(selector: string) => [...svg.querySelectorAll<T>(selector)]
  const hang = svg.querySelector<SVGGElement>('[data-wand-hang]')
  const swings = query<SVGGElement>('[data-wand-swing]')
  const hit = svg.querySelector<SVGLineElement>('[data-wand-hit]')
  const hooks = query<SVGPathElement>('[data-wand-hook]')
  const holes = query<SVGEllipseElement>('[data-wand-hole]')
  const focusRing = svg.querySelector<SVGRectElement>('[data-wand-focus]')
  const stripes = svg.querySelector<SVGLinearGradientElement>(`#${ids.stripes}`)
  const stripeStops = query<SVGStopElement>(`#${ids.stripes} stop`)
  const shadeStops = query<SVGStopElement>(`#${ids.shade} stop`)
  const shade = svg.querySelector<SVGLinearGradientElement>(`#${ids.shade}`)
  const parts = SECTIONS.map((section) => ({
    section,
    layers: query<SVGPathElement>(`[data-wand-section="${section}"]`),
    gradients: (['base', 'light'] as const).flatMap((layer) =>
      query<SVGLinearGradientElement>(`#${ids.gradient(section, layer)}`),
    ),
    base: query<SVGStopElement>(`#${ids.gradient(section, 'base')} stop`),
    light: query<SVGStopElement>(`#${ids.gradient(section, 'light')} stop`),
  }))

  // The light's frame (src/lib/light-frame.ts), in viewport pixels, and where `main` sits in it.
  // The wand scrolls with the page through light that stays put, so this moves as it scrolls.
  let width = 1
  let height = 1
  let originX = 0
  let originY = 0
  let pivotX = 0
  let length = UNMEASURED_LENGTH
  let angle = 0
  let swingVelocity = 0
  let turnTarget = getResolvedScheme() === 'dark' ? TWIST : 0
  let turn = turnTarget
  let turnVelocity = 0
  // The turn's starting point and the scheme it is turning to, until the theme switches.
  let twistFrom = turn
  let twistStartedAt = 0
  let pending: Scheme | null = null
  // Only turns someone made are heard; the system changing the theme turns the wand silently.
  let voiced = false
  // Teeth sit between rest positions, so the hover pre-twist never ticks.
  let tooth = Math.round(turn / TOOTH)
  let hovering = false
  let fallbackNight = turnTarget > 0 ? 1 : 0
  let fallbackSurface = readSurface(canvas)
  let surfaceTarget = fallbackSurface
  let tipWidth = ROD_RADIUS
  let drag: { pointerId: number; startX: number; startY: number; target: number } | null = null
  let moved = false
  let suppressClick = false
  // When a touch last let go, so the click that may follow it does not turn the wand again.
  let touchedAt = -Infinity
  let frameId = 0
  let lastTime = 0
  let previousPointer: { x: number; y: number; time: number } | null = null

  const pointerIn = (event: PointerEvent) => {
    const bounds = main.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }
  // The wand swings from where its hole hangs on the hook, in page pixels.
  const hangTop = HANG_Y - PIVOT_ABOVE
  const rodX = (y: number) => pivotX + (y - hangTop) * Math.tan(angle)

  let overscan = 0

  function frameLight() {
    const scene = main.getBoundingClientRect()
    // Without a canvas, light the wand as if the wall were `main` itself.
    const light = canvas ? lightFrame(canvas, overscan) : scene
    width = Math.max(light.width, 1)
    height = Math.max(light.height, 1)
    originX = scene.left - light.left
    originY = scene.top - light.top
  }

  // Scroll events run before this frame's animation callbacks, so painting here lets the
  // renderer draw the shadow in the same frame the wand moves.
  function follow() {
    frameLight()
    paint()
  }

  function measure() {
    if (canvas) overscan = lightOverscan(canvas)
    frameLight()
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
  // Half the width of the SVG's box, so it covers the wand at full swing: Safari only hit
  // tests what lies inside it, not everything an overflowing SVG draws.
  let boxHalfWidth = 0

  function layout() {
    const reach = length - PIVOT_ABOVE
    boxHalfWidth = Math.ceil(length * Math.sin(SWING_LIMIT) + ROD_RADIUS * 4 + 16)
    box.setAttribute('width', String(boxHalfWidth * 2))
    // It also runs past the rod's end, under the hit line's round cap.
    box.setAttribute('height', String(Math.max(reach, 1) + BOX_BELOW))
    box.style.marginLeft = `${-boxHalfWidth}px`
    box.style.marginBottom = `${-BOX_BELOW}px`
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
        phoneTilt: [0, 0, 0],
        plumb: 0,
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
      const reach = along - HANG_Y
      return [
        (originX + pivotX + downX * reach) / width,
        (originY + hangTop + downY * reach) / height,
      ] as const
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
        (light.direct * (1 - through) * 0.35).toFixed(3),
      )
    }
    const edges = { rod: [-ROD_RADIUS, ROD_RADIUS], tip: [-ROD_RADIUS, ROD_RADIUS] }
    for (const { section, base, light: lit } of parts) {
      const facets = profileFacets(profiles[section], turn)
      const first = facets[0]
      const final = facets.at(-1)
      if (!first || !final) continue
      edges[section] = [first.left * ROD_RADIUS, final.right * ROD_RADIUS]
      if (section === 'tip') tipWidth = ((final.right - first.left) * ROD_RADIUS) / 2
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
    const [rodLeft, rodRight] = edges.rod
    const [tipLeft, tipRight] = edges.tip
    const outlines = {
      rod: rodPath(rodLeft, rodRight, length),
      tip: tipPath(tipLeft, tipRight, rodLeft, rodRight),
    }
    for (const { section, layers, gradients } of parts) {
      const [left, right] = edges[section]
      for (const layer of layers) layer.setAttribute('d', outlines[section])
      // Faces map across the section's own width; the taper below the tip reuses its middle.
      for (const gradient of gradients) {
        gradient.setAttribute('x1', left.toFixed(3))
        gradient.setAttribute('x2', right.toFixed(3))
      }
    }
    // The hole faces the room at rest and closes to a slit as the flat tip turns edge-on.
    const facing = Math.abs(Math.cos(turn))
    const holeWidth = HOLE_RADIUS * smoothstep(0.12, 1, facing)
    for (const hole of holes) hole.setAttribute('rx', holeWidth.toFixed(3))
    const hookPath = hookPaths(turn)
    const metal = mixRgb(light.surface, [0.55, 0.57, 0.6], 0.6)
    for (const hook of hooks) {
      const front = hook.dataset.wandHook === 'front'
      hook.setAttribute('d', front ? hookPath.front : hookPath.back)
      hook.setAttribute('stroke', toCss(mixRgb(metal, light.sun, light.direct * 0.4)))
    }
    const degrees = ((-angle * 180) / Math.PI).toFixed(3)
    hang?.setAttribute('transform', `translate(${boxHalfWidth} ${-PIVOT_ABOVE})`)
    for (const swing of swings) swing.setAttribute('transform', `rotate(${degrees} 0 ${HANG_Y})`)
    // The scene measures the wand from its top along its length, so hand it the point the
    // swinging wand would reach at the hook's height, in the light's frame.
    wandPose.set({
      x: (originX + pivotX - downX * HANG_Y) / width,
      y: (originY + hangTop - downY * HANG_Y) / height,
      angle,
      hang: HANG_Y / height,
      tipStart: TIP_START / height,
      tipWidth: tipWidth / height,
      tipCorner: TIP_CORNER / height,
      taperStart: TAPER_START / height,
      rodStart: ROD_START / height,
      holeY: HOLE_Y / height,
      holeWidth: holeWidth / height,
      holeHeight: HOLE_RADIUS / height,
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
    const preview = hovering && !drag && !still ? (turnTarget > 0 ? -HOVER_TWIST : HOVER_TWIST) : 0
    const aim = turnTarget + preview
    const spring = turnTarget > 0 ? CLOSING : OPENING
    // Rolling the phone turns gravity within the screen, so the wand swings to hang plumb.
    const plumb = Math.max(-SWING_LIMIT * 0.9, Math.min(SWING_LIMIT * 0.9, scene().plumb))
    if (still) {
      angle = swingVelocity = turnVelocity = 0
      turn = turnTarget
    } else {
      // Semi-implicit Euler in small substeps keeps the stiff twist spring stable.
      const substeps = Math.ceil(delta * 240)
      const dt = delta / substeps
      for (let index = 0; index < substeps; index++) {
        let swingForce = -SWING_STIFFNESS * (angle - plumb) - SWING_DAMPING * swingVelocity
        if (drag) swingForce += 140 * (drag.target - angle) - 14 * swingVelocity
        swingVelocity += swingForce * dt
        angle = Math.max(-SWING_LIMIT, Math.min(SWING_LIMIT, angle + swingVelocity * dt))
        const twistForce = spring.stiffness * (aim - turn) - spring.damping * turnVelocity
        turnVelocity += twistForce * dt
        turn += turnVelocity * dt
      }
    }
    const nextTooth = Math.round(turn / TOOTH)
    if (nextTooth !== tooth) {
      // A gear tooth passing: cuelume's slider step, the way the wand turns, softer when slow.
      if (voiced && !still) {
        play('select', {
          emphasis: 'subtle',
          direction: turnVelocity < 0 ? 'back' : 'forward',
          volume: 0.5 + 0.5 * Math.min(1, Math.abs(turnVelocity) / spring.tickSpeed),
        })
      }
      tooth = nextTooth
    }
    const progress = (turn - twistFrom) / (turnTarget - twistFrom || 1)
    if (pending) {
      const due =
        pending === 'dark'
          ? (now - twistStartedAt) / 1000 >= CLOSING_SWITCH_DELAY
          : progress >= SWITCH_PROGRESS
      if (still || due) switchTheme()
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
      !pending &&
      Math.abs(angle - plumb) + Math.abs(swingVelocity) < 5e-4 &&
      // A few thousandths of a radian is far below a pixel on the rod, and the slower closing
      // spring would otherwise keep redrawing the scene for seconds.
      Math.abs(aim - turn) + Math.abs(turnVelocity) < 5e-3 &&
      Math.abs(nightTarget - fallbackNight) < 1e-3 &&
      fallbackSurface.every(
        (channel, index) => Math.abs(channel - (surfaceTarget[index] ?? channel)) < 1e-3,
      )
    if (settled) {
      voiced = false
      angle = still ? 0 : plumb
      swingVelocity = turnVelocity = 0
      turn = aim
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
    const arm = length - HANG_Y
    // Above the hook the tip can't be pushed round it.
    const leverage = Math.max(0, point.y - hangTop) / arm
    const push = (velocity / arm) * BRUSH_GAIN * leverage
    swingVelocity += Math.max(-BRUSH_LIMIT, Math.min(BRUSH_LIMIT, push))
    wake()
  }

  function grab(event: PointerEvent) {
    if (event.button !== 0 || !hit) return
    onInteract()
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
    const target = Math.atan2(point.x - pivotX, point.y - hangTop)
    drag.target = Math.max(-SWING_LIMIT, Math.min(SWING_LIMIT, target))
    wake()
  }

  function release(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    drag = null
    if (hit) delete hit.dataset.dragging
    if (event.pointerType === 'mouse') suppressClick = moved
    else {
      // Taps turn the wand as they lift: Safari on iOS can withhold the click after a touch
      // that sets the wand moving.
      touchedAt = performance.now()
      if (event.type === 'pointerup' && !moved) turnWand()
    }
    wake()
  }

  function click() {
    // A drag swings the wand; a click or a key press turns it, and a tap already has.
    if (suppressClick) {
      suppressClick = false
      return
    }
    if (performance.now() - touchedAt < TAP_CLICK_WINDOW) return
    turnWand()
  }

  function turnWand() {
    onInteract()
    // Turns first; the page follows partway through the turn. Turning again before then
    // turns back to the scheme still on screen.
    const shown = getResolvedScheme()
    const next: Scheme = (pending ?? shown) === 'dark' ? 'light' : 'dark'
    voiced = true
    // The ticks play from animation frames, so audio has to start here, in the gesture.
    wakeSound()
    pending = next === shown ? null : next
    twistFrom = turn
    twistStartedAt = performance.now()
    turnTarget = next === 'dark' ? TWIST : 0
    // A twist of the wrist jostles the wand on its hook.
    if (!reducedMotion.matches) swingVelocity += next === 'dark' ? 0.18 : -0.18
    wake()
  }

  function switchTheme() {
    const scheme = pending
    pending = null
    if (!scheme || scheme === getResolvedScheme()) return
    toggleScheme()
  }

  function hover(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    hovering = event.type === 'pointerenter'
    wake()
  }

  const engine: Omit<WandEngine, 'dispose'> = {
    wake,
    sync(animate) {
      const next = getResolvedScheme()
      const target = next === 'dark' ? TWIST : 0
      surfaceTarget = readSurface(canvas)
      wake()
      // Already turning there: the wand switched the theme itself.
      if (target === turnTarget) return
      pending = null
      voiced = false
      turnTarget = target
      twistFrom = turn
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
  hit?.addEventListener('pointerenter', hover, options)
  hit?.addEventListener('pointerleave', hover, options)
  hit?.addEventListener('pointerdown', grab, options)
  hit?.addEventListener('pointermove', pull, options)
  hit?.addEventListener('pointerup', release, options)
  hit?.addEventListener('pointercancel', release, options)
  button.addEventListener('click', click, options)
  window.addEventListener('scroll', follow, { ...options, passive: true })
  reducedMotion.addEventListener('change', wake, options)
  const unsubscribe = sceneLight.subscribe(wake)
  const resizeObserver = new ResizeObserver(measure)
  resizeObserver.observe(main)
  // The viewport can resize without changing `main`, once the page is taller than it.
  if (canvas) resizeObserver.observe(canvas)
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
