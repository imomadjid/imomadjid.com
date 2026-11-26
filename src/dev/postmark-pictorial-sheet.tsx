import { useEffect, useRef } from 'react'

import { pictorials, pictorialStroke } from './postmark-pictorials'

// Every pictorial at 64 px (its size on the wall) and 200 px, one ink, for review against the
// style guide (tools/postmarks/pictorial-style.md). It measures each drawing's ink box from the
// rendered strokes and flags a stored `ink` box more than 2 units off, since lettering clears it.

const tolerance = 2
// Rendering resolution for measuring: 4 px per unit.
const scale = 4

type Box = readonly [number, number, number, number]

// The ink box of a drawing, from its pixels: getBBox ignores masks and boxes rotated groups
// loosely, so it overstates a drawing like Depok's tilted fruit.
async function measure(svg: SVGSVGElement): Promise<Box | undefined> {
  const copy = svg.cloneNode(true)
  if (!(copy instanceof SVGSVGElement)) return undefined
  copy.setAttribute('width', String(100 * scale))
  copy.setAttribute('height', String(100 * scale))
  copy.setAttribute('color', '#000')
  copy.querySelector('[data-ink-guide]')?.remove()
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 100 * scale
  const context = canvas.getContext('2d')
  if (!context) return undefined
  context.drawImage(image, 0, 0)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 0) < 100) continue
    const pixel = (index - 3) / 4
    const [x, y] = [pixel % canvas.width, Math.floor(pixel / canvas.width)]
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  if (maxX < 0) return undefined
  return [minX / scale, minY / scale, (maxX - minX + 1) / scale, (maxY - minY + 1) / scale]
}

const format = (box: Box) => box.map((value) => value.toFixed(1)).join(' ')

export function PictorialSheet() {
  const sheet = useRef<HTMLDivElement>(null)

  // Writes each drawing's verdict into its caption, as the clearance check marks postmarks.
  useEffect(() => {
    let current = true
    for (const group of sheet.current?.querySelectorAll<SVGGElement>('g[data-pictorial]') ?? []) {
      const svg = group.ownerSVGElement
      const stored = (group.dataset.ink ?? '').split(' ').map(Number)
      const note = sheet.current?.querySelector<HTMLElement>(
        `[data-ink-note="${group.dataset.pictorial ?? ''}"]`,
      )
      if (!svg || stored.length !== 4 || !note) continue
      void measure(svg).then((box) => {
        if (!current || !box) return
        const off = box.some((value, index) => Math.abs(value - (stored[index] ?? 0)) > tolerance)
        note.textContent = off
          ? `Measured ink ${format(box)}; update \`ink\``
          : `Ink box matches (${format(box)})`
        note.dataset.off = String(off)
      })
    }
    return () => {
      current = false
    }
  }, [])

  return (
    <div ref={sheet} className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
      {Object.entries(pictorials).map(([key, pictorial]) => {
        return (
          <figure key={key} className="space-y-2">
            <div className="flex items-end gap-4 text-foreground">
              <svg viewBox="0 0 100 100" width={200} height={200} aria-hidden="true">
                <rect
                  data-ink-guide
                  x={pictorial.ink[0]}
                  y={pictorial.ink[1]}
                  width={pictorial.ink[2]}
                  height={pictorial.ink[3]}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                />
                <g {...pictorialStroke} data-pictorial={key} data-ink={pictorial.ink.join(' ')}>
                  {pictorial.draw(`sheet-${key}`)}
                </g>
              </svg>
              <svg viewBox="0 0 100 100" width={64} height={64} aria-hidden="true">
                <g {...pictorialStroke}>{pictorial.draw(`sheet-small-${key}`)}</g>
              </svg>
            </div>
            <figcaption className="space-y-0.5 text-caption">
              <span className="block font-medium">{pictorial.subject}</span>
              <span className="block text-muted-foreground tabular-nums">
                {key} · ink {format(pictorial.ink)}
              </span>
              <span className="block text-muted-foreground">{pictorial.scopes.join(', ')}</span>
              <span
                data-ink-note={key}
                className="block text-muted-foreground tabular-nums data-[off=true]:text-red-600 dark:data-[off=true]:text-red-400"
              />
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
