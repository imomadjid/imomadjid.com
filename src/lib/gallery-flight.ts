import type { TransitionConfig } from 'dialkit'
import { effect } from 'vgpu'

import { springOf, stepSprings } from '#/lib/flight-springs'
import type { Spring, SpringState } from '#/lib/flight-springs'
import { imageAspect } from '#/lib/gallery-flight-geometry'
import type { Point, Quad, Rect } from '#/lib/gallery-flight-geometry'
import {
  acquireGalleryGpu,
  drawPass,
  gallerySurface,
  photoSampler,
  photoLayerPool,
  photoTexture,
  rendererLife,
  watchCanvasPixels,
} from '#/lib/gallery-gpu'
import cellsFlightSource from '#/shaders/gallery-cells-flight.wgsl'
import flightSource from '#/shaders/gallery-flight.wgsl'

// Full-screen photos come from the 1600px files.
const MAX_TEXTURE_SIZE = 2048
// The See more hero flies the 640px files into masonry cells about a quarter of the viewport wide.
const CELL_TEXTURE_SIZE = 512
// The most cells one flight draws; the cells shader's uniform arrays hold this many.
const MAX_CELLS = 16

export type FlightTuning = {
  /** The spring out of a tile, at the corners' average pace. */
  open: TransitionConfig
  /** The spring back into a tile, quicker than the open. */
  close: TransitionConfig
  /**
   * How far the corners' springs spread either side of the response, as a fraction of it, for
   * the most lopsided move: the leading corner's that much quicker, the last one's that much
   * slower. A move with every corner as far to go stays together on the response itself.
   */
  spread: number
  /** Seconds a photo landed back in its tile takes to fade into the lit tile beneath. */
  relight: number
}

/**
 * Where a photo is: its corners on screen, the texture coordinate at each, its corner radius, and
 * for a cell, how far it has turned into the photo it becomes (0 when left out; see flyCells).
 */
export type FlightPose = {
  corners: Quad
  texels: Quad
  radius: number
  blend?: number
}

type Direction = 'open' | 'close'

export type Flight = {
  /**
   * Moves `photo` from `from` to `to` on the open or the close spring, each corner on its own,
   * spread about the response by its lag (see cornerLags and `spread`), as Apple spreads the rows
   * of its app-open mesh. A flight that interrupts another of the same kind turns its
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
   * `lags[i]`. Their texels are each photo's own coordinates, whole photo 0 to 1. They are clipped
   * to `clip` (a rounded box) grown by how far they still are from their poses at its end (`from`
   * opening, `to` closing), at the farthest corner of any, with an edge as soft as half that: far
   * from the box they are free of it, and as they all near it, cells whose places lie outside it
   * slide under its rim, fading. A cell whose place is inside the box is never clipped.
   * Cell i crossfades into `into[i]`, if given and another photo, as its pose's blend goes from 0
   * to 1, shown as object-fit: cover shows it in the cell's shape at the time.
   */
  flyCells: (options: {
    photos: readonly HTMLImageElement[]
    into?: readonly HTMLImageElement[]
    from: readonly FlightPose[]
    to: readonly FlightPose[]
    lags: readonly (readonly number[])[]
    direction: Direction
    clip: { rect: Rect; radius: number }
  }) => Promise<boolean>
  /**
   * Swaps the photo being flown, `from`, for a sharper copy of it, `to`, mid-flight or landed, so
   * the full-size file can take over as soon as it decodes. Does nothing once `from` is gone.
   */
  sharpen: (from: HTMLImageElement, to: HTMLImageElement) => void
  clear: () => void
  update: (tuning: FlightTuning) => void
  dispose: () => void
}

type Kind = 'photo' | 'cells'

type Leg = {
  /** Every pose's values, flattened (see poseValues). */
  targets: readonly number[]
  springs: readonly Spring[]
  tolerances: readonly number[]
  /** When the last frame stepped the springs. */
  last: number
  land: (landed: boolean) => void
}

// A pose's values: its corners' x and y, its texels' u and v, its radius and its blend.
const POSE_VALUES = 18
// Each value snaps on once this close: a tenth of a pixel, a ten-thousandth of the photo.
const POSE_TOLERANCES = [
  ...Array.from({ length: 8 }, () => 0.1),
  ...Array.from({ length: 8 }, () => 1e-4),
  0.1,
  1e-3,
]

function poseValues(pose: FlightPose): number[] {
  return [...pose.corners.flat(), ...pose.texels.flat(), pose.radius, pose.blend ?? 0]
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
    blend: values[base + 17],
  }
}

/**
 * Each value's spring: a corner and its texel share the corner's, its response scaled by
 * `scales`; the radius and the blend keep the response itself.
 */
function poseSprings(config: TransitionConfig, scales: readonly number[]): Spring[] {
  const corners = scales.map((scale) => springOf(config, scale))
  const own = springOf(config)
  return Array.from({ length: POSE_VALUES }, (_, value) =>
    value < 16 ? corners[Math.floor((value % 8) / 2)] : own,
  )
}

