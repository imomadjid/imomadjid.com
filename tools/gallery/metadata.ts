// Records each original's exposure and Fujifilm settings in src/assets/gallery/photos.json,
// keyed by the lowercase filename stem. import.sh runs it after writing the WebP files.
//
// Usage: bun tools/gallery/metadata.ts <original>...
// Needs exiftool and jq. Keeps the width and height import.sh already recorded.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fujiExifTags, parseExposure, parseFujiSettings } from '../../src/lib/fuji-settings.ts'
import type { Exposure, FujiExif, FujiSettings } from '../../src/lib/fuji-settings.ts'

const manifestPath = fileURLToPath(new URL('../../src/assets/gallery/photos.json', import.meta.url))

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: bun tools/gallery/metadata.ts <original>...')
  process.exit(1)
}

type ManifestEntry = {
  width: number
  height: number
  exposure?: Exposure
  settings?: FujiSettings
}

// SAFETY: exiftool -j prints an array of flat tag objects; the parsers check each tag they read.
const exifs = JSON.parse(
  execFileSync('exiftool', ['-j', '-q', ...fujiExifTags, ...files], { encoding: 'utf8' }),
) as FujiExif[]
// SAFETY: import.sh writes photos.json, and every entry has at least a width and height.
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ManifestEntry>

for (const exif of exifs) {
  const file = String(exif.SourceFile)
  const stem = basename(file, extname(file)).toLowerCase()
  const entry = manifest[stem]
  if (entry === undefined) throw new Error(`${stem} has no size in photos.json; import it first`)
  entry.exposure = parseExposure(exif)
  entry.settings = parseFujiSettings(exif)
}

writeFileSync(manifestPath, JSON.stringify(manifest))
// Sorted like import.sh's own jq writes, so re-imports keep diffs small.
writeFileSync(manifestPath, execFileSync('jq', ['-S', '.', manifestPath], { encoding: 'utf8' }))
