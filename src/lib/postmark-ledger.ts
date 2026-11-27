import type { DurableObjectState } from 'cloudflare:workers'

import { dealPostmark, pictorialPool } from '#/dev/postmark-deal'
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
// that say so get no stamp, and an address, its wider network and the whole site can each add only
// so many new stamps a day, counted under a salt that is thrown away with the day.

/** A Durable Object's SQL storage (`ctx.storage.sql`), or Bun's in tests. */
export type Sql = DurableObjectState['storage']['sql']
type Row = ReturnType<ReturnType<Sql['exec']>['toArray']>[number]

/** Where a request came from, as Cloudflare reads it off the address (`request.cf`). */
export type Geo = { city?: string; region?: string; countryCode?: string; timeZone?: string }

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
  // The newest stamps, oldest first. A stamp's place carries no outline: a stamp with a pictorial
  // draws none, and the others' are in `outlines`, once per place (withOutlines puts them back).
  newest: StampRecord[]
  // The map outlines of the places whose newest stamps draw one, by place key.
  outlines: Record<string, string>
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
// New stamps a day: from one address (an IPv6 one's /64), a household, an office or a phone
// carrier's shared address; from one wider IPv6 network (a /48, a site or a provider's customer);
// and from everyone, so no script can bury the pile however many addresses it has.
const dailyStamps = { address: 10, network: 30, site: 500 }
// A place's outline that failed to load (not one Nominatim hasn't got) is tried again this long
// after, doubling, this many times.
const outlineRetry = { after: 60_000, times: 5 }
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
 * connection is usually given a whole /64 and can take any address in it. With `prefixGroups`
 * 3, an IPv6 address's /48, the most a site or a provider's customer is usually given.
 */
