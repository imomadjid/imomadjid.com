// Writes the live-glass fixture's scenes: scenes.json, read by the SwiftUI app (Sources) and by
// /dev/live-glass, and the pattern PNGs they share. Run from the repo root:
//   bun tools/glass-live/scenes.ts
// Every scene is an iPhone 16 Pro screen (402 x 874 pt) with the glass close button where the
// Gallery overlay floats it: 56 pt, centred, its bottom on the 34 pt home-indicator inset.
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

import sizes from '../../src/assets/gallery/photos.json'
import { masonryColumns } from '../../src/lib/gallery-masonry'

const root = new URL('.', import.meta.url).pathname
const repo = new URL('../../', import.meta.url).pathname
const WIDTH = 402
const HEIGHT = 874
const SCALE = 3
const BUTTON = { x: WIDTH / 2 - 28, y: HEIGHT - 34 - 56, size: 56 }
// Patterns cover 192 pt around the button: past the 56 pt the refraction and the frost's 3 sigma
// can reach, and small enough that a 512 px photo layer keeps their 1 pt lines.
const PATTERN = 192

type Image = { file: string; x: number; y: number; width: number; height: number; radius: number }
type Scene = {
  name: string
  scheme: 'light' | 'dark'
  background: string
  button: typeof BUTTON
  images: Image[]
}

// The overlay's layout below the sm breakpoint: px-2 pt-2, gap-1.5, four columns, the first 16
// photos round the columns in turn (src/components/gallery-overlay.tsx).
function galleryImages(scroll = 0): Image[] {
  const order = [...readFileSync(`${repo}src/lib/gallery.ts`, 'utf8').matchAll(/photo\('(\w+)'/g)]
  const known = new Map(Object.entries(sizes))
  const photos = order.map(([, id]) => {
    const size = known.get(id)
    if (!size) throw new Error(`No size for ${id} in photos.json`)
    return { id, width: size.width, height: size.height }
  })
  const pad = 8
  const gap = 6
  const width = (WIDTH - 2 * pad - 3 * gap) / 4
  const columns = masonryColumns(
    photos.map((photo) => photo.height / photo.width),
    4,
    4,
  )
  const images: Image[] = []
  for (const [column, indices] of columns.entries()) {
    let y = pad - scroll
    for (const index of indices) {
      const photo = photos[index]
      const height = (width * photo.height) / photo.width
      if (y < HEIGHT && y + height > 0)
        images.push({
          file: `${photo.id}-640.webp`,
          x: pad + column * (width + gap),
          y,
          width,
          height,
          radius: 8,
        })
      y += height + gap
    }
  }
  return images
}

// A 1 pt black line every 8 pt on white, offset so lines cross the button's middle and edges:
// how far each line bends inside the glass reads off its refraction profile.
function gridPattern() {
  const w = WIDTH * SCALE
  const h = HEIGHT * SCALE
  const pixels = new Uint8Array(w * h * 3).fill(255)
  const period = 8 * SCALE
  const ox = Math.round((BUTTON.x + BUTTON.size / 2) * SCALE) % period
  const oy = Math.round((BUTTON.y + BUTTON.size / 2) * SCALE) % period
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const line =
        (x - ox + period * 10) % period < SCALE || (y - oy + period * 10) % period < SCALE
      if (line) pixels.fill(0, (y * w + x) * 3, (y * w + x) * 3 + 3)
    }
  return patternPng(pixels)
}

// A grey ramp across the button and 30 pt either side, along x or y: inside the glass each pixel's
// level says where it samples the backdrop from, once the material's tone is taken out.
function rampPattern(axis: 'x' | 'y') {
  const w = WIDTH * SCALE
  const h = HEIGHT * SCALE
  const pixels = new Uint8Array(w * h * 3)
  const start = (axis === 'x' ? BUTTON.x : BUTTON.y) - 30
  const span = BUTTON.size + 60
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = ((axis === 'x' ? x : y) / SCALE + 0.5 / SCALE - start) / span
      pixels.fill(
        Math.round(255 * Math.min(1, Math.max(0, t))),
        (y * w + x) * 3,
        (y * w + x) * 3 + 3,
      )
    }
  return patternPng(pixels)
}

// The same along a 10 pt sawtooth, for finer positions: the coarse ramp says which tooth.
function sawPattern(axis: 'x' | 'y') {
  const w = WIDTH * SCALE
  const h = HEIGHT * SCALE
  const pixels = new Uint8Array(w * h * 3)
  const origin = axis === 'x' ? BUTTON.x : BUTTON.y
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = ((((axis === 'x' ? x : y) + 0.5) / SCALE - origin) / 10 + 100) % 1
      pixels.fill(Math.round(255 * t), (y * w + x) * 3, (y * w + x) * 3 + 3)
    }
  return patternPng(pixels)
}

// Black left of the button's middle, white right of it: the edge's spread inside is the blur.
function stepPattern() {
  const w = WIDTH * SCALE
  const h = HEIGHT * SCALE
  const pixels = new Uint8Array(w * h * 3)
  const middle = (BUTTON.x + BUTTON.size / 2) * SCALE
  for (let y = 0; y < h; y++) pixels.fill(255, (y * w + middle) * 3, (y + 1) * w * 3)
  return patternPng(pixels)
}

