import { frame, init, sampler, surface, texture } from 'vgpu'
import type { Effect, Gpu, Surface } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import { createRingMotion } from '#/lib/ring-motion'
import type { RingMotion } from '#/lib/ring-motion'
import type { TransitionConfig } from '#/lib/transition'

// One WebGPU device for the whole Gallery: the See more tile, every featured photo and the
// full-screen expand. A page with a dozen devices would hit browser limits and compile every
// pipeline once per device.

type Entry = { gpu: Promise<Gpu>; users: number; failed?: Promise<Error> }
let shared: Entry | null = null

export type GalleryGpu = {
  gpu: Gpu
  /** Settles on the device's first loss or error; every renderer on it fails then. */
  failed: Promise<Error>
  release: () => void
}

/** Borrows the shared device, creating it on first use or after a loss. */
export async function acquireGalleryGpu(): Promise<GalleryGpu> {
  if (!shared) {
    const entry: Entry = { gpu: init({ powerPreference: 'low-power' }), users: 0 }
    shared = entry
    const forget = () => {
      if (shared === entry) shared = null
    }
    // A lost device can't be reused; the next acquire starts a new one.
    entry.gpu.then((gpu) => gpu.gpu.lost.then(forget), forget)
  }
  const entry = shared
  // Counted before the await, so a release in the meantime can't dispose a device in use.
  entry.users += 1
  let gpu: Gpu
  try {
    gpu = await entry.gpu
  } catch (error) {
    entry.users -= 1
    throw error
  }
  // Watched once per device, however many renderers share it.
  entry.failed ??= new Promise<Error>((fail) => {
    void gpu.gpu.lost.then((info) => fail(new Error(`WebGPU device lost: ${info.message}`)))
    gpu.onError((error) => fail(new Error(error.message)))
  })
  let released = false
  return {
    gpu,
    failed: entry.failed,
    release() {
      if (released) return
      released = true
      entry.users -= 1
      if (entry.users > 0) return
      if (shared === entry) shared = null
      gpu.dispose()
    },
  }
}

export type RendererLife = {
  /** Aborted on dispose: pass it to listeners, and hang resource cleanup off it. */
  readonly signal: AbortSignal
  readonly disposed: () => boolean
  /** Throws an AbortError once disposed, to stop a setup that is still awaiting. */
  readonly assertLive: () => void
  readonly dispose: () => void
  /** Runs `cleanup` when the renderer is disposed. */
  readonly onDispose: (cleanup: () => void) => void
  /** Disposes and reports the failure, unless already disposed. */
  readonly fail: (error: Error) => void
}

/**
 * The lifecycle every Gallery renderer shares: it ends when `signal` aborts, and fails, so its
 * caller can bring back the CSS fallback, when the device is lost or reports an error.
 */
export function rendererLife(
  handle: GalleryGpu,
  signal: AbortSignal,
  onFail: (error: Error) => void,
): RendererLife {
  const life = new AbortController()
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    life.abort()
    handle.release()
  }
  // Releasing the last user disposes the device, which also loses it; that loss is no failure.
  const fail = (error: Error) => {
    if (disposed) return
    dispose()
    onFail(error)
  }
  void handle.failed.then(fail)
  // A remount can abort before the device arrives; that signal never fires again.
  if (signal.aborted) dispose()
  else signal.addEventListener('abort', dispose, { once: true, signal: life.signal })
  return {
    signal: life.signal,
    disposed: () => disposed,
    assertLive() {
      if (disposed) throw new DOMException('Gallery renderer disposed', 'AbortError')
    },
    dispose,
    onDispose(cleanup) {
      life.signal.addEventListener('abort', cleanup, { once: true })
    },
    fail,
  }
}

/** A transparent surface that re-reads the pixel ratio on every frame (a range, not a number). */
export function gallerySurface(gpu: Gpu, canvas: HTMLCanvasElement, life: RendererLife) {
  const output = surface(gpu, canvas, { clearColor: [0, 0, 0, 0], dpr: [1, 4] })
  life.onDispose(() => output.dispose())
  return output
}

/** Trilinear filtering, so minified photos read their mip chain. */
export function photoSampler(gpu: Gpu) {
  return sampler(gpu, { minFilter: 'linear', magFilter: 'linear', mipmapFilter: 'linear' })
}

