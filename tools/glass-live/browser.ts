// The headless Chrome the web-side tools (shoot.ts, motion.ts, lag.ts) drive, on /dev/live-glass
// from the running dev server (bun run dev).
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { chromium } from 'playwright-core'
import type { Page } from 'playwright-core'

import file from './Scenes/scenes.json'

const base = process.env.URL ?? 'http://localhost:3000'

/** Chrome with WebGPU and a 3x page, the scene's size unless `viewport` says otherwise. */
export async function openBrowser(viewport = { width: file.width, height: file.height }) {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--enable-unsafe-webgpu', '--hide-scrollbars'],
  })
  const page = await browser.newPage({ viewport, deviceScaleFactor: 3 })
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error')
      console.log('  page:', message.text())
  })
  return { browser, page }
}

/**
 * Opens `/dev/live-glass?scene=<scene>&icon=0` plus `query`; true once the live canvas has
 * drawn (it fades in after its first frame), false if it falls back to static glass.
 */
export async function openScene(page: Page, scene: string, query = '') {
  await page.goto(`${base}/dev/live-glass?scene=${scene}&icon=0${query}`, { waitUntil: 'load' })
  return page
    .waitForSelector('canvas.opacity-100', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false)
}

/** Waits for every photo to decode, so none pops in mid-run. */
export async function decodeImages(page: Page) {
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())))
}
