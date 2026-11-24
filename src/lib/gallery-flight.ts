import type { TransitionConfig } from 'dialkit'
import { effect, frame, sampler, surface } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import { mixPoint } from '#/lib/gallery-flight-geometry'
import type { Quad } from '#/lib/gallery-flight-geometry'
import { acquireGalleryGpu, photoTexture, rendererLife, watchCanvasPixels } from '#/lib/gallery-gpu'
import flightSource from '#/shaders/gallery-flight.wgsl'

// Full-screen photos come from the 1600px files.
const MAX_TEXTURE_SIZE = 2048
// The tiles' and the full-screen photo's rounded-xl corners.
const RADIUS = 12

export type FlightTuning = {
  /** Each corner's own move. */
  motion: TransitionConfig
  /** Seconds between one corner starting and the next. */
  stagger: number
}

/** Where a photo is: its corners on screen, and the texture coordinate at each. */
export type FlightPose = { corners: Quad; texels: Quad }

export type Flight = {
  /**
   * Moves `photo` from `from` (or wherever the last flight left it) to `to`, corners in `order`.
   * Resolves true when it lands, holding the last frame until `clear`, or false when a newer
   * flight takes over.
   */
  fly: (options: {
    photo: HTMLImageElement
    from?: FlightPose
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
    const output = surface(gpu, canvas, { clearColor: [0, 0, 0, 0], dpr: [1, 4] })
    const photoSampler = sampler(gpu, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
    })
    const flight = effect(gpu, flightSource, { label: 'gallery-flight', blend: 'premultiplied' })
    // Compile now, so the first expand doesn't wait on the pipeline.
    await flight.compile(output)
    life.assertLive()

    let texture: { photo: HTMLImageElement; gpu: GPUTexture } | null = null
    const dropTexture = () => {
      texture?.gpu.destroy()
      texture = null
    }
    life.signal.addEventListener(
      'abort',
      () => {
        dropTexture()
        flight.dispose()
        output.dispose()
      },
      { once: true },
    )

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tuning = initialTuning
    let timing = transitionTiming(tuning.motion)
    let leg: Leg | null = null
    let current: FlightPose | null = null
    let frameId = 0
    life.signal.addEventListener(
      'abort',
      () => {
        cancelAnimationFrame(frameId)
        leg?.land(false)
      },
      { once: true },
    )

    function render(pose: FlightPose | null) {
      try {
        frame(gpu, (now) => {
          if (!pose) {
            // Clears to transparent.
            now.pass(output, () => {})
            return
          }
          const [a, b, c, d] = pose.corners
          const [ta, tb, tc, td] = pose.texels
          flight.set({
            params: {
              size: [canvas.clientWidth, canvas.clientHeight],
              dpr: output.dpr,
              radius: RADIUS,
              topCorners: [...a, ...b],
              bottomCorners: [...c, ...d],
              topTexels: [...ta, ...tb],
              bottomTexels: [...tc, ...td],
            },
          })
          now.pass(output, flight)
        })
      } catch (error) {
        life.fail(error instanceof Error ? error : new Error(String(error)))
      }
    }

    function step(now: number) {
      frameId = 0
      if (life.disposed() || !leg) return
      const elapsed = (now - leg.start) / 1000
      const duration = reducedMotion.matches ? 0 : timing.duration
      const stagger = reducedMotion.matches ? 0 : tuning.stagger
      let landed = true
      const amounts = leg.rank.map((rank) => {
        const local = duration > 0 ? (elapsed - rank * stagger) / duration : 1
        if (local < 1) landed = false
        return local <= 0 ? 0 : local >= 1 ? 1 : timing.ease(local)
      })
      const { from, to } = leg
      const corner = (i: 0 | 1 | 2 | 3) => mixPoint(from.corners[i], to.corners[i], amounts[i])
      const texel = (i: 0 | 1 | 2 | 3) => mixPoint(from.texels[i], to.texels[i], amounts[i])
      current = {
        corners: [corner(0), corner(1), corner(2), corner(3)],
        texels: [texel(0), texel(1), texel(2), texel(3)],
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
          dropTexture()
          texture = { photo, gpu: photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-flight') }
          flight.set({ photo: texture.gpu, photoSampler })
        }
        const start = from ?? current
        if (!start) throw new Error('A first flight needs a starting pose')
        leg?.land(false)
        const rank = [0, 0, 0, 0]
        order.forEach((cornerIndex, position) => {
          rank[cornerIndex] = position
        })
        return new Promise<boolean>((land) => {
          leg = { from: start, to, rank, start: performance.now(), land }
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
