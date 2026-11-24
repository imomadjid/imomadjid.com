import { effect } from 'vgpu'

import { coverCrop } from '#/lib/gallery-flight-geometry'
import {
  acquireGalleryGpu,
  gallerySurface,
  photoSampler,
  photoTexture,
  rendererLife,
  ringLoop,
} from '#/lib/gallery-gpu'
import type { RingTuning } from '#/lib/gallery-gpu'
import { decodedImage } from '#/lib/gallery-images'
import { ringUniforms } from '#/lib/ring-motion'
import { TILE_RADIUS } from '#/lib/see-more-grid'
import photoSource from '#/shaders/gallery-photo.wgsl'

// Enough for a ~180px tile at 3x zoomed in a little.
const MAX_TEXTURE_SIZE = 640

export type PhotoZoomTuning = RingTuning & {
  /** How far the photo zooms in on hover, as a fraction: 0.06 is 6%. */
  zoom: number
}

export type PhotoZoom = {
  setZoomedIn: (zoomedIn: boolean) => void
  update: (tuning: PhotoZoomTuning) => void
  dispose: () => void
}

/**
 * Draws one Gallery photo cropped to its tile, with corners of `radius` CSS pixels, and on hover
 * zooms it in a little inside the tile, ring by ring from the middle out
 * (src/lib/ring-motion.ts), like the See more tile.
 */
export async function startPhotoZoom(
  canvas: HTMLCanvasElement,
  photoUrl: string,
  initialTuning: PhotoZoomTuning,
  signal: AbortSignal,
  onFail: (error: Error) => void,
  radius = TILE_RADIUS,
): Promise<PhotoZoom> {
  const image = decodedImage(photoUrl)
  image.catch(() => {})
  const handle = await acquireGalleryGpu()
  const { gpu } = handle
  const life = rendererLife(handle, signal, onFail)
  try {
    life.assertLive()
    const photo = await image
    life.assertLive()
    const aspect = photo.naturalWidth / photo.naturalHeight
    const texture = photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-photo')
    life.onDispose(() => texture.destroy())
    const output = gallerySurface(gpu, canvas, life)
    const zoom = effect(gpu, photoSource, {
      label: 'gallery-photo',
      blend: 'premultiplied',
      set: { photo: texture, photoSampler: photoSampler(gpu) },
    })
    life.onDispose(() => zoom.dispose())

    const loop = ringLoop({
      gpu,
      life,
      canvas,
      output,
      effect: zoom,
      tuning: initialTuning,
      prepare(motion, tuning) {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        const crop = coverCrop(aspect, width / height)
        zoom.set({
          params: {
            size: [width, height],
            dpr: output.dpr,
            radius,
            crop: [crop.x, crop.y, crop.width, crop.height],
            rings: ringUniforms((ring) => 1 + tuning.zoom * motion.progress[ring]),
          },
        })
      },
    })

    return { setZoomedIn: loop.setTarget, update: loop.update, dispose: life.dispose }
  } catch (error) {
    life.dispose()
    throw error
  }
}
