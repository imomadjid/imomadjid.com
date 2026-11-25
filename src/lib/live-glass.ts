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
// Each frame composes that backdrop around the glass for the sharp share: sampled at the
// captures' 3x, raised to the frost's power, and box-averaged to half that. The wide share blurs
// it at 1x across and down. Then it draws the glass.

// The fitted shape: a 56 pt circle. Smaller shapes narrow the refraction in proportion.
const FITTED_SIZE = material.size
const MAX_PHOTOS = 8
const LAYER_SIZE = 512
const MAX_PULL = Math.max(...material.pulls)
// Texels per CSS pixel the backdrop is composed at: the captures' 3x on any screen, so the sharp
// share, half of it, spreads as far in pt as iOS's does.
const COMPOSE_SCALE = 3
const STILL = { x: 0, y: 0 }
// The bevel's uniforms, which never change.
const BEVEL = {
  knots: quads(material.knots),
  pulls: quads(material.pulls),
  slopes: quads(material.slopes),
}

export type LiveGlass = { wake: () => void; dispose: () => void }

type Scheme = (typeof material)['light']

/**
 * Draws live glass over `canvas`, which reaches LIVE_GLASS_MARGIN past the glass shape on every
 * side; the shape's corner radius comes from `radius` in CSS pixels. Draws whenever the source,
 * the canvas's box or the theme changes, and on every frame while any of them keeps moving.
 * `onDrawn` runs once the first frame is drawn, so the static glass stays until then.
 */
