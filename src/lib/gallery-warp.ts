import type { TransitionConfig } from 'dialkit'
import { effect, frame, sampler, surface, texture } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import {
  acquireGalleryGpu,
  loadImage,
  mipLevels,
  rendererLife,
  uploadMips,
  watchCanvasPixels,
} from '#/lib/gallery-gpu'
import { createRingMotion, ringUniforms } from '#/lib/ring-motion'
import warpSource from '#/shaders/gallery-warp.wgsl'

// Photo layers are as large as the smallest square crop, up to this.
const MAX_TEXTURE_SIZE = 256
// The CSS tile's geometry: gap-0.5, rounded-md cells at 1x, and a rounded-xl tile.
const GAP = 2
const CELL_RADIUS = 6
const TILE_RADIUS = 12

export type WarpTuning = {
  /** Each ring's own move from one zoom to the other. */
  motion: TransitionConfig
  /** Seconds the corners start after the middle. */
  lead: number
  /** Extra magnification of the middle halfway through a move, as a fraction. */
  bulge: number
}

export type GalleryWarp = {
  setZoomedOut: (zoomedOut: boolean) => void
  update: (tuning: WarpTuning) => void
  dispose: () => void
}

/**
 * Draws the See more tile's 16 photos with WebGPU. Each ring around the middle runs its own
 * eased move between the 2x crop and the whole grid (src/lib/ring-motion.ts), so the middle zooms
 * first. A lost device or a failed frame disposes the renderer and calls `onFail`, so the caller
 * can bring its fallback back.
 */
export async function startGalleryWarp(
  canvas: HTMLCanvasElement,
  photoUrls: readonly string[],
  initialTuning: WarpTuning,
  signal: AbortSignal,
  onFail: (error: Error) => void,
): Promise<GalleryWarp> {
  if (photoUrls.length !== 16) throw new Error('The warp grid needs exactly 16 photos')
  const images = Promise.all(photoUrls.map(loadImage))
  images.catch(() => {})
  const handle = await acquireGalleryGpu()
  const { gpu } = handle
  const life = rendererLife(handle, signal, onFail)
  try {
    life.assertLive()
    const loaded = await images
    life.assertLive()
    const crops = loaded.map((image) => {
      const side = Math.min(image.naturalWidth, image.naturalHeight)
      return {
        x: (image.naturalWidth - side) / 2,
        y: (image.naturalHeight - side) / 2,
        width: side,
        height: side,
      }
    })
    const textureSize = Math.min(MAX_TEXTURE_SIZE, ...crops.map((crop) => Math.floor(crop.width)))
    const photos = texture(gpu, {
      kind: '2d-array',
      size: [textureSize, textureSize],
      layers: 16,
      format: 'rgba8unorm',
      mipLevelCount: mipLevels(textureSize, textureSize),
      usage: ['texture_binding', 'copy_dst', 'render_attachment'],
      label: 'gallery-warp-photos',
    })
    life.signal.addEventListener('abort', () => photos.destroy(), { once: true })
    for (const [layer, image] of loaded.entries()) {
      uploadMips(gpu, photos.gpu, image, crops[layer], layer)
    }
    // A range, not a number, so the surface re-reads the pixel ratio on every frame.
    const output = surface(gpu, canvas, { clearColor: [0, 0, 0, 0], dpr: [1, 4] })
    const warp = effect(gpu, warpSource, {
      label: 'gallery-warp',
      blend: 'premultiplied',
      set: {
        photos,
        photoSampler: sampler(gpu, {
          minFilter: 'linear',
          magFilter: 'linear',
          mipmapFilter: 'linear',
        }),
      },
    })
    life.signal.addEventListener(
      'abort',
      () => {
        warp.dispose()
        output.dispose()
      },
      { once: true },
    )

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tuning = initialTuning
    let timing = transitionTiming(tuning.motion)
    // 0 is the 2x crop at rest, 1 the whole grid.
    const motion = createRingMotion()
    let frameId = 0
    life.signal.addEventListener('abort', () => cancelAnimationFrame(frameId), { once: true })

    function draw(now: number) {
      frameId = 0
      if (life.disposed()) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const settled = motion.step(now, {
        duration: reducedMotion.matches ? 0 : timing.duration,
        lead: reducedMotion.matches ? 0 : tuning.lead,
        ease: timing.ease,
      })
      // The 2x crop's edges land on cell edges: the middle two cells and one gap fill the tile.
      const restZoom = (2 * width) / (width - GAP)
      const rings = ringUniforms((ring) => {
        const progress = motion.progress[ring]
        // Follows the ring's progress, not its clock, so a reversal can't make it jump.
        const along = Math.min(1, Math.max(0, progress))
        const radius = ring / (motion.progress.length - 1)
        const bulge = 1 + tuning.bulge * 4 * along * (1 - along) * (1 - radius * radius)
        return (restZoom + (1 - restZoom) * progress) * bulge
      })
      warp.set({
        params: {
          size: [width, height],
          dpr: output.dpr,
          gap: GAP,
          cellRadius: CELL_RADIUS,
          tileRadius: TILE_RADIUS,
          texSize: textureSize,
          mipCount: photos.mipLevelCount,
          rings,
        },
      })
      try {
        frame(gpu, (current) => current.pass(output, warp))
      } catch (error) {
        life.fail(error instanceof Error ? error : new Error(String(error)))
        return
      }
      if (!settled) frameId = requestAnimationFrame(draw)
    }

    function wake() {
      if (life.disposed() || frameId) return
      frameId = requestAnimationFrame(draw)
    }
    watchCanvasPixels(canvas, wake, life.signal)
    wake()

    return {
      setZoomedOut(zoomedOut) {
        if (motion.retarget(zoomedOut ? 1 : 0, performance.now())) wake()
      },
      update(nextTuning) {
        tuning = nextTuning
        timing = transitionTiming(tuning.motion)
        wake()
      },
      dispose: life.dispose,
    }
  } catch (error) {
    life.dispose()
    throw error
  }
}