/** How far any corner of `poses` still is from its place in `places`, at the farthest. */
function farthestFrom(poses: readonly FlightPose[], places: readonly Quad[]) {
  let farthest = 0
  for (const [index, pose] of poses.entries())
    for (const [k, [x, y]] of pose.corners.entries()) {
      const place = places[index][k]
      farthest = Math.max(farthest, Math.hypot(x - place[0], y - place[1]))
    }
  return farthest
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
 * canvas that covers the viewport. Each photo is a quad whose corners all start at once, each on
 * its own spring, its response spread about the tuning's by the caller's lag for that corner.
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
    // The cells' photos, kept across flights so an open and its close upload them once. Made on
    // the first cells flight.
    let cellPhotos: ReturnType<typeof photoLayerPool> | null = null
    // What stays put through a cells flight: the uniforms that don't move, and the cells' poses at
    // the clip's end (see flyCells).
    let cells: {
      fixed: {
        texSize: number
        mipCount: number
        clipRadius: number
        clip: number[]
        layers: number[][]
      }
      places: readonly Quad[]
    } | null = null
    let leg: Leg | null = null
    // Where the poses are and how fast they move, mid-flight or landed; null when cleared.
    let motion: { kind: Kind; photos: readonly HTMLImageElement[]; state: SpringState } | null =
      null
    let frameId = 0
    life.onDispose(() => {
      cancelAnimationFrame(frameId)
      leg?.land(false)
      photoTextureFor?.gpu.destroy()
      cellPhotos?.destroy()
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
      if (!cells) return
      // The uniform arrays are fixed-size; cells past `count` are never read.
      const padded = Array.from({ length: MAX_CELLS }, (_, i) => poses[i] ?? poses[0])
      cellsFlight.set({
        params: {
          ...cells.fixed,
          size: [canvas.clientWidth, canvas.clientHeight],
          dpr: output.dpr,
          count: poses.length,
          // One window for every cell, so neighbours share its edge, as wide as the farthest cell
          // still is from its place, so no cell whose place is inside the box is ever clipped.
          clipMargin: farthestFrom(poses, cells.places),
          corners: padded.flatMap((pose) => quadVectors(pose.corners)),
          texels: padded.flatMap((pose) => quadVectors(pose.texels)),
          styles: padded.map((pose) => [pose.radius, pose.blend ?? 0, 0, 0]),
        },
      })
      drawPass(gpu, life, output, cellsFlight)
    }

    function render() {
      if (!motion) drawPass(gpu, life, output, null)
      else if (motion.kind === 'photo') renderPhoto(poseAt(motion.state.values, 0))
      else {
        const { photos, state } = motion
        renderCells(photos.map((_, index) => poseAt(state.values, index)))
      }
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
        motion = { kind, photos, state: { values, velocities: values.map(() => 0) } }
      }
      const config = direction === 'open' ? tuning.open : tuning.close
      // The lags spread about their middle, so a move whose corners all lag alike keeps the
      // response, and the leader is as much quicker as the last corner is slower.
      const all = lags.flat()
      const middle = (Math.min(...all) + Math.max(...all)) / 2
      const springs = lags.flatMap((cornerLags) =>
        poseSprings(
          config,
          cornerLags.map((lag) => Math.max(0.1, 1 + 2 * tuning.spread * (lag - middle))),
        ),
      )
      return new Promise<boolean>((land) => {
        const targets = to.flatMap(poseValues)
        const tolerances = targets.map((_, index) => POSE_TOLERANCES[index % POSE_VALUES])
        leg = { targets, springs, tolerances, last: performance.now(), land }
        cancelAnimationFrame(frameId)
        // Draw the starting pose now, so it is on screen in the same frame as the caller's swap.
        step(performance.now())
      })
    }

    function loadPhoto(photo: HTMLImageElement) {
      if (photoTextureFor?.photo === photo) return
      photoTextureFor?.gpu.destroy()
      photoTextureFor = { photo, gpu: photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-flight') }
      photoFlight.set({ photo: photoTextureFor.gpu, photoSampler: sampler })
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
        loadPhoto(photo)
        return start('photo', [photo], { from: [from], to: [to], lags: [lags], direction })
      },
      flyCells({ photos, into = photos, from, to, lags, direction, clip }) {
        life.assertLive()
        if (photos.length > MAX_CELLS) throw new Error(`A flight draws at most ${MAX_CELLS} cells`)
        if (!cellPhotos) {
          cellPhotos = photoLayerPool(gpu, {
            size: CELL_TEXTURE_SIZE,
            count: 2 * MAX_CELLS,
            label: 'gallery-cells-flight',
          })
          cellsFlight.set({ photos: cellPhotos.layers, photoSampler: sampler })
        }
        // One layer per distinct photo, flown or turned into.
        const unique = [...new Set([...photos, ...into])]
        const placed = new Map(cellPhotos.place(unique).map((layer, i) => [unique[i], layer]))
        const layers = photos.map((photo, index) => [
          placed.get(photo) ?? 0,
          placed.get(into[index]) ?? 0,
          imageAspect(into[index]),
          0,
        ])
        cells = {
          fixed: {
            texSize: cellPhotos.size,
            mipCount: cellPhotos.layers.mipLevelCount,
            clipRadius: clip.radius,
            clip: [clip.rect.x, clip.rect.y, clip.rect.width, clip.rect.height],
            layers: Array.from({ length: MAX_CELLS }, (_, i) => layers[i] ?? layers[0]),
          },
          places: (direction === 'open' ? from : to).map((pose) => pose.corners),
        }
        return start('cells', photos, { from, to, lags, direction })
      },
      sharpen(from, to) {
        if (life.disposed() || motion?.kind !== 'photo' || motion.photos[0] !== from) return
        loadPhoto(to)
        motion.photos = [to]
        // A landed photo stays put, so draw it sharp now; a flying one draws on its next frame.
        if (!leg) render()
      },
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
