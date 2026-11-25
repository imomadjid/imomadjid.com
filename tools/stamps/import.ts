// Turns a country's keep list into Guestbook assets: each kept Commons stamp becomes
// src/assets/stamps/<country>/<slug>-160.webp and -320.webp (never upscaled, metadata stripped),
// and stamps.json records its size, title and source. Stamps no longer kept are removed.
//
// Usage: bun tools/stamps/import.ts id
//
// Reads tools/stamps/keep/<country>.txt (Commons file names, one per line, # for comments) and
// tools/stamps/candidates/<country>.json from fetch.ts. Needs ImageMagick (magick or convert).
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

import { stampSlug } from './candidate.ts'
import type { Candidate } from './candidate.ts'
import { countries, isCountryKey } from './countries.ts'

const userAgent = 'imomadjid.com stamp tools (https://imomadjid.com)'
const widths = [160, 320] as const
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const key = process.argv[2] ?? ''
if (!isCountryKey(key)) {
  console.error(`Usage: bun tools/stamps/import.ts <${Object.keys(countries).join('|')}>`)
  process.exit(1)
}

const magick = ['magick', 'convert'].find(
  (command) => spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0,
)
if (!magick) {
  console.error('ImageMagick not found: install it so `magick` or `convert` runs.')
  process.exit(1)
}

const keepPath = join(here, 'keep', `${key}.txt`)
const candidatesPath = join(here, 'candidates', `${key}.json`)
if (!existsSync(keepPath) || !existsSync(candidatesPath)) {
  console.error(`Needs ${keepPath} and ${candidatesPath}.`)
  process.exit(1)
}

const keep = (await readFile(keepPath, 'utf8'))
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
const candidates: Candidate[] = JSON.parse(await readFile(candidatesPath, 'utf8'))
const byFile = new Map(candidates.map((candidate) => [candidate.file, candidate]))

const unknown = keep.filter((file) => !byFile.has(file))
if (unknown.length > 0) {
  console.error(`Not in the candidates, refetch or fix the list:\n${unknown.join('\n')}`)
  process.exit(1)
}

type ManifestEntry = {
  file: string
  title: string
  year: number
  themes: string[]
  width: number
  height: number
  license: string
  source: string
}

const out = join(root, 'src', 'assets', 'stamps', key)
await mkdir(out, { recursive: true })
const work = await mkdtemp(join(tmpdir(), 'stamps-'))
const manifest: Record<string, ManifestEntry> = {}

try {
  for (const file of keep) {
    const stamp = byFile.get(file)
    if (!stamp) continue
    const slug = stampSlug(file)
    const done = widths.every((width) => existsSync(join(out, `${slug}-${width}.webp`)))
    if (!done) {
      const response = await fetch(stamp.original, { headers: { 'User-Agent': userAgent } })
      if (!response.ok) throw new Error(`Commons answered ${response.status} for ${file}`)
      const original = join(work, slug)
      await writeFile(original, Buffer.from(await response.arrayBuffer()))
      for (const width of widths) {
        const result = spawnSync(magick, [
          `${original}[0]`,
          '-auto-orient',
          '-colorspace',
          'sRGB',
          '-resize',
          `${width}x${width}>`,
          '-strip',
          '-quality',
          '82',
          '-define',
          'webp:method=6',
          join(out, `${slug}-${width}.webp`),
        ])
        if (result.status !== 0)
          throw new Error(`ImageMagick failed on ${file}: ${String(result.stderr)}`)
      }
      await sleep(300)
    }
    const size = spawnSync(magick === 'magick' ? 'magick' : 'identify', [
      ...(magick === 'magick' ? ['identify'] : []),
      '-format',
      '%w %h',
      join(out, `${slug}-320.webp`),
    ])
    const [width, height] = String(size.stdout).trim().split(' ').map(Number)
    manifest[slug] = {
      file,
      title: stamp.title,
      year: stamp.year,
      themes: stamp.themes,
      width: width ?? 0,
      height: height ?? 0,
      license: stamp.license,
      source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`,
    }
    console.log(`${slug} ${width}x${height}`)
  }
} finally {
  await rm(work, { recursive: true, force: true })
}

// Drop images for stamps that left the keep list.
const slugs = new Set(Object.keys(manifest))
for (const name of await readdir(out)) {
  const slug = /^(.+)-\d+\.webp$/.exec(name)?.[1]
  if (slug && !slugs.has(slug)) await rm(join(out, name))
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(join(out, 'stamps.json'), `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`${slugs.size} stamps for ${countries[key].name} → src/assets/stamps/${key}/`)
