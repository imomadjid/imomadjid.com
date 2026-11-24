import type { TransitionConfig } from 'dialkit'
import { effect } from 'vgpu'

import { springOf, stepSprings } from '#/lib/flight-springs'
import type { Spring, SpringState } from '#/lib/flight-springs'
import type { Point, Quad } from '#/lib/gallery-flight-geometry'
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
import cellsFlightSource from '#/shaders/gallery-cells-flight.wgsl'
import flightSource from '#/shaders/gallery-flight.wgsl'

// Full-screen photos come from the 1600px files.
const MAX_TEXTURE_SIZE = 2048
// The See more hero flies the 640px files into masonry cells about a quarter of the viewport wide.
const MAX_CELL_TEXTURE_SIZE = 512
// The most cells one flight draws; the cells shader's uniform arrays hold this many.
const MAX_CELLS = 16

export type FlightTuning = {
  /** The spring out of a tile, for the corner that lands last. */
  open: TransitionConfig
  /** The spring back into a tile, quicker than the open. */
  close: TransitionConfig
  /**
   * How much quicker the leading corner's spring is than the last one's, as a fraction of its
   * response; each corner between gets its share by its lag (see cornerLags).
   */
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
   * Moves `photo` from `from` to `to` on the open or the close spring, each corner on its own:
   * one with a lag of 0 leads, quicker by the spread, and one with a lag of 1 takes the whole
   * response (see cornerLags). A flight that interrupts another of the same kind turns its
   * corners around from where they are, keeping their speed, and ignores `from`. Resolves true
   * when it lands, holding the last frame until `clear`, or false when a newer flight or a
   * failure ends it first.
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
  /** Every pose's values, flattened (see poseValues). */
  targets: readonly number[]
  springs: readonly Spring[]
  tolerances: readonly number[]
  /** When the last frame stepped the springs. */
  last: number
  land: (landed: boolean) => void
}

// A pose's values: its corners' x and y, its texels' u and v, its radius and its opacity.
const POSE_VALUES = 18
// Each value snaps on once this close: a tenth of a pixel, a ten-thousandth of the photo.
const POSE_TOLERANCES = [
  ...Array.from({ length: 8 }, () => 0.1),
  ...Array.from({ length: 8 }, () => 1e-4),
  0.1,
  1e-3,
]

function poseValues(pose: FlightPose): number[] {
  return [...pose.corners.flat(), ...pose.texels.flat(), pose.radius, pose.opacity ?? 1]
}

function poseAt(values: readonly number[], index: number): FlightPose {
  const base = index * POSE_VALUES
  const point = (offset: number): Point => [values[base + offset], values[base + offset + 1]]
  const quad = (offset: number): Quad => [
    point(offset),
    point(offset + 2),
    point(offset + 4),
    point(offset + 6),
  ]
  return {
    corners: quad(0),
    texels: quad(8),
    radius: values[base + 16],
    opacity: values[base + 17],
  }
}

/**
 * Each value's spring: a corner and its texel share the corner's, quickened by the spread for a
 * leading corner; the radius and opacity keep the response itself, on their own clock.
 */
function poseSprings(config: TransitionConfig, spread: number, lags: readonly number[]): Spring[] {
  const corners = lags.map((lag) => springOf(config, 1 - spread * (1 - lag)))
  const own = springOf(config)
  return Array.from({ length: POSE_VALUES }, (_, value) =>
    value < 16 ? corners[Math.floor((value % 8) / 2)] : own,
  )
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
    let photoTextureFor: { photo: HTMLImageElement; gpu: GPUTexture } | null = null
    let cellsTextureFor: {
      photos: readonly HTMLImageElement[]
      layers: ReturnType<typeof squarePhotoLayers>['layers']
      size: number
    } | null = null
    let leg: Leg | null = null
    // Where the poses are and how fast they move, mid-flight or landed; null when cleared.
    let motion: {
      kind: Kind
      photos: readonly HTMLImageElement[]
      count: number
      state: SpringState
    } | null = null
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

    const posesOf = ({ count, state }: { count: number; state: SpringState }) =>
      Array.from({ length: count }, (_, index) => poseAt(state.values, index))

    function render() {
      if (!motion) drawPass(gpu, life, output, null)
      else if (motion.kind === 'photo') renderPhoto(poseAt(motion.state.values, 0))
      else renderCells(posesOf(motion))
    }

    function step(now: number) {
      frameId = 0
      if (life.disposed() || !leg || !motion) return
      // Long frames still move the springs on in real time, up to a second at once.
      const dt = Math.min(1, Math.max(0, (now - leg.last) / 1000))
      leg.last = now
      // Reduced motion lands at once.
      if (reducedMotion.matches)
        motion.state = { values: [...leg.targets], velocities: leg.targets.map(() => 0) }
      const landed =
        reducedMotion.matches ||
        stepSprings(motion.state, leg.targets, leg.springs, leg.tolerances, dt)
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

    function start(
      kind: Kind,
      photos: readonly HTMLImageElement[],
      {
        from,
        to,
        lags,
        direction,
      }: {
        from: readonly FlightPose[]
        to: readonly FlightPose[]
        lags: readonly (readonly number[])[]
        direction: Direction
      },
    ) {
      // A flight still in the air with the same photos turns around where it is, at its speed.
      const turning =
        leg !== null &&
        motion?.kind === kind &&
        motion.photos.length === photos.length &&
        motion.photos.every((photo, index) => photo === photos[index])
      leg?.land(false)
      if (!turning) {
        const values = from.flatMap(poseValues)
        motion = {
          kind,
          photos,
          count: from.length,
          state: { values, velocities: values.map(() => 0) },
        }
      }
      const config = direction === 'open' ? tuning.open : tuning.close
      const springs = lags.flatMap((cornerLags) => poseSprings(config, tuning.spread, cornerLags))
      return new Promise<boolean>((land) => {
        const targets = to.flatMap(poseValues)
        const tolerances = targets.map((_, index) => POSE_TOLERANCES[index % POSE_VALUES])
        leg = { kind, targets, springs, tolerances, last: performance.now(), land }
        cancelAnimationFrame(frameId)
        // Draw the starting pose now, so it is on screen in the same frame as the caller's swap.
        step(performance.now())
      })
    }

    // Keeps a landed flight in place through resizes until it is cleared.
    watchCanvasPixels(
      canvas,
      () => {
        if (!leg && motion) render()
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
        return start('photo', [photo], { from: [from], to: [to], lags: [lags], direction })
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
        return start('cells', photos, { from, to, lags, direction })
      },
      pose: () => (motion?.kind === 'photo' ? poseAt(motion.state.values, 0) : null),
      cellPoses: () => (motion?.kind === 'cells' ? posesOf(motion) : null),
      clear() {
        leg?.land(false)
        leg = null
        motion = null
        cancelAnimationFrame(frameId)
        frameId = 0
        if (!life.disposed()) render()
      },
      update(nextTuning) {
        tuning = nextTuning
      },
      dispose: life.dispose,
    }
  } catch (error) {
    life.dispose()
    throw error
  }
}
