import type { TransitionConfig } from 'dialkit'
import { effect, frame, sampler, surface } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import { coverCrop } from '#/lib/gallery-flight-geometry'
import { acquireGalleryGpu, photoTexture, rendererLife, watchCanvasPixels } from '#/lib/gallery-gpu'
import { decodedImage } from '#/lib/gallery-images'
import { createRingMotion, ringUniforms } from '#/lib/ring-motion'
import photoSource from '#/shaders/gallery-photo.wgsl'

// The featured tiles' rounded-xl corners.
const TILE_RADIUS = 12
// Enough for a ~180px tile at 3x zoomed in a little.
const MAX_TEXTURE_SIZE = 640

export type PhotoZoomTuning = {
  motion: TransitionConfig
  /** Seconds the corners start after the middle. */
  lead: number
  /** How far the photo zooms in on hover, as a fraction: 0.06 is 6%. */
  zoom: number
}

export type PhotoZoom = {
  setZoomedIn: (zoomedIn: boolean) => void
  update: (tuning: PhotoZoomTuning) => void
  dispose: () => void
}

/**
 * Draws one featured photo cropped to its tile, and on hover zooms it in a little inside the
 * tile, ring by ring from the middle out (src/lib/ring-motion.ts), like the See more tile.
 */
export async function startPhotoZoom(
  canvas: HTMLCanvasElement,
  photoUrl: string,
  initialTuning: PhotoZoomTuning,
  signal: AbortSignal,
  onFail: (error: Error) => void,
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
    const texture = photoTexture(gpu, photo, MAX_TEXTURE_SIZE, 'gallery-photo')
    life.signal.addEventListener('abort', () => texture.destroy(), { once: true })
    const output = surface(gpu, canvas, { clearColor: [0, 0, 0, 0], dpr: [1, 4] })
    const zoom = effect(gpu, photoSource, {
      label: 'gallery-photo',
      blend: 'premultiplied',
      set: {
        photo: texture,
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
        zoom.dispose()
        output.dispose()
      },
      { once: true },
    )

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tuning = initialTuning
    let timing = transitionTiming(tuning.motion)
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
      const crop = coverCrop(photo.naturalWidth / photo.naturalHeight, width / height)
      zoom.set({
        params: {
          size: [width, height],
          dpr: output.dpr,
          radius: TILE_RADIUS,
          crop: [crop.x, crop.y, crop.width, crop.height],
          rings: ringUniforms((ring) => 1 + tuning.zoom * motion.progress[ring]),
        },
      })
      try {
        frame(gpu, (current) => current.pass(output, zoom))
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
      setZoomedIn(zoomedIn) {
        if (motion.retarget(zoomedIn ? 1 : 0, performance.now())) wake()
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
