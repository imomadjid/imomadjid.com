// One Commons file that could become a Guestbook stamp, as fetch.ts records it and the
// /dev/stamps review page reads it.
export type Candidate = {
  // Commons file name, without the "File:" prefix.
  file: string
  year: number
  title: string
  // Colnect's catalogue fields, when the scan came from there.
  issued?: string
  themes: string[]
  series?: string
  license: string
  source: string
  colnect: boolean
  width: number
  height: number
  thumb: string
  original: string
}

const colnectName = /^Stamps? of .+? - \d{4} - Colnect \d+ - (.+)\.\w+$/

/** A readable title: Colnect's catalogue name when the file has one, else the file name. */
export function stampTitle(file: string, description: string) {
  const colnect = colnectName.exec(file)
  if (colnect?.[1]) return colnect[1].trim()
  const text = description.trim()
  if (text && text.length <= 120 && !/^stamp\.?$/i.test(text)) return text
  return file.replace(/\.\w+$/, '').replaceAll('_', ' ')
}

/** The value of a `{{information field|name=...|value=...}}` row in a file page's wikitext. */
export function informationField(wikitext: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(
    `\\{\\{information field\\|name=${escaped}\\|value=([^\\n]*?)\\}\\}\\s*$`,
    'im',
  ).exec(wikitext)
  return match?.[1]?.trim() || undefined
}

/** Colnect's theme list ("Animals_(Fauna) {{dot}} Bees"), as plain names. */
export function themeList(value: string | undefined) {
  if (!value) return []
  return value
    .split(/\s*\{\{dot\}\}\s*/)
    .map((theme) => theme.replaceAll('_', ' ').trim())
    .filter(Boolean)
}

/** A file-system name for a stamp's images: lower case, hyphenated, at most 80 characters. */
export function stampSlug(file: string) {
  return file
    .replace(/\.\w+$/, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '')
}
