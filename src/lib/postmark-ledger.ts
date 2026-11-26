import type { DurableObjectState } from 'cloudflare:workers'

import { pictorialPool } from '#/dev/postmark-deal'
import type { PostmarkPlace } from '#/dev/postmark-kit'
import { placeholderOutline, visitorPlaces } from '#/dev/postmark-visitor-places'
import { pileSettings, postmarkDate, stampFor } from '#/dev/postmark-visits'
import type { StampRecord } from '#/dev/postmark-visits'

import { nominatimOutline } from './osm-outline'

// The postmark footer's ledger: one stamp per visitor, saved the day they first came and never
// dealt again. It runs in a Durable Object (postmark-ledger-object.ts) over its SQLite storage,
// and in tests over Bun's.
//
// A visitor is their cookie. Without one (a private window, cleared cookies), a hash of their
// address, browser and language seen in the last month finds them again, so one person keeps one
// stamp; the hash is salted with a secret only the ledger holds, and no address is stored. Bots
// that say so get no stamp, and one address can add only a few new stamps a day.

/** A Durable Object's SQL storage (`ctx.storage.sql`), or Bun's in tests. */
export type Sql = DurableObjectState['storage']['sql']
type Row = ReturnType<ReturnType<Sql['exec']>['toArray']>[number]

/** Where a request came from, as Cloudflare reads it off the address (`request.cf`). */
export type Geo = { city?: string; region?: string; countryCode?: string }

export type Visit = {
  // The visitor's cookie, if they sent one.
  visitor?: string
  address: string
  userAgent: string
  language: string
  geo: Geo
}

export type Pile = {
  // The visitor's own stamp, if they have one.
  you: StampRecord | null
  // The newest stamps, oldest first.
  newest: StampRecord[]
  // Every stamp so far.
  total: number
}

export type LedgerStats = {
  visitors: number
  visits: number
  returning: number
  places: number
  countries: number
  newToday: number
  online: number
}

// The pile draws at most this many stamps.
const newestShown = pileSettings.depth
// How long a fingerprint finds its visitor again without their cookie.
const fingerprintDays = 30
// New stamps one address may add in a day: a household or an office, not a script.
const stampsPerAddress = 3
// A visit within this long of the last is the same visit.
const visitGap = 30 * 60_000
// Someone is online if their tab checked in this recently (it does every minute while shown).
const onlineWindow = 90_000

const day = 86_400_000

/**
 * Crawlers, link previews, uptime checks and scripts that name themselves. A `bot` counts only as
 * a crawler names itself (Googlebot/2.1, Slackbot 1.0, TelegramBot (like…)), so a phone such as a
 * CUBOT X30 doesn't; and apps count by their crawlers, not their in-app browsers, which are people.
 */
export function isBot(userAgent: string) {
  return (
    userAgent.length < 20 ||
    /bot(?:[/\-;),]|\s+[\d(+]|$)|crawl|spider|slurp|headless|preview|scrape|curl|wget|python|httpclient|okhttp|axios|node-fetch|java\/|go-http|monitor|lighthouse|pingdom|uptime|facebookexternalhit|embedly|vkshare|^whatsapp\/|^pinterest\//i.test(
      userAgent,
    )
  )
}

/**
 * The part of an address one household holds: an IPv4 address whole, an IPv6 one's /64, since a
 * connection is usually given a whole /64 and can take any address in it.
 */
