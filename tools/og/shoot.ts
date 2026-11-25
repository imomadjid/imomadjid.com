// Captures /dev/og from the running dev server (bun run dev) as the 1200 x 630 social card.
// Usage: bun tools/og/shoot.ts [out]   (default public/og.jpg)
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { chromium } from 'playwright-core'

const out = process.argv[2] ?? 'public/og.jpg'
const base = process.env.URL ?? 'http://localhost:3000'

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-webgpu', '--hide-scrollbars'],
})
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
})
await page.goto(`${base}/dev/og`, { waitUntil: 'load' })
await page.waitForSelector('canvas[data-renderer="webgpu"]', { timeout: 15_000 })
// Let the dawn entrance settle, so the card shows the resting light.
await page.waitForFunction(
  () =>
    document.querySelector<HTMLCanvasElement>('canvas[data-entrance]')?.dataset.entrance ===
    '0.000',
  undefined,
  { timeout: 15_000 },
)
// The beam follows the pointer: aim it just above the logo, and let it settle. The leaves keep
// moving, so each capture differs; rerun for another frame.
await page.mouse.move(600, 284)
await page.waitForTimeout(2800)
// Leave out the devtools and anything else beside the card.
await page.screenshot({
  path: out,
  style: 'body > :not(:has([data-og])) { display: none !important }',
})
await browser.close()
console.log(out)
