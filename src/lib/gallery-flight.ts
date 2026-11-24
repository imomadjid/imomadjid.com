import type { TransitionConfig } from 'dialkit'
import { effect } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import { mixPoint } from '#/lib/gallery-flight-geometry'
import type { Quad } from '#/lib/gallery-flight-geometry'
import {
  acquireGalleryGpu,
  drawPass,
  gallerySurface,
  photoSampler,
  photoTexture,
  rendererLife,
  watchCanvasPixels,
} from '#/lib/gallery-gpu'
import { delayedEase } from '#/lib/ring-motion'
import flightSource from '#/shaders/gallery-flight.wgsl'

// Full-screen photos come from the 1600px files.
const MAX_TEXTURE_SIZE = 2048

export type FlightTuning = {
  /** Each corner's own move. */
  motion: TransitionConfig
  /** Seconds between one corner starting and the next. */
  stagger: number
}

/** Where a photo is: its corners on screen, the texture coordinate at each, and its corner radius. */
export type FlightPose = { corners: Quad; texels: Quad; radius: number }

export type Flight = {
  /**
   * Moves `photo` from `from` to `to`, corners in `order`. Resolves true when it lands, holding
   * the last frame until `clear`, or false when a newer flight or a failure ends it first.
   */
  fly: (options: {
    photo: HTMLImageElement
    from: FlightPose
    to: FlightPose
    order: readonly number[]
  }) => Promise<boolean>
  /** Where the photo is now, mid-flight or landed; null when cleared. */
  pose: () => FlightPose | null
  clear: () => void
  update: (tuning: FlightTuning) => void
  dispose: () => void
}

type Leg = {
  from: FlightPose
  to: FlightPose
  /** Each corner's rank: 0 moves first. */
  rank: number[]
  start: number
  land: (landed: boolean) => void
}

/**
 * Draws a photo flying between its tile and the full-screen view on a canvas that covers the
 * viewport. The photo is a quad whose corners move one at a time, each on its own eased clock,
 * started `stagger` apart in the order the caller ranks them.
 */
export async function startGalleryFlight(
  canvas: HTMLCanvasElement,
  initialTuning: FlightTuning,
  signal: AbortSignal,
  onFail: (error: Error) => void,
): Promise<Flight> {
  const handle = await acquireGalleryGpu()
  const { gpu } = handle
  const life = rendererLife(handle, signal, onFail)
  try {
    life.assertLive()
    const output = gallerySurface(gpu, canvas, life)
    const sampler = photoSampler(gpu)
    const flight = effect(gpu, flightSource, { label: 'gallery-flight', blend: 'premultiplied' })
    life.onDispose(() => flight.dispose())
    // Compile now, so the first expand doesn't wait on the pipeline.
    await flight.compile(output)
    life.assertLive()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tuning = initialTuning
    let timing = transitionTiming(tuning.motion)
    let texture: { photo: HTMLImageElement; gpu: GPUTexture } | null = null
    let leg: Leg | null = null
    let current: FlightPose | null = null
    let frameId = 0
    life.onDispose(() => {
      cancelAnimationFrame(frameId)
      leg?.land(false)
      texture?.gpu.destroy()
    })

    function render(pose: FlightPose | null) {
      if (pose) {
        const [a, b, c, d] = pose.corners
        const [ta, tb, tc, td] = pose.texels
        flight.set({
          params: {
            size: [canvas.clientWidth, canvas.clientHeight],
            dpr: output.dpr,
            radius: pose.radius,
            topCorners: [...a, ...b],
            bottomCorners: [...c, ...d],
            topTexels: [...ta, ...tb],
            bottomTexels: [...tc, ...td],
          },
        })
      }
      // Without a pose, clears to transparent.
      drawPass(gpu, life, output, pose ? flight : null)
    }

    function step(now: number) {
      frameId = 0
      if (life.disposed() || !leg) return
      const elapsed = (now - leg.start) / 1000
      const duration = reducedMotion.matches ? 0 : timing.duration
      const stagger = reducedMotion.matches ? 0 : tuning.stagger
      let landed = true
      const amounts = leg.rank.map((rank) => {
        const eased = delayedEase(elapsed, rank * stagger, duration, timing.ease)
        if (eased.moving) landed = false
        return eased.value
      })
      const { from, to } = leg
      const corner = (i: 0 | 1 | 2 | 3) => mixPoint(from.corners[i], to.corners[i], amounts[i])
      const texel = (i: 0 | 1 | 2 | 3) => mixPoint(from.texels[i], to.texels[i], amounts[i])
      // The corners round over the whole move, at the corners' average pace.
      const rounding = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      current = {
        corners: [corner(0), corner(1), corner(2), corner(3)],
        texels: [texel(0), texel(1), texel(2), texel(3)],
        radius: from.radius + (to.radius - from.radius) * rounding,
      }
      render(current)
      if (life.disposed()) return
      if (landed) {
        const done = leg
        leg = null
        done.land(true)
      } else {
        frameId = requestAnimationFrame(step)
      }
    }

    // Keeps a landed photo in place through resizes until it is cleared.
    watchCanvasPixels(
      canvas,
      () => {
        if (!leg && current) render(current)
      },
      life.signal,
    )

    return {
      fly({ photo, from, to, order }) {
        life.assertLive()
        if (texture?.photo !== photo) {
          texture?.gpu.destroy()
          texture = { photo, gpu: photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-flight') }
          flight.set({ photo: texture.gpu, photoSampler: sampler })
        }
        leg?.land(false)
        const rank = [0, 0, 0, 0]
        order.forEach((cornerIndex, position) => {
          rank[cornerIndex] = position
        })
        return new Promise<boolean>((land) => {
          leg = { from, to, rank, start: performance.now(), land }
          cancelAnimationFrame(frameId)
          // Draw the starting pose now, so it is on screen in the same frame as the caller's swap.
          step(performance.now())
        })
      },
      pose: () => current,
      clear() {
        leg?.land(false)
        leg = null
        current = null
        cancelAnimationFrame(frameId)
        frameId = 0
        if (!life.disposed()) render(null)
      },
      update(nextTuning) {
        tuning = nextTuning
        timing = transitionTiming(tuning.motion)
      },
      dispose: life.dispose,
    }
  } catch (error) {
    life.dispose()
    throw error
  }
}