/**
 * Draws one pass of `effect`, or clears to transparent given null; a frame that throws fails the
 * renderer. False once it has.
 */
export function drawPass(gpu: Gpu, life: RendererLife, output: Surface, pass: Effect | null) {
  try {
    frame(gpu, (now) => now.pass(output, pass ?? (() => {})))
    return true
  } catch (error) {
    life.fail(error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

export type RingTuning = {
  /** Each ring's own move. */
  motion: TransitionConfig
  /** Seconds the corners start after the middle. */
  lead: number
}

/**
 * The draw loop of a renderer that zooms ring by ring (src/lib/ring-motion.ts): it draws while
 * the rings move or the canvas resizes, and sleeps once they settle. `prepare` sets the effect's
 * uniforms for each frame.
 */
export function ringLoop<T extends RingTuning>(options: {
  gpu: Gpu
  life: RendererLife
  canvas: HTMLCanvasElement
  output: Surface
  effect: Effect
  tuning: T
  prepare: (motion: RingMotion, tuning: T) => void
}) {
  const { gpu, life, canvas, output, effect, prepare } = options
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let tuning = options.tuning
  let timing = transitionTiming(tuning.motion)
  const motion = createRingMotion()
  let frameId = 0
  life.onDispose(() => cancelAnimationFrame(frameId))

  function draw(now: number) {
    frameId = 0
    if (life.disposed()) return
    const settled = motion.step(now, {
      duration: reducedMotion.matches ? 0 : timing.duration,
      lead: reducedMotion.matches ? 0 : tuning.lead,
      ease: timing.ease,
    })
    prepare(motion, tuning)
    if (drawPass(gpu, life, output, effect) && !settled) frameId = requestAnimationFrame(draw)
  }

  function wake() {
    if (life.disposed() || frameId) return
    frameId = requestAnimationFrame(draw)
  }
  watchCanvasPixels(canvas, wake, life.signal)
  wake()

  return {
    /** Zooms toward 1 (on) or back to 0. */
    setTarget: (on: boolean) => {
      if (motion.retarget(on ? 1 : 0, performance.now())) wake()
    },
    update: (nextTuning: T) => {
      tuning = nextTuning
      timing = transitionTiming(tuning.motion)
      wake()
    },
  }
}

// Two scratch canvases, reused by every upload: each mip level is drawn into one from the level
// before in the other.
let scratch: [HTMLCanvasElement, HTMLCanvasElement] | null = null

function scratchCanvas(index: number, width: number, height: number) {
  scratch ??= [document.createElement('canvas'), document.createElement('canvas')]
  const canvas = scratch[index]
  if (canvas.width < width) canvas.width = width
  if (canvas.height < height) canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Cannot prepare a Gallery photo')
  context.imageSmoothingQuality = 'high'
  context.clearRect(0, 0, width, height)
  return { canvas, context }
}

/**
 * Uploads `source` (a region of `image`, in its pixels) into one layer of `texture`, at every mip
 * level, so minified photos don't alias. The first level is filtered from the source, and each
 * one after from the level before, so each costs a quarter of the last.
 */
function uploadMips(
  gpu: Gpu,
  texture: GPUTexture,
  image: HTMLImageElement,
  source: { x: number; y: number; width: number; height: number },
  layer = 0,
) {
  let previous: { canvas: HTMLCanvasElement; width: number; height: number } | null = null
  for (let mipLevel = 0; mipLevel < texture.mipLevelCount; mipLevel += 1) {
    const width = Math.max(1, texture.width >> mipLevel)
    const height = Math.max(1, texture.height >> mipLevel)
    const { canvas, context } = scratchCanvas(mipLevel % 2, width, height)
    if (previous)
      context.drawImage(previous.canvas, 0, 0, previous.width, previous.height, 0, 0, width, height)
    else
      context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, width, height)
    gpu.gpu.queue.copyExternalImageToTexture(
      { source: canvas },
      { texture, mipLevel, origin: [0, 0, layer] },
      [width, height],
    )
    previous = { canvas, width, height }
  }
}

/** Mip levels down to about `smallest` texels on the longer side. */
function mipLevels(width: number, height: number, smallest = 16) {
  return Math.max(1, Math.floor(Math.log2(Math.max(width, height) / smallest)) + 1)
}

/**
 * One photo per layer of a square 2D array texture with mips: each photo's middle square. Layers
 * are as large as the smallest source, up to `maxSize`.
 */
export function squarePhotoLayers(
  gpu: Gpu,
  images: readonly HTMLImageElement[],
  { maxSize, label }: { maxSize: number; label: string },
) {
  const sources = images.map((image) => {
    const { naturalWidth: width, naturalHeight: height } = image
    const side = Math.min(width, height)
    return { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side, side }
  })
  const size = Math.max(1, Math.min(maxSize, ...sources.map((source) => Math.floor(source.side))))
  const layers = texture(gpu, {
    kind: '2d-array',
    size: [size, size],
    layers: images.length,
    format: 'rgba8unorm',
    mipLevelCount: mipLevels(size, size),
    usage: ['texture_binding', 'copy_dst', 'render_attachment'],
    label,
  })
  for (const [layer, image] of images.entries())
    uploadMips(gpu, layers.gpu, image, sources[layer], layer)
  return { layers, size }
}

/** A sampled 2D texture of a whole photo, at most `maxSize` on its longer side. */
export function photoTexture(gpu: Gpu, image: HTMLImageElement, maxSize: number, label: string) {
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const photo = texture(gpu, {
    kind: '2d',
    size: [width, height],
    format: 'rgba8unorm',
    mipLevelCount: mipLevels(width, height),
    usage: ['texture_binding', 'copy_dst', 'render_attachment'],
    label,
  }).gpu
  uploadMips(gpu, photo, image, {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  })
  return photo
}

/**
 * A square 2D array texture of `count` layers, each holding a whole photo squeezed square, that
 * keeps the photos it was given: `place` returns each photo's layer, uploading only photos it
 * doesn't hold yet, over the ones used least recently.
 */
export function photoLayerPool(gpu: Gpu, { size, count, label }: PoolOptions) {
  const layers = texture(gpu, {
    kind: '2d-array',
    size: [size, size],
    layers: count,
    format: 'rgba8unorm',
    mipLevelCount: mipLevels(size, size),
    usage: ['texture_binding', 'copy_dst', 'render_attachment'],
    label,
  })
  const held = new Map<HTMLImageElement, number>()
  // Least recently used first.
  let order: HTMLImageElement[] = []
  return {
    layers,
    size,
    place(images: readonly HTMLImageElement[]) {
      if (images.length > count) throw new Error(`A photo pool holds at most ${count} photos`)
      const wanted = new Set(images)
      const placed = images.map((image) => {
        let layer = held.get(image)
        if (layer === undefined) {
          if (held.size < count) layer = held.size
          else {
            const evicted = order.find((old) => !wanted.has(old))
            if (!evicted) throw new Error('A photo pool ran out of layers')
            layer = held.get(evicted) ?? 0
            held.delete(evicted)
            order = order.filter((old) => old !== evicted)
          }
          const { naturalWidth: width, naturalHeight: height } = image
          uploadMips(gpu, layers.gpu, image, { x: 0, y: 0, width, height }, layer)
          held.set(image, layer)
        }
        return layer
      })
      order = [...order.filter((old) => !wanted.has(old)), ...images]
      return placed
    },
    destroy: () => layers.destroy(),
  }
}

type PoolOptions = { size: number; count: number; label: string }

/**
 * Calls `redraw` whenever the canvas's backing store needs a new size: its box resized, or the
 * pixel ratio changed (another display, or a zoom step that keeps the CSS size).
 */
export function watchCanvasPixels(
  canvas: HTMLCanvasElement,
  redraw: () => void,
  signal: AbortSignal,
) {
  const observer = new ResizeObserver(redraw)
  // The device-pixel box also changes with the pixel ratio; Safari only has the content box.
  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' })
  } catch {
    observer.observe(canvas)
  }
  signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  // Where the observer can't see a pixel ratio change, this can.
  const watchPixelRatio = () => {
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        redraw()
        watchPixelRatio()
      },
      { once: true, signal },
    )
  }
  watchPixelRatio()
}
