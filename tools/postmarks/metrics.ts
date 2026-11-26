// Measures Allo's glyphs for the postmark lettering in Chromium, from the running dev server
// (bun run dev), and writes src/dev/postmark-metrics.json: each character's advance at weights
// 400 to 900, with tabular figures and capital punctuation at the lettering's pinned optical
// size, and how far its ink rises above and drops below the baseline. The layouts fit lettering from the advances; the clearance check boxes each glyph
// with its own heights, so an accent or a descender can't hide behind the cap height.
// Usage: bun tools/postmarks/metrics.ts   Env: URL (default http://localhost:3000), CHROME.
import { writeFile } from 'node:fs/promises'

import { chromium } from 'playwright-core'

const base = process.env.URL ?? 'http://localhost:3000'
const out = 'src/dev/postmark-metrics.json'

const graphemes = (text: string) =>
  Array.from(new Intl.Segmenter().segment(text), ({ segment }) => segment)

// Capitals, figures and punctuation, and the accented capitals of place names.
const chars = [
  ...graphemes("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,·-–'’&/()"),
  ...graphemes('ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŒŠŽŸĀĂĄĆČĎĐĒĖĘĚĞĢĪĮİĶĹĻĽŁŃŅŇŌŐŔŘŚŞŢŤŪŮŰŲŹŻȘȚ'),
  // Vietnamese, whose capitals stack two marks.
  ...graphemes('ƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ'),
]
const weights = [400, 500, 600, 700, 800, 900]
// Allo's Small master. Optical size follows the font size in the SVG's own units, not on screen,
// so the lettering pins it: a 16-unit name on a wall tile shows about 9 px tall.
const opticalSize = 9

const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
)
const page = await browser.newPage()
await page.goto(`${base}/dev/postmarks`, { waitUntil: 'load' })
const measured = await page.evaluate(
  async ({ chars, weights, opticalSize }) => {
    await document.fonts.ready
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    document.body.append(svg)
    // An advance from ten in a row between two H's, so a space isn't collapsed away.
    const advance = (text: string, weight: number) => {
      const element = document.createElementNS(ns, 'text')
      element.setAttribute('font-size', '100')
      element.setAttribute('font-weight', String(weight))
      element.setAttribute('font-family', 'Allo')
      element.style.fontVariantNumeric = 'tabular-nums'
      element.style.fontFeatureSettings = "'case'"
      element.style.fontVariationSettings = `'opsz' ${opticalSize}`
      element.style.whiteSpace = 'pre'
      element.textContent = text
      svg.append(element)
      const length = element.getComputedTextLength()
      element.remove()
      return length
    }
    const advances: Record<string, number[]> = {}
    for (const char of chars) {
      advances[char] = weights.map(
        (weight) =>
          Math.round((advance(`H${char.repeat(10)}H`, weight) - advance('HH', weight)) / 10 / 0.1) /
          1000,
      )
    }
    const context = document.createElement('canvas').getContext('2d')
    const heights: Record<string, [number, number]> = {}
    if (context) {
      // Canvas can't set an optical size; heights barely move with it.
      context.font = '900 100px Allo'
      for (const char of chars) {
        const metrics = context.measureText(char)
        heights[char] = [
          Math.round(metrics.actualBoundingBoxAscent * 10) / 1000,
          Math.round(Math.max(0, metrics.actualBoundingBoxDescent) * 10) / 1000,
        ]
      }
    }
    svg.remove()
    return { advances, heights }
  },
  { chars, weights, opticalSize },
)
await browser.close()

await writeFile(out, `${JSON.stringify({ opticalSize, weights, ...measured })}\n`)
console.log(`Wrote ${out}: ${chars.length} characters at ${weights.join(', ')}`)