export async function startLiveGlass(
  canvas: HTMLCanvasElement,
  source: LiveGlassSource,
  radius: () => number,
  signal: AbortSignal,
  onFail: (error: Error) => void,
  onDrawn: () => void,
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
    // The sharp share, sampled at 3x and box-averaged to half of it, as iOS draws it, and the
    // wide one with a second target for its blur's first direction.
    const sharp = backdropTarget('live-glass-sharp')
    const soft = [backdropTarget('live-glass-wide'), backdropTarget('live-glass-wide-2')]
    const compose = effect(gpu, composeSource, {
      label: 'live-glass-compose',
      set: { photos: pool.layers, photoSampler: photoSampler(gpu) },
    })
    // One per blur pass: a frame's passes read their uniforms when it's submitted.
    const blurs = [0, 1].map((i) =>
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
    const made: Effect[] = [compose, ...blurs, glass]
    life.onDispose(() => {
      for (const fx of made) fx.dispose()
    })

    let frameId = 0
    let last = ''
    let still = 0
    // Where each photo was last frame, whether they moved the frame before, and whether the
    // source scrolled them since, for the lead.
    let placed = new Map<HTMLImageElement, DOMRectReadOnly>()
    let stepped = false
    let scrolled = false
    life.onDispose(() => cancelAnimationFrame(frameId))

    let drawn = false

    // Any throw while drawing (reading the scene, uploading a photo, setting uniforms, the frame
    // itself) fails the renderer, so the static glass comes back.
    function draw() {
      frameId = 0
      if (life.disposed()) return
      try {
        if (!drawFrame()) return
      } catch (error) {
        life.fail(error instanceof Error ? error : new Error(String(error)))
        return
      }
      if (!drawn) {
        drawn = true
        onDrawn()
      }
      frameId = requestAnimationFrame(draw)
    }

    /** Draws one frame; false once nothing has changed for a few frames, or there's no box. */
    function drawFrame() {
      const box = canvas.getBoundingClientRect()
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width === 0 || height === 0) return false
      // Dark wherever a .dark ancestor applies the dark tokens, as the static glass reads them.
      const dark = canvas.closest('.dark') !== null
      const scheme: Scheme = dark ? material.dark : material.light
      const glassWidth = width - 2 * LIVE_GLASS_MARGIN
      const glassHeight = height - 2 * LIVE_GLASS_MARGIN
      const scale = Math.min(1, Math.min(glassWidth, glassHeight) / FITTED_SIZE)
      // The backdrop the glass reads: the canvas, grown by the pull and the wide blur's reach.
      const reach = Math.ceil(MAX_PULL * scale + 3 * scheme.wideBlur + 2)
      // On whole pairs of composed texels, so the sharp share's texels sit on a 3x screen's pixel
      // grid as iOS's do: the glass reads it back across them bilinearly.
      const pair = 2 / COMPOSE_SCALE
      const left = Math.floor((box.x - reach) / pair) * pair
      const top = Math.floor((box.y - reach) / pair) * pair
      const region = new DOMRect(
        left,
        top,
        Math.ceil((box.right + reach - left) / pair) * pair,
        Math.ceil((box.bottom + reach - top) / pair) * pair,
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
        if (still > 2) return false
      } else {
        still = 0
        last = signature
      }

      // Scrolled off the main thread, the screen is a frame past these rects. The photos lead by
      // their last step while they keep scrolling, which matches it at a steady speed; when they
      // stop, the glass is a step past for one frame, as it was a step behind before. Motion
      // without a scroll (an animation on the main thread) is in step and leads by nothing.
      const step = movement(photos, placed)
      const lead = scrolled && stepped && step ? step : STILL
      stepped = step !== null
      scrolled = false
      placed = new Map(photos.map((photo) => [photo.image, photo.rect]))

      const layers = pool.place(photos.map((photo) => photo.image))
      // The region spans whole pairs of 3x samples, so each sharp texel covers exactly a 2x2 block.
      const sharpSize = [
        Math.round((region.width * COMPOSE_SCALE) / 2),
        Math.round((region.height * COMPOSE_SCALE) / 2),
      ]
      const wideSize = texels(region, 1)
      resize([sharp], sharpSize)
      resize(soft, wideSize)
      const background = [...cssColor(scene.background), 1]
      const composed = {
        origin: [region.x, region.y],
        span: [region.width, region.height],
        count: photos.length,
        layerSize: LAYER_SIZE,
        gamma: scheme.gamma,
        viewport: [document.documentElement.clientWidth, document.documentElement.clientHeight],
        _pad2: [0, 0],
        background,
        rects: slots(
          photos.map((photo) => [
            photo.rect.x + lead.x,
            photo.rect.y + lead.y,
            photo.rect.width,
            photo.rect.height,
          ]),
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
      compose.set({ params: { ...composed, texel: 1 / COMPOSE_SCALE } })
      const blur = (i: number, from: Target, step: number[]) => {
        blurs[i].set({ source: from, params: { step, sigma: scheme.wideBlur, _pad: 0 } })
        return blurs[i]
      }
      glass.set({
        narrow: sharp,
        wideBlur: soft[0],
        params: {
          size: [width, height],
          dpr: output.dpr,
          scheme: dark ? 1 : 0,
          origin: [box.x, box.y],
          // Screen pixels per canvas CSS pixel: the button scales as it enters and leaves.
          zoom: [box.width / width, box.height / height],
          scale,
          radius: Math.min(radius(), glassWidth / 2, glassHeight / 2),
          box: [LIVE_GLASS_MARGIN, LIVE_GLASS_MARGIN, glassWidth, glassHeight],
          region: [region.x, region.y, region.width, region.height],
          wide: scheme.wide,
          saturation: scheme.saturation,
          gamma: scheme.gamma,
          tableMin: material.dMin,
          tableStep: material.dStep,
          tableRows: scheme.gain.length,
          tableAngles: material.angles,
          ...BEVEL,
        },
      })
      frame(gpu, (now) => {
        now.pass(sharp, compose)
        // The wide share blurs the sharp one, already in the frost's power: composed apart from
        // the photos' mips, it would average before the power, not after, and shift the tone of
        // anything finely patterned. The first pass resamples it to 1x as it reads it.
        now.pass(soft[1], blur(0, sharp, [1 / wideSize[0], 0]))
        now.pass(soft[0], blur(1, soft[1], [0, 1 / wideSize[1]]))
        now.pass(output, glass)
      })
      return true
    }

    function wake() {
      still = 0
      if (life.disposed() || frameId) return
      frameId = requestAnimationFrame(draw)
    }

    const unsubscribe = source.subscribe((change) => {
      if (change?.scrolled) scrolled = true
      wake()
    })
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

/** How far the photos moved since `before`, read off the nearest one in both; null if none did. */
function movement(
  photos: readonly LiveGlassPhoto[],
  before: ReadonlyMap<HTMLImageElement, DOMRectReadOnly>,
) {
  for (const photo of photos) {
    const was = before.get(photo.image)
    if (!was) continue
    const x = photo.rect.x - was.x
    const y = photo.rect.y - was.y
    return x === 0 && y === 0 ? null : { x, y }
  }
  return null
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
