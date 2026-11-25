// Records the web's live glass over a motion scene while it really scrolls, as composited frames
// (a CDP screencast), for motion.py lag. Usage: bun tools/glass-live/lag.ts <out-dir> <scene> <how>
//   how: raf (the page scrolls itself each frame, as SwiftUI's TimelineView does) or wheel
//   (wheel input, scrolled on the compositor in steps), or touch (a smooth compositor scroll, as a
//   finger's or a trackpad's)
//   writes <out-dir>/lag/<scene>-<how>/NNNN.png
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { mkdirSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

import { decodeImages, openBrowser, openScene } from './browser'
import file from './Scenes/scenes.json'

const [out, name, how = 'raf'] = process.argv.slice(2)
if (!out || !name || !['raf', 'wheel', 'touch'].includes(how))
  throw new Error('Usage: lag.ts <out-dir> <scene> <raf|wheel|touch>')
const dir = `${out}/lag/${name}-${how}`
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })

// The screencast frames the window at 1x, at least 500 px wide and short of the viewport's
// height, so the scene (fixed at the top left) moves up LIFT pt to keep the glass in frame;
// motion.py crops and shifts it back.
const LIFT = 60
const { browser, page } = await openBrowser({ width: 520, height: file.height + 40 })
const run = how === 'raf' ? '&run=1' : ''
if (!(await openScene(page, name, run))) throw new Error('Live glass never drew')
await decodeImages(page)
await page.evaluate((lift) => {
  const scene = document.querySelector<HTMLElement>('[data-background]')?.parentElement
  if (scene) scene.style.top = `${-lift}px`
}, LIFT)

const cdp = await page.context().newCDPSession(page)
let count = 0
const writes: Promise<void>[] = []
cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
  count += 1
  // Acknowledged first: Chrome sends no next frame until it is.
  writes.push(cdp.send('Page.screencastFrameAck', { sessionId }).then(() => {}))
  writes.push(
    writeFile(`${dir}/${String(count).padStart(4, '0')}.png`, Buffer.from(data, 'base64')),
  )
})
await cdp.send('Page.startScreencast', {
  format: 'png',
  maxWidth: 520 * 3,
  maxHeight: (file.height + 40) * 3,
  everyNthFrame: 1,
})
if (how === 'touch') {
  await cdp.send('Input.synthesizeScrollGesture', {
    x: file.width / 2,
    y: file.height / 3,
    yDistance: -1400,
    speed: 400,
    gestureSourceType: 'touch',
    preventFling: true,
  })
  await page.waitForTimeout(500)
} else if (how === 'wheel') {
  // About 400 pt/s, as the other runs: 20 pt a wheel event every 50 ms.
  await page.mouse.move(file.width / 2, file.height / 3)
  for (let i = 0; i < 70; i++) {
    await page.mouse.wheel(0, 20)
    await page.waitForTimeout(50)
  }
} else {
  await page.waitForTimeout(6000)
}
await cdp.send('Page.stopScreencast')
await Promise.all(writes)
console.log(`${count} frames in ${dir}`)
await browser.close()