/** Crops a full-screen pattern to the PATTERN square around the button, as a PNG. */
function patternPng(screen: Uint8Array) {
  const w = WIDTH * SCALE
  const side = PATTERN * SCALE
  const x0 = Math.round((BUTTON.x + BUTTON.size / 2 - PATTERN / 2) * SCALE)
  const y0 = Math.round((BUTTON.y + BUTTON.size / 2 - PATTERN / 2) * SCALE)
  const out = new Uint8Array(side * side * 3)
  for (let y = 0; y < side; y++)
    out.set(screen.subarray(((y0 + y) * w + x0) * 3, ((y0 + y) * w + x0 + side) * 3), y * side * 3)
  return png(side, side, out)
}

function png(width: number, height: number, rgb: Uint8Array) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++)
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (width * 3 + 1) + 1)
  const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(data.length + 12)
    out.writeUInt32BE(data.length, 0)
    out.write(type, 4, 'latin1')
    data.copy(out, 8)
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
    return out
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function crc32(bytes: Uint8Array) {
  let crc = ~0
  for (const byte of bytes) {
    crc ^= byte
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return ~crc >>> 0
}

const pattern = (file: string): Image => ({
  file,
  x: BUTTON.x + BUTTON.size / 2 - PATTERN / 2,
  y: BUTTON.y + BUTTON.size / 2 - PATTERN / 2,
  width: PATTERN,
  height: PATTERN,
  radius: 0,
})
// --surface-1 in src/styles.css.
const surface = { light: '#fafafa', dark: '#171717' }
const gallery = galleryImages()
// The whole list fits one screen, so the scrolled scenes push it 150 pt down instead: the button
// sits over two photos and the gap between their columns.
const scrolled = galleryImages(-150)
const scenes: Scene[] = [
  {
    name: 'gallery-light',
    scheme: 'light',
    background: surface.light,
    button: BUTTON,
    images: gallery,
  },
  {
    name: 'gallery-dark',
    scheme: 'dark',
    background: surface.dark,
    button: BUTTON,
    images: gallery,
  },
  {
    name: 'scrolled-light',
    scheme: 'light',
    background: surface.light,
    button: BUTTON,
    images: scrolled,
  },
  {
    name: 'scrolled-dark',
    scheme: 'dark',
    background: surface.dark,
    button: BUTTON,
    images: scrolled,
  },
  {
    name: 'grid-light',
    scheme: 'light',
    background: '#ffffff',
    button: BUTTON,
    images: [pattern('grid.png')],
  },
  {
    name: 'grid-dark',
    scheme: 'dark',
    background: '#ffffff',
    button: BUTTON,
    images: [pattern('grid.png')],
  },
  {
    name: 'ramp-x-light',
    scheme: 'light',
    background: '#000000',
    button: BUTTON,
    images: [pattern('ramp-x.png')],
  },
  {
    name: 'ramp-y-light',
    scheme: 'light',
    background: '#000000',
    button: BUTTON,
    images: [pattern('ramp-y.png')],
  },
  {
    name: 'ramp-x-dark',
    scheme: 'dark',
    background: '#000000',
    button: BUTTON,
    images: [pattern('ramp-x.png')],
  },
  {
    name: 'ramp-y-dark',
    scheme: 'dark',
    background: '#000000',
    button: BUTTON,
    images: [pattern('ramp-y.png')],
  },
  {
    name: 'saw-x-light',
    scheme: 'light',
    background: '#000000',
    button: BUTTON,
    images: [pattern('saw-x.png')],
  },
  {
    name: 'saw-y-light',
    scheme: 'light',
    background: '#000000',
    button: BUTTON,
    images: [pattern('saw-y.png')],
  },
  {
    name: 'saw-x-dark',
    scheme: 'dark',
    background: '#000000',
    button: BUTTON,
    images: [pattern('saw-x.png')],
  },
  {
    name: 'saw-y-dark',
    scheme: 'dark',
    background: '#000000',
    button: BUTTON,
    images: [pattern('saw-y.png')],
  },
  {
    name: 'step-light',
    scheme: 'light',
    background: '#000000',
    button: BUTTON,
    images: [pattern('step.png')],
  },
  {
    name: 'step-dark',
    scheme: 'dark',
    background: '#000000',
    button: BUTTON,
    images: [pattern('step.png')],
  },
  { name: 'white', scheme: 'light', background: '#ffffff', button: BUTTON, images: [] },
  { name: 'grey', scheme: 'light', background: '#f2f1f6', button: BUTTON, images: [] },
  { name: 'dark', scheme: 'dark', background: '#1c1c1e', button: BUTTON, images: [] },
  { name: 'black', scheme: 'dark', background: '#000000', button: BUTTON, images: [] },
]

writeFileSync(`${root}Scenes/grid.png`, gridPattern())
writeFileSync(`${root}Scenes/ramp-x.png`, rampPattern('x'))
writeFileSync(`${root}Scenes/ramp-y.png`, rampPattern('y'))
writeFileSync(`${root}Scenes/saw-x.png`, sawPattern('x'))
writeFileSync(`${root}Scenes/saw-y.png`, sawPattern('y'))
writeFileSync(`${root}Scenes/step.png`, stepPattern())
writeFileSync(
  `${root}Scenes/scenes.json`,
  `${JSON.stringify({ width: WIDTH, height: HEIGHT, scenes }, null, 2)}\n`,
)
console.log(`${scenes.length} scenes, ${gallery.length} gallery photos`)
