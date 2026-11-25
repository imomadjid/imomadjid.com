// Lists every stamp Wikimedia Commons holds for a country, one year category at a time, into
// tools/stamps/candidates/<country>.json for the /dev/stamps review page.
//
// Usage: bun tools/stamps/fetch.ts id
//
// Nothing is downloaded here except metadata and 320 px thumbnail URLs; import.ts fetches the
// originals of the stamps you keep.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

import { informationField, stampTitle, themeList } from './candidate.ts'
import type { Candidate } from './candidate.ts'
import { countries, isCountryKey } from './countries.ts'

const api = 'https://commons.wikimedia.org/w/api.php'
const userAgent = 'imomadjid.com stamp tools (https://imomadjid.com)'
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/webp'])

type ApiPage = {
  title: string
  missing?: boolean
  imageinfo?: {
    url: string
    thumburl?: string
    width: number
    height: number
    mime: string
    extmetadata?: Record<string, { value: string } | undefined>
  }[]
  revisions?: { slots: { main: { content: string } } }[]
}

type ApiResponse = {
  continue?: Record<string, string>
  query?: {
    pages?: ApiPage[]
    categorymembers?: { title: string }[]
  }
}

// Commons rate-limits anonymous clients, so requests go one at a time with a pause between them,
// and a 429 waits as long as Retry-After asks.
const pause = 400
const attempts = 8

async function query(params: Record<string, string>) {
  const url = `${api}?${new URLSearchParams({ ...params, format: 'json', formatversion: '2', maxlag: '5' })}`
  for (let attempt = 1; ; attempt += 1) {
    await sleep(pause)
    const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
    if (response.ok) {
      const body: ApiResponse & { error?: { code: string } } = await response.json()
      if (!body.error) return body
      if (body.error.code !== 'maxlag' || attempt === attempts) {
        throw new Error(`Commons: ${body.error.code}`)
      }
    } else if (attempt === attempts) {
      throw new Error(`Commons answered ${response.status} for ${url}`)
    }
    const retryAfter = Number(response.headers.get('Retry-After'))
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 5000 * attempt)
  }
}

async function categoryMembers(category: string, type: 'file' | 'subcat') {
  const titles: string[] = []
  let next: Record<string, string> = {}
  for (;;) {
    const body = await query({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmtype: type,
      cmlimit: '500',
      ...next,
    })
    titles.push(...(body.query?.categorymembers ?? []).map((member) => member.title))
    if (!body.continue) return titles
    next = body.continue
  }
}

// Image info and wikitext for up to 50 files, the API maximum. A batch can come back in parts; merge them.
async function describe(titles: string[]) {
  const pages = new Map<string, ApiPage>()
  let next: Record<string, string> = {}
  for (;;) {
    const body = await query({
      action: 'query',
      titles: titles.join('|'),
      prop: 'imageinfo|revisions',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: '320',
      iiextmetadatafilter: 'LicenseShortName|ImageDescription',
      rvprop: 'content',
      rvslots: 'main',
      ...next,
    })
    for (const page of body.query?.pages ?? []) {
      const seen = pages.get(page.title)
      pages.set(page.title, {
        ...page,
        imageinfo: page.imageinfo ?? seen?.imageinfo,
        revisions: page.revisions ?? seen?.revisions,
      })
    }
    if (!body.continue) return [...pages.values()]
    next = body.continue
  }
}

function plain(html: string | undefined) {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function wikitextSource(wikitext: string) {
  const match = /^\|\s*Source\s*=\s*(.*)$/im.exec(wikitext)
  return (match?.[1] ?? '').replace(/<!--.*?-->/g, '').trim()
}

function toCandidate(page: ApiPage, year: number): Candidate | undefined {
  const info = page.imageinfo?.[0]
  if (page.missing || !info || !imageTypes.has(info.mime)) return undefined
  const file = page.title.replace(/^File:/, '')
  const wikitext = page.revisions?.[0]?.slots.main.content ?? ''
  const source = wikitextSource(wikitext)
  const meta = info.extmetadata ?? {}
  return {
    file,
    year,
    title: stampTitle(file, plain(meta.ImageDescription?.value)),
    issued: informationField(wikitext, 'Issued on'),
    themes: themeList(informationField(wikitext, 'Themes')),
    series: informationField(wikitext, 'Series')?.replaceAll('_', ' '),
    license: plain(meta.LicenseShortName?.value) || 'unknown',
    source,
    colnect: /colnect/i.test(source) || /Colnect \d+/.test(file),
    width: info.width,
    height: info.height,
    thumb: info.thumburl ?? info.url,
    original: info.url,
  }
}

const key = process.argv[2] ?? ''
if (!isCountryKey(key)) {
  console.error(`Usage: bun tools/stamps/fetch.ts <${Object.keys(countries).join('|')}>`)
  process.exit(1)
}
const country = countries[key]
const lastYear = 'lastYear' in country ? country.lastYear : Number.POSITIVE_INFINITY

const years = (await categoryMembers(country.byYear, 'subcat'))
  .map((category) => ({ category, year: Number(/^Category:(\d{4}) /.exec(category)?.[1]) }))
  .filter(({ year }) => year > 0 && year <= lastYear)

const candidates: Candidate[] = []
for (const { category, year } of years) {
  const files = await categoryMembers(category, 'file')
  for (let index = 0; index < files.length; index += 50) {
    const pages = await describe(files.slice(index, index + 50))
    for (const page of pages) {
      const candidate = toCandidate(page, year)
      if (candidate) candidates.push(candidate)
    }
  }
  console.log(`${year}: ${files.length} files`)
}

candidates.sort((a, b) => a.year - b.year || a.file.localeCompare(b.file))
const out = join(dirname(fileURLToPath(import.meta.url)), 'candidates')
await mkdir(out, { recursive: true })
// One stamp per line keeps refetches readable in a diff.
const lines = candidates.map((candidate) => JSON.stringify(candidate))
await writeFile(join(out, `${key}.json`), `[\n${lines.join(',\n')}\n]\n`)
console.log(
  `${candidates.length} candidates for ${country.name} → tools/stamps/candidates/${key}.json`,
)
