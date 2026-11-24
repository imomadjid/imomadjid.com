import { effect, frame, sampler, target, texture } from 'vgpu'
import type { Effect, Target } from 'vgpu'

import { coverCrop } from '#/lib/gallery-flight-geometry'
import {
  acquireGalleryGpu,
  gallerySurface,
  photoLayerPool,
  photoSampler,
  rendererLife,
  watchCanvasPixels,
} from '#/lib/gallery-gpu'
import material from '#/lib/live-glass-material.json'
import { LIVE_GLASS_MARGIN } from '#/lib/live-glass-source'
import type { LiveGlassPhoto, LiveGlassSource } from '#/lib/live-glass-source'
import blurSource from '#/shaders/live-glass-blur.wgsl'
import composeSource from '#/shaders/live-glass-compose.wgsl'
import glassSource from '#/shaders/live-glass.wgsl'

// Live liquid glass: refracts, frosts and tones the photos behind a glass shape on WebGPU, as
// iOS 27's .glassEffect(.regular) does. The material (refraction, frost, saturation, and the
// tone, rim and shadow tables) is fitted to iOS simulator captures by tools/glass-live/fit.py.
// WebGPU can't read the page's pixels, so a LiveGlassSource lists what is behind the glass:
// photos as <img> elements on a flat colour. Where neither is known the glass shows the colour.
// Each frame composes that backdrop around the glass twice, sharp at up to 2x for the frost's
// narrow blur and at 1x for its wide one, blurs each across and down, then draws the glass.

// The fitted shape: a 56 pt circle. Smaller shapes narrow the refraction in proportion.
const FITTED_SIZE = material.size
const MAX_PHOTOS = 8
const LAYER_SIZE = 512
const MAX_PULL = Math.max(...material.pulls)

export type LiveGlass = { wake: () => void; dispose: () => void }

type Scheme = (typeof material)['light']

/**
 * Draws live glass over `canvas`, which reaches LIVE_GLASS_MARGIN past the glass shape on every
 * side; the shape's corner radius comes from `radius` in CSS pixels. Draws whenever the source,
 * the canvas's box or the theme changes, and on every frame while any of them keeps moving.
 */
