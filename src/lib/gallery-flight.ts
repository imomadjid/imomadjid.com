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
  squarePhotoLayers,
  watchCanvasPixels,
} from '#/lib/gallery-gpu'
import { delayedEase } from '#/lib/ring-motion'
import cellsFlightSource from '#/shaders/gallery-cells-flight.wgsl'
import flightSource from '#/shaders/gallery-flight.wgsl'

// Full-screen photos come from the 1600px files.
const MAX_TEXTURE_SIZE = 2048
// The See more hero flies the 640px files into masonry cells about a quarter of the viewport wide.
const MAX_CELL_TEXTURE_SIZE = 512
// The most cells one flight draws; the cells shader's uniform arrays hold this many.
const MAX_CELLS = 16

export type FlightTuning = {
  /** Each corner's own move out to full screen. */
  open: TransitionConfig
  /** Each corner's own move back into its tile, quicker than the open. */
  close: TransitionConfig
  /** Seconds the nearest corner can trail the farthest; each lags by its share of it. */
  spread: number
  /** Seconds a photo landed back in its tile takes to fade into the lit tile beneath. */
  relight: number
}

/**
 * Where a photo is: its corners on screen, the texture coordinate at each, its corner radius, and
 * its opacity (1 when left out).
 */
export type FlightPose = { corners: Quad; texels: Quad; radius: number; opacity?: number }

type Direction = 'open' | 'close'

export type Flight = {
  /**
   * Moves `photo` from `from` to `to` with the open or the close timing, each corner starting
   * `lags[i]` of the spread late (see cornerLags). Resolves true when it lands, holding the last
   * frame until `clear`, or false when a newer flight or a failure ends it first.
   */
  fly: (options: {
    photo: HTMLImageElement
    from: FlightPose
    to: FlightPose
    lags: readonly number[]
    direction: Direction
  }) => Promise<boolean>
  /**
   * Moves up to 16 photos at once, as `fly` moves one: photo i from `from[i]` to `to[i]` with
   * `lags[i]`. Their texels are each photo's own coordinates, whole photo 0 to 1.
   */
  flyCells: (options: {
    photos: readonly HTMLImageElement[]
    from: readonly FlightPose[]
    to: readonly FlightPose[]
    lags: readonly (readonly number[])[]
    direction: Direction
  }) => Promise<boolean>
  /** Where the photo is now, mid-flight or landed; null when cleared or flying cells. */
  pose: () => FlightPose | null
  /** Where the cells are now, mid-flight or landed; null when cleared or flying a photo. */
  cellPoses: () => readonly FlightPose[] | null
  clear: () => void
  update: (tuning: FlightTuning) => void
  dispose: () => void
}

type Kind = 'photo' | 'cells'

