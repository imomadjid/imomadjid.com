import { effect, texture } from 'vgpu'

import {
  TILE_RADIUS,
  acquireGalleryGpu,
  gallerySurface,
  mipLevels,
  photoSampler,
  rendererLife,
  ringLoop,
  uploadMips,
} from '#/lib/gallery-gpu'
import type { RingTuning } from '#/lib/gallery-gpu'
import { decodedImage } from '#/lib/gallery-images'
import { ringUniforms } from '#/lib/ring-motion'
import warpSource from '#/shaders/gallery-warp.wgsl'

// Photo layers are as large as the smallest square crop, up to this.
const MAX_TEXTURE_SIZE = 256
// The CSS tile's geometry: gap-0.5 and rounded-md cells at 1x.
const GAP = 2
const CELL_RADIUS = 6

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
    life.onDispose(() => photos.destroy())
    for (const [layer, image] of loaded.entries()) {
      uploadMips(gpu, photos.gpu, image, crops[layer], layer)
    }
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
        // The 2x crop's edges land on cell edges: the middle two cells and one gap fill the tile.
        const restZoom = (2 * width) / (width - GAP)
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
            gap: GAP,
            cellRadius: CELL_RADIUS,
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
