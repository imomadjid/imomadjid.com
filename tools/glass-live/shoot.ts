// 3x captures of /dev/live-glass?scene=<name>&icon=0 from the running dev server (bun run dev),
// to diff against the simulator's (capture.sh) with diff.py.
// Usage: bun tools/glass-live/shoot.ts <out-dir> [scene ...]   writes <out-dir>/web/<scene>-bare.png
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { mkdirSync } from 'node:fs'

import { chromium } from 'playwright-core'

import file from './Scenes/scenes.json'

const [out, ...only] = process.argv.slice(2)
if (!out) throw new Error('Usage: shoot.ts <out-dir> [scene ...]')
const names = only.length ? only : file.scenes.map((scene) => scene.name)
const base = process.env.URL ?? 'http://localhost:3000'

mkdirSync(`${out}/web`, { recursive: true })
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
for (const name of names) {
  await page.goto(`${base}/dev/live-glass?scene=${name}&icon=0`, { waitUntil: 'load' })
  // The live canvas fades in once its first frame is drawn; give the frame time to land.
  const live = await page
    .waitForSelector('canvas.opacity-100', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(400)
  const path = `${out}/web/${name}-bare.png`
  await page.screenshot({ path, clip: { x: 0, y: 0, width: file.width, height: file.height } })
  console.log(live ? path : `${path} (static fallback: live glass never drew)`)
}
await browser.close()