type Leg = {
  kind: Kind
  from: readonly FlightPose[]
  to: readonly FlightPose[]
  /** Each corner's start, as a fraction of the spread. */
  lags: readonly (readonly number[])[]
  direction: Direction
  start: number
  land: (landed: boolean) => void
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** `from` moved toward `to`, each corner by its own amount; the rest at their average. */
function mixPose(from: FlightPose, to: FlightPose, amounts: readonly number[]): FlightPose {
  const corner = (i: 0 | 1 | 2 | 3) => mixPoint(from.corners[i], to.corners[i], amounts[i])
  const texel = (i: 0 | 1 | 2 | 3) => mixPoint(from.texels[i], to.texels[i], amounts[i])
  // The corners round and the photo fades over the whole move, at the corners' average pace.
  const along = mean(amounts)
  const fromOpacity = from.opacity ?? 1
  return {
    corners: [corner(0), corner(1), corner(2), corner(3)],
    texels: [texel(0), texel(1), texel(2), texel(3)],
    radius: from.radius + (to.radius - from.radius) * along,
    opacity: fromOpacity + ((to.opacity ?? 1) - fromOpacity) * along,
  }
}

/** A pose's corners as two vec4s: top left and top right, then bottom right and bottom left. */
function quadVectors([a, b, c, d]: Quad) {
  return [
    [...a, ...b],
    [...c, ...d],
  ]
}

/**
 * Draws photos flying between their tiles and the full-screen view or the See more overlay on a
 * canvas that covers the viewport. Each photo is a quad whose corners each move on their own eased
 * clock, started late by the caller's lag for that corner times the spread.
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
    const photoFlight = effect(gpu, flightSource, {
      label: 'gallery-flight',
      blend: 'premultiplied',
    })
    life.onDispose(() => photoFlight.dispose())
    const cellsFlight = effect(gpu, cellsFlightSource, {
      label: 'gallery-cells-flight',
      blend: 'premultiplied',
    })
    life.onDispose(() => cellsFlight.dispose())
    // Compile now, so the first expand doesn't wait on the pipelines.
    await Promise.all([photoFlight.compile(output), cellsFlight.compile(output)])
    life.assertLive()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tuning = initialTuning
    let timings = { open: transitionTiming(tuning.open), close: transitionTiming(tuning.close) }
    let photoTextureFor: { photo: HTMLImageElement; gpu: GPUTexture } | null = null
    let cellsTextureFor: {
      photos: readonly HTMLImageElement[]
      layers: ReturnType<typeof squarePhotoLayers>['layers']
      size: number
    } | null = null
    let leg: Leg | null = null
    let current: { kind: Kind; poses: readonly FlightPose[] } | null = null
    let frameId = 0
    life.onDispose(() => {
      cancelAnimationFrame(frameId)
      leg?.land(false)
      photoTextureFor?.gpu.destroy()
      cellsTextureFor?.layers.destroy()
    })

    function renderPhoto(pose: FlightPose) {
      const [topCorners, bottomCorners] = quadVectors(pose.corners)
      const [topTexels, bottomTexels] = quadVectors(pose.texels)
      photoFlight.set({
        params: {
          size: [canvas.clientWidth, canvas.clientHeight],
          dpr: output.dpr,
          radius: pose.radius,
          topCorners,
          bottomCorners,
          topTexels,
          bottomTexels,
        },
      })
      drawPass(gpu, life, output, photoFlight)
    }

    function renderCells(poses: readonly FlightPose[]) {
      if (!cellsTextureFor) return
      // The uniform arrays are fixed-size; cells past `count` are never read.
      const padded = Array.from({ length: MAX_CELLS }, (_, i) => poses[i] ?? poses[0])
      cellsFlight.set({
        params: {
          size: [canvas.clientWidth, canvas.clientHeight],
          dpr: output.dpr,
          count: poses.length,
          texSize: cellsTextureFor.size,
          mipCount: cellsTextureFor.layers.mipLevelCount,
          corners: padded.flatMap((pose) => quadVectors(pose.corners)),
          texels: padded.flatMap((pose) => quadVectors(pose.texels)),
          styles: padded.map((pose) => [pose.radius, pose.opacity ?? 1, 0, 0]),
        },
      })
      drawPass(gpu, life, output, cellsFlight)
    }

    function render() {
      if (!current) drawPass(gpu, life, output, null)
      else if (current.kind === 'photo') renderPhoto(current.poses[0])
      else renderCells(current.poses)
    }

    function step(now: number) {
      frameId = 0
      if (life.disposed() || !leg) return
      const elapsed = (now - leg.start) / 1000
      const timing = timings[leg.direction]
      const duration = reducedMotion.matches ? 0 : timing.duration
      const spread = reducedMotion.matches ? 0 : tuning.spread
      let landed = true
      const { from, to, lags } = leg
      const poses = from.map((start, index) => {
        const amounts = lags[index].map((lag) => {
          const eased = delayedEase(elapsed, lag * spread, duration, timing.ease)
          if (eased.moving) landed = false
          return eased.value
        })
        return mixPose(start, to[index], amounts)
      })
      current = { kind: leg.kind, poses }
      render()
      if (life.disposed()) return
      if (landed) {
        const done = leg
        leg = null
        done.land(true)
      } else {
        frameId = requestAnimationFrame(step)
      }
    }

    function start(flight: Omit<Leg, 'start' | 'land'>) {
      leg?.land(false)
      return new Promise<boolean>((land) => {
        leg = { ...flight, start: performance.now(), land }
        cancelAnimationFrame(frameId)
        // Draw the starting pose now, so it is on screen in the same frame as the caller's swap.
        step(performance.now())
      })
    }

    // Keeps a landed flight in place through resizes until it is cleared.
    watchCanvasPixels(
      canvas,
      () => {
        if (!leg && current) render()
      },
      life.signal,
    )

    return {
      fly({ photo, from, to, lags, direction }) {
        life.assertLive()
        if (photoTextureFor?.photo !== photo) {
          photoTextureFor?.gpu.destroy()
          photoTextureFor = {
            photo,
            gpu: photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-flight'),
          }
          photoFlight.set({ photo: photoTextureFor.gpu, photoSampler: sampler })
        }
        return start({ kind: 'photo', from: [from], to: [to], lags: [lags], direction })
      },
      flyCells({ photos, from, to, lags, direction }) {
        life.assertLive()
        if (photos.length > MAX_CELLS) throw new Error(`A flight draws at most ${MAX_CELLS} cells`)
        const cached = cellsTextureFor?.photos
        if (
          cached?.length !== photos.length ||
          cached.some((photo, index) => photo !== photos[index])
        ) {
          cellsTextureFor?.layers.destroy()
          const { layers, size } = squarePhotoLayers(gpu, photos, {
            maxSize: MAX_CELL_TEXTURE_SIZE,
            fit: 'squeeze',
            label: 'gallery-cells-flight',
          })
          cellsTextureFor = { photos, layers, size }
          cellsFlight.set({ photos: layers, photoSampler: sampler })
        }
        return start({ kind: 'cells', from, to, lags, direction })
      },
      pose: () => (current?.kind === 'photo' ? current.poses[0] : null),
      cellPoses: () => (current?.kind === 'cells' ? current.poses : null),
      clear() {
        leg?.land(false)
        leg = null
        current = null
        cancelAnimationFrame(frameId)
        frameId = 0
        if (!life.disposed()) render()
      },
      update(nextTuning) {
        tuning = nextTuning
        timings = { open: transitionTiming(tuning.open), close: transitionTiming(tuning.close) }
      },
      dispose: life.dispose,
    }
  } catch (error) {
    life.dispose()
    throw error
  }
}
