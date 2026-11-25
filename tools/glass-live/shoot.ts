// 3x captures of /dev/live-glass?scene=<name>&icon=0 from the running dev server (bun run dev),
// to diff against the simulator's (capture.sh) with diff.py.
// Usage: bun tools/glass-live/shoot.ts <out-dir> [scene ...]   writes <out-dir>/web/<scene>-bare.png
// A motion scene takes an offset as capture.sh's do: <scene>@<pt>.
// Env: URL (default http://localhost:3000), CHROME (default Google Chrome).
import { mkdirSync } from 'node:fs'

import { openBrowser, openScene } from './browser'
import file from './Scenes/scenes.json'

const [out, ...only] = process.argv.slice(2)
if (!out) throw new Error('Usage: shoot.ts <out-dir> [scene ...]')
const names = only.length
  ? only
  : file.scenes.filter((scene) => !('motion' in scene)).map((scene) => scene.name)

mkdirSync(`${out}/web`, { recursive: true })
const { browser, page } = await openBrowser()
for (const name of names) {
  const [scene, scroll = '0'] = name.split('@')
  // The live canvas fades in once its first frame is drawn; give the frame time to land.
  const live = await openScene(page, scene, `&scroll=${scroll}`)
  await page.waitForTimeout(400)
  const path = `${out}/web/${name}-bare.png`
  await page.screenshot({ path, clip: { x: 0, y: 0, width: file.width, height: file.height } })
  console.log(live ? path : `${path} (static fallback: live glass never drew)`)
}
await browser.close()