export function addressGroup(address: string, prefixGroups = 4) {
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
    .slice(0, prefixGroups)
    .map((group) => group.replace(/^0+(?=.)/, ''))
    .join(':')}::/${prefixGroups * 16}`
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
    // Only a search Nominatim has no boundary for falls back to the next, coarser one; one that
    // fails or takes too long throws, so the place is tried again rather than kept coarse.
    const outline = await nominatimOutline(query, { detail, signal: AbortSignal.timeout(12_000) })
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

// Saved stamps are never dealt again, so a drawing added later reaches no one's stamp by itself.
// A backfill is a deliberate step over the saved records, run once per ledger as it next wakes and
// remembered in `meta` under its name. This one gives the stamps that showed a map outline,
// because their place had no drawing when they came, one of the drawings their place has now.
const pictorialBackfill = 'backfill:outline-pictorials-2026-11'

const stampColumns = `v.idx, v.ordinal, v.day, v.month, v.year, v.deal, v.print,
  p.key, p.name, p.region, p.country, p.country_code, p.outline`

// Columns are as the schema declares them; a missing row reads as empty.
const text = (value: Row[string] | undefined) => String(value ?? '')
const number = (value: Row[string] | undefined) => Number(value ?? 0)

/** A row's place's outline, or the placeholder until one is drawn. */
const outlineOf = (row: Row) => text(row.outline) || placeholderOutline

/** A stamp from its row, its place's outline included unless `outline` is false. */
function toRecord(row: Row, outline = true): StampRecord {
  return {
    index: number(row.idx),
    place: {
      key: text(row.key),
      name: text(row.name),
      region: text(row.region),
      country: text(row.country),
      countryCode: text(row.country_code),
      outline: outline ? outlineOf(row) : '',
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
  readonly #retry: (after: number) => void
  readonly #salt: string
  // Failed loads of the queued place's outline, while this copy of the ledger runs.
  #outlineFailures = 0
  // When each visitor's tab last checked in, while it's open.
  readonly #present = new Map<string, number>()

  constructor(
    sql: Sql,
    {
      now = Date.now,
      outline = placeOutline,
      queued = () => {},
      retry = () => {},
    }: {
      now?: () => number
      outline?: (place: PostmarkPlace) => Promise<string | undefined>
      // Called when a place joins the outline queue, to have drawOutlines run soon.
      queued?: () => void
      // Called when an outline failed to load, to have drawOutlines run again `after` ms on.
      retry?: (after: number) => void
    } = {},
  ) {
    this.#sql = sql
    this.#now = now
    this.#outline = outline
    this.#queued = queued
    this.#retry = retry
    for (const statement of schema) sql.exec(statement)
    const saved = sql.exec("SELECT value FROM meta WHERE key = 'salt'").toArray()[0]
    if (saved) this.#salt = text(saved.value)
    else {
      this.#salt = hex(crypto.getRandomValues(new Uint8Array(16)))
      sql.exec("INSERT INTO meta (key, value) VALUES ('salt', ?)", this.#salt)
    }
    if (
      sql.exec('SELECT value FROM meta WHERE key = ?', pictorialBackfill).toArray().length === 0
    ) {
      this.#pictorialsForOutlines()
      sql.exec('INSERT INTO meta (key, value) VALUES (?, ?)', pictorialBackfill, String(now()))
    }
  }

  /**
   * Gives each stamp drawn with its place's map outline a pictorial where its place now has any:
   * the one a visitor with its number would be dealt today. Its frame, style and ink stay.
   */
  #pictorialsForOutlines() {
    const rows = this.#sql
      .exec(`SELECT v.id, ${stampColumns} FROM visitors v JOIN places p ON p.key = v.place`)
      .toArray()
    for (const row of rows) {
      const stamp = toRecord(row)
      if (stamp.deal.pictorial !== undefined) continue
      const { pictorial } = dealPostmark(stamp.place, stamp.ordinal, 0)
      if (pictorial === undefined) continue
      this.#sql.exec(
        'UPDATE visitors SET deal = ? WHERE id = ?',
        JSON.stringify({ ...stamp.deal, pictorial }),
        text(row.id),
      )
    }
  }

  async #hash(...parts: string[]) {
    return this.#hashWith(this.#salt, ...parts)
  }

  async #hashWith(salt: string, ...parts: string[]) {
    const data = new TextEncoder().encode([salt, ...parts].join('\u0000'))
    return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
  }

  /**
   * Today's salt for the daily counts, made the first time it's asked for each day and replaced
   * the next, so a past day's counts can't be traced back to the addresses that made them.
   */
  #daySalt(today: number) {
    const row = this.#sql.exec("SELECT value FROM meta WHERE key = 'day_salt'").toArray()[0]
    const [savedDay, savedSalt] = text(row?.value).split(':')
    if (savedSalt && Number(savedDay) === today) return savedSalt
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
    this.#sql.exec(
      `INSERT INTO meta (key, value) VALUES ('day_salt', ?)
        ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      `${today}:${salt}`,
    )
    return salt
  }

  /** Forgets fingerprints past their month and daily counts past their day. */
  #prune(now: number) {
    this.#sql.exec('DELETE FROM fingerprints WHERE seen < ?', now - fingerprintDays * day)
    this.#sql.exec('DELETE FROM stamped WHERE day < ?', Math.floor(now / day))
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
    const rows = this.#sql
      .exec(
        `SELECT ${stampColumns} FROM visitors v JOIN places p ON p.key = v.place
          ORDER BY v.idx DESC LIMIT ?`,
        newestShown,
      )
      .toArray()
      .reverse()
    const newest = rows.map((row) => toRecord(row, false))
    const outlines: Record<string, string> = {}
    rows.forEach((row, at) => {
      if (newest[at]?.deal.pictorial === undefined) outlines[text(row.key)] = outlineOf(row)
    })
    // Stamps are numbered from 0 and never removed, so the next number is how many there are.
    const total = this.#scalar('SELECT COALESCE(MAX(idx) + 1, 0) AS n FROM visitors')
    return { you: you ? toRecord(you) : null, newest, outlines, total }
  }

  /** The pile as the visitor sees it, without stamping them: for showing it before they act. */
  async look(visit: Visit) {
    const fingerprint = await this.#fingerprint(visit)
    this.#prune(this.#now())
    const visitor = this.#identify(visit, fingerprint)
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
    const daySalt = this.#daySalt(today)
    // All before the lookup: from it to the inserts nothing may wait.
    const [fingerprint, ...counted] = await Promise.all([
      this.#fingerprint(visit),
      this.#hashWith(daySalt, 'address', addressGroup(visit.address)),
      this.#hashWith(daySalt, 'network', addressGroup(visit.address, 3)),
      this.#hashWith(daySalt, 'site'),
    ])
    // An IPv4 address is its own network, so it counts once, against the address's limit.
    const counts = counted.map((hash, at) => ({
      hash,
      limit: [dailyStamps.address, dailyStamps.network, dailyStamps.site][at] ?? 0,
    }))
    if (!visit.address.includes(':')) counts.splice(1, 1)
    this.#prune(now)
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
    const full = counts.some(
      ({ hash, limit }) =>
        this.#scalar('SELECT stamps AS n FROM stamped WHERE hash = ?', hash) >= limit,
    )
    if (!place || full) return { visitor: undefined, pile: this.#pile(undefined) }

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
    const { deal, print } = stampFor({
      place,
      ordinal,
      date: postmarkDate(now, visit.geo.timeZone),
    })
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
    for (const { hash } of counts)
      this.#sql.exec(
        `INSERT INTO stamped (hash, day, stamps) VALUES (?, ?, 1)
          ON CONFLICT (hash) DO UPDATE SET stamps = stamps + 1`,
        hash,
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
   * them have their answer: their stamps show the placeholder until then. A place Nominatim has
   * no boundary for leaves the queue, and the next visitor from there queues it again; one whose
   * outline failed to load stays queued, and the queue waits a while before it's tried again.
   */
  async drawOutlines(): Promise<void> {
    const queued = this.#sql.exec('SELECT key FROM outline_queue LIMIT 1').toArray()[0]
    if (!queued) return
    const key = text(queued.key)
    const row = this.#sql
      .exec('SELECT name, region, country, country_code, outline FROM places WHERE key = ?', key)
      .toArray()[0]
    let outline: string | undefined
    if (row && !text(row.outline))
      try {
        outline = await this.#outline({
          key,
          name: text(row.name),
          region: text(row.region),
          country: text(row.country),
          countryCode: text(row.country_code),
          outline: '',
        })
      } catch {
        this.#outlineFailures += 1
        if (this.#outlineFailures < outlineRetry.times) {
          this.#retry(outlineRetry.after * 2 ** (this.#outlineFailures - 1))
          return
        }
      }
    this.#outlineFailures = 0
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
