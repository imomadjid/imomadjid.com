import type { TransitionConfig } from 'dialkit'
import { effect, frame, init, sampler, surface, texture } from 'vgpu'

import { transitionTiming } from '#/lib/ambient-transition'
import warpSource from '#/shaders/gallery-warp.wgsl'

// Must match RING_COUNT in src/shaders/gallery-warp.wgsl.
const RING_COUNT = 48
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

async function loadSquare(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  const side = Math.min(image.naturalWidth, image.naturalHeight)
  return {
    image,
    sx: (image.naturalWidth - side) / 2,
    sy: (image.naturalHeight - side) / 2,
    side,
  }
}

/**
 * Draws the See more tile's 16 photos with WebGPU. Each of RING_COUNT rings around the middle
 * runs its own eased move between the 2x crop and the whole grid, delayed by its distance from the
 * middle, so the middle zooms first. A reversal restarts every ring from where it is, so the
 * motion stays continuous however often the pointer comes and goes.
 */
export async function startGalleryWarp(
  canvas: HTMLCanvasElement,
  photoUrls: readonly string[],
  initialTuning: WarpTuning,
  signal: AbortSignal,
): Promise<GalleryWarp> {
  if (photoUrls.length !== 16) throw new Error('The warp grid needs exactly 16 photos')
  const squares = Promise.all(photoUrls.map(loadSquare))
  squares.catch(() => {})
  const gpu = await init({ powerPreference: 'low-power' })
  const aborted = () => new DOMException('Gallery warp disposed', 'AbortError')
  // A remount can abort before the device arrives; that signal never fires again.
  if (signal.aborted) {
    gpu.dispose()
    throw aborted()
  }
  let disposed = false
  let frameId = 0
  const resizeObserver = new ResizeObserver(() => wake())
  const dispose = () => {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    gpu.dispose()
  }
  signal.addEventListener('abort', dispose, { once: true })

  const output = surface(gpu, canvas, { clearColor: [0, 0, 0, 0] })
  const loaded = await squares
  if (disposed) throw aborted()
  const textureSize = Math.min(MAX_TEXTURE_SIZE, ...loaded.map((square) => Math.floor(square.side)))
  // Down to a 16-texel level, past which nothing on the tile is small enough to need it.
  const mipCount = Math.max(1, Math.floor(Math.log2(textureSize / 16)) + 1)
  const photos = texture(gpu, {
    kind: '2d-array',
    size: [textureSize, textureSize],
    layers: 16,
    format: 'rgba8unorm',
    mipLevelCount: mipCount,
    usage: ['texture_binding', 'copy_dst', 'render_attachment'],
    label: 'gallery-warp-photos',
  })
  const scratch = document.createElement('canvas')
  const context = scratch.getContext('2d')
  if (!context) throw new Error('Cannot prepare the warp photos')
  context.imageSmoothingQuality = 'high'
  for (const [layer, square] of loaded.entries()) {
    if (disposed) throw aborted()
    // Filter each mip from the source, so the zoomed-out grid doesn't alias.
    for (let mipLevel = 0; mipLevel < mipCount; mipLevel += 1) {
      const size = Math.max(1, textureSize >> mipLevel)
      scratch.width = size
      scratch.height = size
      context.drawImage(
        square.image,
        square.sx,
        square.sy,
        square.side,
        square.side,
        0,
        0,
        size,
        size,
      )
      gpu.gpu.queue.copyExternalImageToTexture(
        { source: scratch },
        { texture: photos.gpu, mipLevel, origin: [0, 0, layer] },
        [size, size],
      )
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let tuning = initialTuning
  let timing = transitionTiming(tuning.motion)
  // 0 is the 2x crop at rest, 1 the whole grid.
  const progress = new Float32Array(RING_COUNT)
  const start = new Float32Array(RING_COUNT)
  let target = 0
  let moveStart = 0
  let moving = false

  const sizeOf = () => [canvas.clientWidth, canvas.clientHeight] as const
  // The 2x crop's edges land on cell edges: the middle two cells and one gap fill the tile.
  const restZoom = (side: number) => (2 * side) / (side - GAP)

  function rings(now: number) {
    const [width] = sizeOf()
    const elapsed = (now - moveStart) / 1000
    const duration = reducedMotion.matches ? 0 : timing.duration
    const lead = reducedMotion.matches ? 0 : tuning.lead
    let settled = true
    const values: number[] = []
    let previousReach = 0
    for (let i = 0; i < RING_COUNT; i += 1) {
      const radius = i / (RING_COUNT - 1)
      const local = duration > 0 ? (elapsed - lead * radius) / duration : 1
      if (local < 1) settled = false
      const eased = local <= 0 ? 0 : local >= 1 ? 1 : timing.ease(local)
      progress[i] = start[i] + (target - start[i]) * eased
      const move = Math.min(1, Math.max(0, local))
      const bulge = 1 + tuning.bulge * 4 * move * (1 - move) * (1 - radius * radius)
      const zoom = (restZoom(width) + (1 - restZoom(width)) * progress[i]) * bulge
      // Keep radius / zoom nondecreasing: a ring may never show grid nearer the middle than the
      // ring inside it, or the image folds over itself.
      const reach = Math.max(radius / zoom, previousReach)
      previousReach = reach
      values.push(i === 0 ? 1 / zoom : reach / radius)
    }
    return { values, settled }
  }

  function draw(now: number) {
    frameId = 0
    if (disposed) return
    const [width, height] = sizeOf()
    const { values, settled } = rings(now)
    moving = !settled
    const ringVectors = []
    for (let i = 0; i < RING_COUNT; i += 4) ringVectors.push(values.slice(i, i + 4))
    warp.set({
      params: {
        size: [width, height],
        dpr: output.dpr,
        gap: GAP,
        cellRadius: CELL_RADIUS,
        tileRadius: TILE_RADIUS,
        texSize: textureSize,
        mipCount,
        rings: ringVectors,
      },
    })
    frame(gpu, (current) => current.pass(output, warp))
    if (moving) frameId = requestAnimationFrame(draw)
  }

  function wake() {
    if (disposed || frameId) return
    frameId = requestAnimationFrame(draw)
  }

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
  resizeObserver.observe(canvas)
  wake()

  return {
    setZoomedOut(zoomedOut) {
      const next = zoomedOut ? 1 : 0
      if (next === target) return
      // Restart every ring from where it is now.
      start.set(progress)
      target = next
      moveStart = performance.now()
      wake()
    },
    update(nextTuning) {
      tuning = nextTuning
      timing = transitionTiming(tuning.motion)
      wake()
    },
    dispose,
  }
}