export function addressGroup(address: string) {
  if (!address.includes(':')) return address
  const [head = '', tail] = address.toLowerCase().split('::')
  const front = head ? head.split(':') : []
  const back = tail ? tail.split(':') : []
  // An IPv4 address written as IPv6 (::ffff:192.0.2.1) is that IPv4 address.
  const last = back.at(-1) ?? front.at(-1) ?? ''
  if (last.includes('.')) return last
  const groups = [
    ...front,
    ...Array<string>(Math.max(0, 8 - front.length - back.length)).fill('0'),
    ...back,
  ]
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`
}

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
// Places the prototype knows by name, with their keys, which their drawings are scoped to.
const knownPlaces = visitorPlaces.map(({ place }) => place)

const slug = (parts: string[]) =>
  parts
    .join(' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * The place a visitor's stamp names: their city, or their region or country where Cloudflare
 * can't tell the city. None for an address with no country (Tor, or an unknown one).
 */
export function placeFor({ city, region, countryCode }: Geo): PostmarkPlace | undefined {
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode) || countryCode === 'XX') return undefined
  let country = countryCode
  try {
    country = regionNames.of(countryCode) ?? countryCode
  } catch {
    // An unassigned code keeps its letters.
  }
  const name = city || region || country
  const known = knownPlaces.find(
    (place) => place.countryCode === countryCode && place.name.toLowerCase() === name.toLowerCase(),
  )
  if (known) return known
  return {
    key: slug([countryCode, region ?? '', name]),
    name,
    region: region ?? '',
    country,
    countryCode,
    outline: '',
  }
}

/**
 * The outline for a place nobody has drawn: its own boundary, else its region's, else its
 * country's, each a little coarser. Nominatim knows many towns only as points.
 */
async function placeOutline(place: PostmarkPlace) {
  const searches: [Record<string, string>, number][] = []
  if (place.name !== place.region && place.name !== place.country)
    searches.push([
      { city: place.name, state: place.region, countrycodes: place.countryCode },
      0.0007,
    ])
  if (place.region) searches.push([{ state: place.region, countrycodes: place.countryCode }, 0.004])
  searches.push([{ country: place.countryCode }, 0.02])
  for (const [query, detail] of searches) {
    // A search that fails or takes too long falls back to the next, coarser one.
    const outline = await nominatimOutline(query, {
      detail,
      signal: AbortSignal.timeout(12_000),
    }).catch(() => undefined)
    if (outline) return outline
  }
  return undefined
}

const schema = [
  `CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY, idx INTEGER NOT NULL UNIQUE, place TEXT NOT NULL,
    ordinal INTEGER NOT NULL, day INTEGER NOT NULL, month INTEGER NOT NULL, year INTEGER NOT NULL,
    deal TEXT NOT NULL, print TEXT NOT NULL,
    first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL, visits INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS places (
    key TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, country TEXT NOT NULL,
    country_code TEXT NOT NULL, outline TEXT NOT NULL, visitors INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS fingerprints (
    hash TEXT PRIMARY KEY, visitor TEXT NOT NULL, seen INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS fingerprints_seen ON fingerprints (seen)',
  `CREATE TABLE IF NOT EXISTS stamped (
    hash TEXT PRIMARY KEY, day INTEGER NOT NULL, stamps INTEGER NOT NULL)`,
  'CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  // Places waiting for their map outline (drawOutlines).
  'CREATE TABLE IF NOT EXISTS outline_queue (key TEXT PRIMARY KEY)',
]

const stampColumns = `v.idx, v.ordinal, v.day, v.month, v.year, v.deal, v.print,
  p.key, p.name, p.region, p.country, p.country_code, p.outline`

// Columns are as the schema declares them; a missing row reads as empty.
const text = (value: Row[string] | undefined) => String(value ?? '')
const number = (value: Row[string] | undefined) => Number(value ?? 0)

function toRecord(row: Row): StampRecord {
  return {
    index: number(row.idx),
    place: {
      key: text(row.key),
      name: text(row.name),
      region: text(row.region),
      country: text(row.country),
      countryCode: text(row.country_code),
      outline: text(row.outline) || placeholderOutline,
    },
    ordinal: number(row.ordinal),
    date: { day: number(row.day), month: number(row.month), year: number(row.year) },
    // SAFETY: the ledger wrote these from dealPostmark and visitorPrint, and only it writes them.
    deal: JSON.parse(text(row.deal)) as StampRecord['deal'],
    // SAFETY: as the deal, from visitorPrint and the day.
    print: JSON.parse(text(row.print)) as StampRecord['print'],
  }
}

export class Ledger {
  readonly #sql: Sql
  readonly #now: () => number
  readonly #outline: (place: PostmarkPlace) => Promise<string | undefined>
  readonly #queued: () => void
  readonly #salt: string
  // When each visitor's tab last checked in, while it's open.
  readonly #present = new Map<string, number>()

  constructor(
    sql: Sql,
    {
      now = Date.now,
      outline = placeOutline,
      queued = () => {},
    }: {
      now?: () => number
      outline?: (place: PostmarkPlace) => Promise<string | undefined>
      // Called when a place joins the outline queue, to have drawOutlines run soon.
      queued?: () => void
    } = {},
  ) {
    this.#sql = sql
    this.#now = now
    this.#outline = outline
    this.#queued = queued
    for (const statement of schema) sql.exec(statement)
    const saved = sql.exec("SELECT value FROM meta WHERE key = 'salt'").toArray()[0]
    if (saved) this.#salt = text(saved.value)
    else {
      this.#salt = hex(crypto.getRandomValues(new Uint8Array(16)))
      sql.exec("INSERT INTO meta (key, value) VALUES ('salt', ?)", this.#salt)
    }
  }

  async #hash(...parts: string[]) {
    const data = new TextEncoder().encode([this.#salt, ...parts].join('\u0000'))
    return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
  }

  /** The number a query answers in its `n` column. */
  #scalar(query: string, ...bindings: (string | number)[]) {
    return number(this.#sql.exec(query, ...bindings).toArray()[0]?.n)
  }

  #fingerprint(visit: Visit) {
    return this.#hash('fingerprint', visit.address, visit.userAgent, visit.language)
  }

  #known(id: string | undefined) {
    if (!id) return false
    return this.#sql.exec('SELECT 1 FROM visitors WHERE id = ?', id).toArray().length > 0
  }

  /** The visitor's id: their cookie's, or the one their fingerprint found in the last month. */
  #identify(visit: Visit, fingerprint: string) {
    if (this.#known(visit.visitor)) return visit.visitor
    const since = this.#now() - fingerprintDays * day
    const row = this.#sql
      .exec('SELECT visitor FROM fingerprints WHERE hash = ? AND seen >= ?', fingerprint, since)
      .toArray()[0]
    return row ? text(row.visitor) : undefined
  }

  #pile(visitor: string | undefined): Pile {
    const you = visitor
      ? this.#sql
          .exec(
            `SELECT ${stampColumns} FROM visitors v JOIN places p ON p.key = v.place WHERE v.id = ?`,
            visitor,
          )
          .toArray()[0]
      : undefined
    const newest = this.#sql
      .exec(
        `SELECT ${stampColumns} FROM visitors v JOIN places p ON p.key = v.place
          ORDER BY v.idx DESC LIMIT ?`,
        newestShown,
      )
      .toArray()
      .reverse()
    const total = this.#scalar('SELECT COUNT(*) AS n FROM visitors')
    return { you: you ? toRecord(you) : null, newest: newest.map(toRecord), total }
  }

  /** The pile as the visitor sees it, without stamping them: for showing it before they act. */
  async look(visit: Visit) {
    const visitor = this.#identify(visit, await this.#fingerprint(visit))
    return { visitor, pile: this.#pile(visitor) }
  }

  /**
   * The visitor's stamp, found or made, and the pile with it: they've shown they're a person
   * (the page ran and they've used it), so a new visitor gets their stamp now. A bot, an
   * address with no country, or one that has stamped enough today gets the pile without one.
   */
  async stamp(visit: Visit) {
    const now = this.#now()
    const today = Math.floor(now / day)
    // Both before the lookup: from it to the inserts nothing may wait.
    const [fingerprint, address] = await Promise.all([
      this.#fingerprint(visit),
      this.#hash('address', addressGroup(visit.address), String(today)),
    ])
    const found = this.#identify(visit, fingerprint)
    if (found) {
      this.#sql.exec(
        `UPDATE visitors SET visits = visits + (CASE WHEN last_seen < ? THEN 1 ELSE 0 END),
          last_seen = ? WHERE id = ?`,
        now - visitGap,
        now,
        found,
      )
      this.#remember(fingerprint, found, now)
      return { visitor: found, pile: this.#pile(found) }
    }
    const place = isBot(visit.userAgent) ? undefined : placeFor(visit.geo)
    if (
      !place ||
      this.#scalar('SELECT stamps AS n FROM stamped WHERE hash = ?', address) >= stampsPerAddress
    )
      return { visitor: undefined, pile: this.#pile(undefined) }

    // Nothing waits until the inserts, so two visitors can't take the same number.
    const id = crypto.randomUUID()
    const saved = this.#sql
      .exec('SELECT visitors, outline FROM places WHERE key = ?', place.key)
      .toArray()[0]
    const ordinal = number(saved?.visitors)
    if (saved) this.#sql.exec('UPDATE places SET visitors = visitors + 1 WHERE key = ?', place.key)
    else
      this.#sql.exec(
        `INSERT INTO places (key, name, region, country, country_code, outline, visitors)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
        place.key,
        place.name,
        place.region,
        place.country,
        place.countryCode,
        place.outline,
      )
    // Stamps are numbered from 0 and never removed.
    const index = this.#scalar('SELECT COALESCE(MAX(idx) + 1, 0) AS n FROM visitors')
    const { deal, print } = stampFor({ place, ordinal, date: postmarkDate(now) })
    this.#sql.exec(
      `INSERT INTO visitors (id, idx, place, ordinal, day, month, year, deal, print,
        first_seen, last_seen, visits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      id,
      index,
      place.key,
      ordinal,
      print.day,
      print.month,
      print.year,
      JSON.stringify(deal),
      JSON.stringify(print),
      now,
      now,
    )
    this.#sql.exec('DELETE FROM stamped WHERE day < ?', today)
    this.#sql.exec(
      `INSERT INTO stamped (hash, day, stamps) VALUES (?, ?, 1)
        ON CONFLICT (hash) DO UPDATE SET stamps = stamps + 1`,
      address,
      today,
    )
    this.#remember(fingerprint, id, now)
    // Drawn places, and places with pictorials, need no outline.
    if (!text(saved?.outline) && !place.outline && pictorialPool(place).length === 0) {
      this.#sql.exec('INSERT OR IGNORE INTO outline_queue (key) VALUES (?)', place.key)
      this.#queued()
    }
    return { visitor: id, pile: this.#pile(id) }
  }

  #remember(fingerprint: string, visitor: string, now: number) {
    this.#sql.exec('DELETE FROM fingerprints WHERE seen < ?', now - fingerprintDays * day)
    this.#sql.exec(
      `INSERT INTO fingerprints (hash, visitor, seen) VALUES (?, ?, ?)
        ON CONFLICT (hash) DO UPDATE SET visitor = excluded.visitor, seen = excluded.seen`,
      fingerprint,
      visitor,
      now,
    )
  }

  /**
   * Draws the queued places' map outlines, one place at a time, after the visitors who brought
   * them have their answer: their stamps show the placeholder until then. A place whose outline
   * isn't found leaves the queue, and the next visitor from there queues it again.
   */
  async drawOutlines(): Promise<void> {
    const queued = this.#sql.exec('SELECT key FROM outline_queue LIMIT 1').toArray()[0]
    if (!queued) return
    const key = text(queued.key)
    const row = this.#sql
      .exec('SELECT name, region, country, country_code, outline FROM places WHERE key = ?', key)
      .toArray()[0]
    const outline =
      row && !text(row.outline)
        ? await this.#outline({
            key,
            name: text(row.name),
            region: text(row.region),
            country: text(row.country),
            countryCode: text(row.country_code),
            outline: '',
          }).catch(() => undefined)
        : undefined
    if (outline) this.#sql.exec('UPDATE places SET outline = ? WHERE key = ?', outline, key)
    this.#sql.exec('DELETE FROM outline_queue WHERE key = ?', key)
    // One place at a time, as Nominatim asks, until the queue is empty.
    return this.drawOutlines()
  }

  /** A visitor's open tab checking in, for the count of who's online. */
  here(visitor: string | undefined) {
    const now = this.#now()
    for (const [present, seen] of this.#present)
      if (seen < now - onlineWindow) this.#present.delete(present)
    // Visitors are never removed, so one already here needs no lookup.
    if (!visitor || (!this.#present.has(visitor) && !this.#known(visitor))) return
    this.#present.set(visitor, now)
  }

  stats(): LedgerStats {
    const now = this.#now()
    const visitors = this.#sql
      .exec(
        `SELECT COUNT(*) AS visitors, COALESCE(SUM(visits), 0) AS visits,
          COALESCE(SUM(visits > 1), 0) AS returned, COALESCE(SUM(first_seen >= ?), 0) AS new_today
          FROM visitors`,
        now - (now % day),
      )
      .toArray()[0]
    const places = this.#sql
      .exec('SELECT COUNT(*) AS places, COUNT(DISTINCT country_code) AS countries FROM places')
      .toArray()[0]
    let online = 0
    for (const seen of this.#present.values()) if (seen >= now - onlineWindow) online += 1
    return {
      visitors: number(visitors?.visitors),
      visits: number(visitors?.visits),
      returning: number(visitors?.returned),
      places: number(places?.places),
      countries: number(places?.countries),
      newToday: number(visitors?.new_today),
      online,
    }
  }
}