export async function startLiveGlass(
  canvas: HTMLCanvasElement,
  source: LiveGlassSource,
  radius: () => number,
  signal: AbortSignal,
  onFail: (error: Error) => void,
): Promise<LiveGlass> {
  const handle = await acquireGalleryGpu()
  const { gpu } = handle
  const life = rendererLife(handle, signal, onFail)
  try {
    life.assertLive()
    const output = gallerySurface(gpu, canvas, life)
    const pool = photoLayerPool(gpu, { size: LAYER_SIZE, count: MAX_PHOTOS, label: 'live-glass' })
    life.onDispose(() => pool.destroy())
    const table = materialTable(gpu)
    life.onDispose(() => table.destroy())
    const linear = sampler(gpu, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
    })
    const backdropTarget = (label: string) => {
      const made = target(gpu, { size: [1, 1], format: 'rgba16float', label })
      life.onDispose(() => made.color.destroy())
      return made
    }
    // Sharp and wide, each with a second target for the blur's first direction.
    const sharp = [backdropTarget('live-glass-sharp'), backdropTarget('live-glass-sharp-2')]
    const soft = [backdropTarget('live-glass-wide'), backdropTarget('live-glass-wide-2')]
    const photoBindings = { photos: pool.layers, photoSampler: photoSampler(gpu) }
    const composeSharp = effect(gpu, composeSource, {
      label: 'live-glass-compose',
      set: photoBindings,
    })
    const composeWide = effect(gpu, composeSource, {
      label: 'live-glass-compose-wide',
      set: photoBindings,
    })
    // One per blur pass: a frame's passes read their uniforms when it's submitted.
    const blurs = [0, 1, 2, 3].map((i) =>
      effect(gpu, blurSource, { label: `live-glass-blur-${i}`, set: { sourceSampler: linear } }),
    )
    const glass = effect(gpu, glassSource, {
      label: 'live-glass',
      blend: 'premultiplied',
      set: {
        backdropSampler: linear,
        material: table,
        materialSampler: sampler(gpu, {
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'repeat',
          addressModeV: 'clamp-to-edge',
        }),
      },
    })
    const made: Effect[] = [composeSharp, composeWide, ...blurs, glass]
    life.onDispose(() => {
      for (const fx of made) fx.dispose()
    })

    let frameId = 0
    let last = ''
    let still = 0
    life.onDispose(() => cancelAnimationFrame(frameId))

    function draw() {
      frameId = 0
      if (life.disposed()) return
      const box = canvas.getBoundingClientRect()
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width === 0 || height === 0) return
      // Dark wherever a .dark ancestor applies the dark tokens, as the static glass reads them.
      const dark = canvas.closest('.dark') !== null
      const scheme: Scheme = dark ? material.dark : material.light
      const glassWidth = width - 2 * LIVE_GLASS_MARGIN
      const glassHeight = height - 2 * LIVE_GLASS_MARGIN
      const scale = Math.min(1, Math.min(glassWidth, glassHeight) / FITTED_SIZE)
      // The backdrop the glass reads: the canvas, grown by the pull and the wide blur's reach.
      const reach = Math.ceil(MAX_PULL * scale + 3 * scheme.wideBlur + 2)
      const region = new DOMRect(
        box.x - reach,
        box.y - reach,
        box.width + 2 * reach,
        box.height + 2 * reach,
      )
      const scene = source.scene(region)
      const photos = nearest(scene.photos, region, box)
      const signature = [
        box.x,
        box.y,
        width,
        height,
        output.dpr,
        dark,
        scene.background,
        ...photos.flatMap((photo) => [
          photo.image.currentSrc,
          photo.rect.x,
          photo.rect.y,
          photo.rect.width,
        ]),
      ].join()
      // Draws while anything moves, then two frames more, and sleeps.
      if (signature === last) {
        still += 1
        if (still > 2) return
      } else {
        still = 0
        last = signature
      }

      const layers = pool.place(photos.map((photo) => photo.image))
      const sharpScale = Math.min(output.dpr, 2)
      const sharpSize = texels(region, sharpScale)
      const wideSize = texels(region, 1)
      resize(sharp, sharpSize)
      resize(soft, wideSize)
      const background = [...cssColor(scene.background), 1]
      const composed = {
        origin: [region.x, region.y],
        span: [region.width, region.height],
        count: photos.length,
        layerSize: LAYER_SIZE,
        _pad: 0,
        background,
        rects: slots(
          photos.map((photo) => [photo.rect.x, photo.rect.y, photo.rect.width, photo.rect.height]),
        ),
        crops: slots(
          photos.map((photo) => {
            const crop = coverCrop(
              photo.image.naturalWidth / photo.image.naturalHeight,
              photo.rect.width / photo.rect.height,
            )
            return [crop.x, crop.y, crop.width, crop.height]
          }),
        ),
        styles: slots(photos.map((photo, i) => [photo.radius, layers[i], 0, 0])),
      }
      composeSharp.set({ params: { ...composed, texel: 1 / sharpScale } })
      composeWide.set({ params: { ...composed, texel: 1 } })
      const blur = (i: number, from: Target, size: number[], across: boolean, sigma: number) => {
        blurs[i].set({
          source: from,
          params: { step: across ? [1 / size[0], 0] : [0, 1 / size[1]], sigma, _pad: 0 },
        })
        return blurs[i]
      }
      glass.set({
        narrow: sharp[0],
        wideBlur: soft[0],
        params: {
          size: [width, height],
          dpr: output.dpr,
          scheme: dark ? 1 : 0,
          origin: [box.x, box.y],
          scale,
          radius: Math.min(radius(), glassWidth / 2, glassHeight / 2),
          box: [LIVE_GLASS_MARGIN, LIVE_GLASS_MARGIN, glassWidth, glassHeight],
          region: [region.x, region.y, region.width, region.height],
          wide: scheme.wide,
          saturation: scheme.saturation,
          tableMin: material.dMin,
          tableStep: material.dStep,
          tableRows: scheme.gain.length,
          tableAngles: material.angles,
          _pad: [0, 0],
          knots: quads(material.knots),
          pulls: quads(material.pulls),
        },
      })
      try {
        frame(gpu, (now) => {
          now.pass(sharp[0], composeSharp)
          now.pass(sharp[1], blur(0, sharp[0], sharpSize, true, scheme.blur * sharpScale))
          now.pass(sharp[0], blur(1, sharp[1], sharpSize, false, scheme.blur * sharpScale))
          now.pass(soft[0], composeWide)
          now.pass(soft[1], blur(2, soft[0], wideSize, true, scheme.wideBlur))
          now.pass(soft[0], blur(3, soft[1], wideSize, false, scheme.wideBlur))
          now.pass(output, glass)
        })
      } catch (error) {
        life.fail(error instanceof Error ? error : new Error(String(error)))
        return
      }
      frameId = requestAnimationFrame(draw)
    }

    function wake() {
      still = 0
      if (life.disposed() || frameId) return
      frameId = requestAnimationFrame(draw)
    }

    const unsubscribe = source.subscribe(wake)
    life.onDispose(unsubscribe)
    watchCanvasPixels(canvas, wake, life.signal)
    const theme = new MutationObserver(wake)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    life.onDispose(() => theme.disconnect())
    // The glass's own box moves with transitions and animations around it.
    for (const type of ['transitionrun', 'animationstart', 'load'])
      document.addEventListener(type, wake, { capture: true, signal: life.signal })
    window.addEventListener('resize', wake, { signal: life.signal })
    wake()

    return { wake, dispose: life.dispose }
  } catch (error) {
    life.dispose()
    throw error
  }
}

