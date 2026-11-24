import { effect } from 'vgpu'

import {
  TILE_RADIUS,
  acquireGalleryGpu,
  gallerySurface,
  photoSampler,
  rendererLife,
  ringLoop,
  squarePhotoLayers,
} from '#/lib/gallery-gpu'
import type { RingTuning } from '#/lib/gallery-gpu'
import { decodedImage } from '#/lib/gallery-images'
import { ringUniforms } from '#/lib/ring-motion'
import { SEE_MORE_CELL_RADIUS, SEE_MORE_GAP, seeMoreRestZoom } from '#/lib/see-more-grid'
import warpSource from '#/shaders/gallery-warp.wgsl'

// Photo layers are as large as the smallest square crop, up to this.
const MAX_TEXTURE_SIZE = 256

export type WarpTuning = RingTuning & {
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
  const images = Promise.all(photoUrls.map(decodedImage))
  images.catch(() => {})
  const handle = await acquireGalleryGpu()
  const { gpu } = handle
  const life = rendererLife(handle, signal, onFail)
  try {
    life.assertLive()
    const loaded = await images
    life.assertLive()
    const { layers: photos, size: textureSize } = squarePhotoLayers(gpu, loaded, {
      maxSize: MAX_TEXTURE_SIZE,
      fit: 'crop',
      label: 'gallery-warp-photos',
    })
    life.onDispose(() => photos.destroy())
    const output = gallerySurface(gpu, canvas, life)
    const warp = effect(gpu, warpSource, {
      label: 'gallery-warp',
      blend: 'premultiplied',
      set: { photos, photoSampler: photoSampler(gpu) },
    })
    life.onDispose(() => warp.dispose())

    // 0 is the 2x crop at rest, 1 the whole grid.
    const loop = ringLoop({
      gpu,
      life,
      canvas,
      output,
      effect: warp,
      tuning: initialTuning,
      prepare(motion, tuning) {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        // The 2x crop's edges land on cell edges.
        const restZoom = seeMoreRestZoom(width)
        const rings = ringUniforms((ring, radius) => {
          const progress = motion.progress[ring]
          // Follows the ring's progress, not its clock, so a reversal can't make it jump.
          const along = Math.min(1, Math.max(0, progress))
          const bulge = 1 + tuning.bulge * 4 * along * (1 - along) * (1 - radius * radius)
          return (restZoom + (1 - restZoom) * progress) * bulge
        })
        warp.set({
          params: {
            size: [width, height],
            dpr: output.dpr,
            gap: SEE_MORE_GAP,
            cellRadius: SEE_MORE_CELL_RADIUS,
            tileRadius: TILE_RADIUS,
            texSize: textureSize,
            mipCount: photos.mipLevelCount,
            rings,
          },
        })
      },
    })

    return { setZoomedOut: loop.setTarget, update: loop.update, dispose: life.dispose }
  } catch (error) {
    life.dispose()
    throw error
  }
}
