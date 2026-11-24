import { init } from 'vgpu'
import type { Gpu } from 'vgpu'

// One WebGPU device for the whole Gallery: the See more tile, every featured photo and the
// full-screen expand. A page with a dozen devices would hit browser limits and compile every
// pipeline once per device.

type Entry = { gpu: Promise<Gpu>; users: number }
let shared: Entry | null = null

export type GalleryGpu = {
  gpu: Gpu
  /** Signals once the device is lost, or disposed after the last release. */
  lost: Promise<GPUDeviceLostInfo>
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
  let released = false
  return {
    gpu,
    lost: gpu.gpu.lost,
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
  void handle.lost.then((info) => fail(new Error(`WebGPU device lost: ${info.message}`)))
  const unsubscribe = handle.gpu.onError((error) => fail(new Error(error.message)))
  life.signal.addEventListener('abort', unsubscribe, { once: true })
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
    fail,
  }
}

export async function loadImage(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

/**
 * Uploads `source` (a region of `image`, in its pixels) into one layer of `texture`, at every mip
 * level, each filtered from the source so minified photos don't alias.
 */
export function uploadMips(
  gpu: Gpu,
  texture: GPUTexture,
  image: HTMLImageElement,
  source: { x: number; y: number; width: number; height: number },
  layer = 0,
) {
  const scratch = document.createElement('canvas')
  const context = scratch.getContext('2d')
  if (!context) throw new Error('Cannot prepare a Gallery photo')
  context.imageSmoothingQuality = 'high'
  for (let mipLevel = 0; mipLevel < texture.mipLevelCount; mipLevel += 1) {
    const width = Math.max(1, texture.width >> mipLevel)
    const height = Math.max(1, texture.height >> mipLevel)
    scratch.width = width
    scratch.height = height
    context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, width, height)
    gpu.gpu.queue.copyExternalImageToTexture(
      { source: scratch },
      { texture, mipLevel, origin: [0, 0, layer] },
      [width, height],
    )
  }
}

/** Mip levels down to about `smallest` texels on the longer side. */
export function mipLevels(width: number, height: number, smallest = 16) {
  return Math.max(1, Math.floor(Math.log2(Math.max(width, height) / smallest)) + 1)
}

/** A sampled 2D texture of a whole photo, at most `maxSize` on its longer side. */
export function photoTexture(gpu: Gpu, image: HTMLImageElement, maxSize: number, label: string) {
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const texture = gpu.gpu.createTexture({
    label,
    size: [width, height],
    format: 'rgba8unorm',
    mipLevelCount: mipLevels(width, height),
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  })
  uploadMips(gpu, texture, image, {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  })
  return texture
}

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
