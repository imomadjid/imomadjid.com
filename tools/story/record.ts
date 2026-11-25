// Records /dev/story from the running dev server (bun run dev) as a 1080 x 1920, 60 fps H.264
// video: the Sunlit wall by day, then the sun setting into night. The page's clock is stepped a
// frame at a time, so the video plays at full rate however long each frame takes to capture.
// Usage: bun tools/story/record.ts <out.mp4>
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome), QUERY (/dev/story's
// overrides, such as ?sunset=8), DAY, NIGHT (seconds before and after the sunset starts,
// default 4 and 12), FPS (default 60). Needs ffmpeg.
import { spawn } from 'node:child_process'
import { once } from 'node:events'

import { chromium } from 'playwright-core'

declare global {
  interface Window {
    /** Advances the page's animation clock by `ms` and runs the frames waiting on it. */
    stepFrame?: (ms: number) => void
  }
}

const out = process.argv[2]
if (!out) throw new Error('Usage: record.ts <out.mp4>')
const base = process.env.URL ?? 'http://localhost:3000'
const fps = Number(process.env.FPS ?? 60)
const day = Number(process.env.DAY ?? 4)
const night = Number(process.env.NIGHT ?? 12)

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-webgpu', '--hide-scrollbars'],
})
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
})
await page.goto(`${base}/dev/story${process.env.QUERY ?? ''}`, { waitUntil: 'load' })
await page.waitForSelector('canvas[data-renderer="webgpu"]', { timeout: 15_000 })
await page.waitForFunction(
  () =>
    document.querySelector<HTMLCanvasElement>('canvas[data-entrance]')?.dataset.entrance ===
    '0.000',
  undefined,
  { timeout: 15_000 },
)

// Take over the page's animation frames: each step advances the clock one video frame and runs
// what was waiting. It starts ahead of the real clock, so no delta runs backwards.
await page.evaluate(() => {
  let now = performance.now() + 1000
  let next = 0
  const waiting = new Map<number, FrameRequestCallback>()
  window.requestAnimationFrame = (callback) => {
    next += 1
    waiting.set(next, callback)
    return next
  }
  window.cancelAnimationFrame = (id) => {
    waiting.delete(id)
  }
  window.stepFrame = (ms) => {
    now += ms
    const callbacks = [...waiting.values()]
    waiting.clear()
    for (const callback of callbacks) callback(now)
  }
})

const ffmpeg = spawn(
  'ffmpeg',
  [
    '-loglevel',
    'error',
    '-y',
    '-f',
    'image2pipe',
    '-framerate',
    String(fps),
    '-i',
    '-',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '14',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-movflags',
    '+faststart',
    out,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
)

const frames = Math.round((day + night) * fps)
for (let index = 0; index < frames; index += 1) {
  if (index === Math.round(day * fps))
    await page.evaluate(() => {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    })
  await page.evaluate((ms) => window.stepFrame?.(ms), 1000 / fps)
  // Leave out the devtools and anything else beside the scene.
  ffmpeg.stdin.write(
    await page.screenshot({
      style: 'body > :not(:has([data-story])) { display: none !important }',
    }),
  )
  if (index % fps === 0) console.log(`${index / fps}s`)
}
ffmpeg.stdin.end()
const [code] = await once(ffmpeg, 'exit')
if (code !== 0) throw new Error(`ffmpeg exited with ${code}`)
await browser.close()
console.log(out)