/** The loaded photos within `region`, nearest `box` first, as many as the shader takes. */
function nearest(photos: readonly LiveGlassPhoto[], region: DOMRectReadOnly, box: DOMRectReadOnly) {
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  return photos
    .filter(
      (photo) =>
        photo.image.complete &&
        photo.image.naturalWidth > 0 &&
        photo.rect.right > region.left &&
        photo.rect.left < region.right &&
        photo.rect.bottom > region.top &&
        photo.rect.top < region.bottom,
    )
    .map((photo) => ({ photo, gap: distance(photo.rect, middle) }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, MAX_PHOTOS)
    .map(({ photo }) => photo)
}

/** Whole texels covering `region` at `scale` per CSS pixel. */
function texels(region: DOMRectReadOnly, scale: number) {
  return [
    Math.max(1, Math.ceil(region.width * scale)),
    Math.max(1, Math.ceil(region.height * scale)),
  ]
}

function resize(targets: Target[], size: number[]) {
  for (const t of targets)
    if (t.size[0] !== size[0] || t.size[1] !== size[1]) t.resize([size[0], size[1]])
}

/** Packs up to 12 numbers into three vec4s. */
function quads(values: readonly number[]) {
  return [0, 1, 2].map((i) => Array.from({ length: 4 }, (_, j) => values[i * 4 + j] ?? 0))
}

/** How far `point` is from `rect`, 0 inside it. */
function distance(rect: DOMRectReadOnly, point: { x: number; y: number }) {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right)
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom)
  return Math.hypot(dx, dy)
}

/** Pads a list of vec4s to the shader's eight slots. */
function slots(values: number[][]) {
  return Array.from({ length: MAX_PHOTOS }, (_, i) => values[i] ?? [0, 0, 0, 0])
}

/**
 * The material tables as a 2-layer array texture (light, dark): one texel per (angle, d) bin
 * holding offset, gain and curve, in half floats so the sampler filters between bins.
 */
function materialTable(gpu: Parameters<typeof texture>[0]) {
  const rows = material.light.gain.length
  const angles = material.angles
  const data = new Uint16Array(angles * rows * 4 * 2)
  for (const [layer, scheme] of [material.light, material.dark].entries())
    for (let row = 0; row < rows; row++)
      for (let a = 0; a < angles; a++) {
        const at = ((layer * rows + row) * angles + a) * 4
        data[at] = half(scheme.offset[row][a])
        data[at + 1] = half(scheme.gain[row][a])
        data[at + 2] = half(scheme.curve[row][a])
        data[at + 3] = half(1)
      }
  const table = texture(gpu, {
    kind: '2d-array',
    size: [angles, rows],
    layers: 2,
    format: 'rgba16float',
    usage: ['texture_binding', 'copy_dst'],
    label: 'live-glass-material',
  })
  gpu.gpu.queue.writeTexture(
    { texture: table.gpu },
    data,
    { bytesPerRow: angles * 8, rowsPerImage: rows },
    [angles, rows, 2],
  )
  return table
}

const f32 = new Float32Array(1)
const u32 = new Uint32Array(f32.buffer)

/** IEEE half float bits of `value`, rounded to nearest. */
function half(value: number) {
  f32[0] = value
  const bits = u32[0]
  const sign = (bits >>> 16) & 0x8000
  const exponent = ((bits >>> 23) & 0xff) - 127 + 15
  const mantissa = bits & 0x7fffff
  if (exponent <= 0) return sign
  if (exponent >= 31) return sign | 0x7c00
  // Added, not ored: a mantissa that rounds up carries into the exponent.
  return sign | ((exponent << 10) + Math.round(mantissa / 0x2000))
}

const colors = new Map<string, [number, number, number]>()

/** A CSS colour as sRGB in 0-1, resolved by the browser. */
function cssColor(css: string): [number, number, number] {
  const known = colors.get(css)
  if (known) return known
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  let rgb: [number, number, number] = [1, 1, 1]
  if (context) {
    context.fillStyle = css
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    rgb = [r / 255, g / 255, b / 255]
  }
  colors.set(css, rgb)
  return rgb
}
