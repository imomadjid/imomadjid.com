// Renders a motion scene on the web at each scroll offset motion.py found in the simulator's
// recording, from the running dev server (bun run dev), for motion.py diff.
// Usage: bun tools/glass-live/motion.ts <out-dir> <scene>
//   reads <out-dir>/ios/<scene>.json, writes <out-dir>/web/<scene>/NNNN.png
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { mkdirSync, readFileSync } from 'node:fs'

import { chromium } from 'playwright-core'

import file from './Scenes/scenes.json'

const [out, name] = process.argv.slice(2)
if (!out || !name) throw new Error('Usage: motion.ts <out-dir> <scene>')
const frames: { frame: string; scroll: number }[] = JSON.parse(
  readFileSync(`${out}/ios/${name}.json`, 'utf8'),
)
const base = process.env.URL ?? 'http://localhost:3000'

mkdirSync(`${out}/web/${name}`, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-webgpu', '--hide-scrollbars'],
})
const page = await browser.newPage({
  viewport: { width: file.width, height: file.height },
  deviceScaleFactor: 3,
})
page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error')
    console.log('  page:', message.text())
})
await page.goto(`${base}/dev/live-glass?scene=${name}&icon=0`, { waitUntil: 'load' })
await page.waitForSelector('canvas.opacity-100', { timeout: 10_000 })
// Every photo decoded, so none pops in mid-run.
await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())))
for (const { frame, scroll } of frames) {
  await page.evaluate(async (top) => {
    const scroller = document.querySelector<HTMLElement>('[data-background]')
    if (scroller) scroller.scrollTop = top
    // The scroll event wakes the glass, which draws on the next frame.
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame)
  }, scroll)
  await page.screenshot({
    path: `${out}/web/${name}/${frame}`,
    clip: { x: 0, y: 0, width: file.width, height: file.height },
  })
}
console.log(`${frames.length} frames in ${out}/web/${name}`)
await browser.close()
