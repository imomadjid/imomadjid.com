import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'

import { placeholderOutline } from '#/dev/postmark-visitor-places'

import { Ledger, addressGroup, isBot, placeFor } from './postmark-ledger'
import type { Sql, Visit } from './postmark-ledger'

// The ledger over Node's SQLite (Bun runs it), as a Durable Object's storage runs it.
function memory(): Sql {
  const db = new DatabaseSync(':memory:')
  return {
    exec: (query, ...bindings) => {
      // SAFETY: rows come back as plain column-to-value objects.
      const rows = db.prepare(query).all(...bindings) as Record<string, string | number | null>[]
      return { toArray: () => rows }
    },
  }
}

const browser =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

const visit = (overrides: Partial<Visit> = {}): Visit => ({
  address: '203.0.113.7',
  userAgent: browser,
  language: 'en-US,en;q=0.9',
  geo: { city: 'Wellington', region: 'Wellington Region', countryCode: 'NZ' },
  ...overrides,
})

function ledger(start = Date.UTC(2026, 10, 26, 9)) {
  const clock = { now: start }
  const outlines: string[] = []
  const queue = { calls: 0 }
  const book = new Ledger(memory(), {
    now: () => clock.now,
    outline: (place) => {
      outlines.push(place.key)
      return Promise.resolve('M0 0L100 0L100 100Z')
    },
    queued: () => {
      queue.calls += 1
    },
  })
  return { book, clock, outlines, queue }
}

void test('a new visitor is stamped from their city, and numbered in order', async () => {
  const { book } = ledger()
  const first = await book.stamp(visit())
  assert.ok(first.visitor)
  assert.equal(first.pile.you?.index, 0)
  assert.equal(first.pile.you?.place.name, 'Wellington')
  assert.equal(first.pile.you?.place.country, 'New Zealand')
  assert.deepEqual(first.pile.you?.date, { day: 26, month: 10, year: 2026 })
  const second = await book.stamp(visit({ address: '198.51.100.9' }))
  assert.equal(second.pile.you?.index, 1)
  assert.equal(second.pile.you?.ordinal, 1, "the city's second visitor")
  assert.equal(second.pile.total, 2)
  assert.deepEqual(
    second.pile.newest.map((record) => record.index),
    [0, 1],
    'oldest first',
  )
})

void test('a visitor keeps their stamp by their cookie, and comes back as a visit', async () => {
  const { book, clock } = ledger()
  const { visitor } = await book.stamp(visit())
  clock.now += 60 * 60_000
  const again = await book.stamp(
    visit({ visitor, address: '192.0.2.44', userAgent: `${browser} x` }),
  )
  assert.equal(again.visitor, visitor)
  assert.equal(again.pile.total, 1)
  assert.equal(book.stats().visits, 2)
  assert.equal(book.stats().returning, 1)
})

void test('without a cookie, their fingerprint finds them for a month', async () => {
  const { book, clock } = ledger()
  const { visitor } = await book.stamp(visit())
  clock.now += 20 * 86_400_000
  const privateWindow = await book.stamp(visit())
  assert.equal(privateWindow.visitor, visitor)
  clock.now += 31 * 86_400_000
  const later = await book.stamp(visit())
  assert.notEqual(later.visitor, visitor, 'a fingerprint is forgotten after a month')
  assert.equal(later.pile.total, 2)
})

void test('looking finds the visitor without stamping anyone', async () => {
  const { book } = ledger()
  const nobody = await book.look(visit())
  assert.equal(nobody.visitor, undefined)
  assert.equal(nobody.pile.total, 0)
  const { visitor } = await book.stamp(visit())
  const seen = await book.look(visit())
  assert.equal(seen.visitor, visitor)
  assert.equal(seen.pile.you?.index, 0)
})

void test('bots, unknown countries and busy addresses get no stamp', async () => {
  const { book, clock } = ledger()
  const bot = await book.stamp(visit({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }))
  assert.equal(bot.visitor, undefined)
  const nowhere = await book.stamp(visit({ geo: { countryCode: 'XX' } }))
  assert.equal(nowhere.visitor, undefined)
  const languages = ['en', 'id', 'ja', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'ko']
  for (const language of languages) assert.ok((await book.stamp(visit({ language }))).visitor)
  const eleventh = await book.stamp(visit({ language: 'sv' }))
  assert.equal(eleventh.visitor, undefined, 'ten new stamps an address a day')
  assert.equal(eleventh.pile.total, 10)
  clock.now += 86_400_000
  const tomorrow = await book.stamp(visit({ language: 'sv' }))
  assert.ok(tomorrow.visitor)
})

void test("an IPv6 connection counts as its /64, and its /48, toward the day's new stamps", async () => {
  const { book } = ledger()
  for (let host = 1; host <= 10; host += 1) {
    const { visitor } = await book.stamp(visit({ address: `2001:db8:5:7::${host}` }))
    assert.ok(visitor)
  }
  const sameNetwork = await book.stamp(visit({ address: '2001:db8:5:7:abcd:1:2:3' }))
  assert.equal(sameNetwork.visitor, undefined, 'another address in the same /64')
  // 20 more from other /64s in the same /48 make 30, its limit.
  for (let subnet = 8; subnet < 28; subnet += 1) {
    const { visitor } = await book.stamp(visit({ address: `2001:db8:5:${subnet}::1` }))
    assert.ok(visitor, `2001:db8:5:${subnet}::1`)
  }
  const sameSite = await book.stamp(visit({ address: '2001:db8:5:99::1' }))
  assert.equal(sameSite.visitor, undefined, 'another /64 in the same /48')
  const elsewhere = await book.stamp(visit({ address: '2001:db8:6:1::1' }))
  assert.ok(elsewhere.visitor)
})

void test('the whole site adds at most 500 new stamps a day', async () => {
  const { book, clock } = ledger()
  for (let n = 0; n < 500; n += 1)
    await book.stamp(visit({ address: `10.${n >> 16}.${(n >> 8) & 255}.${n & 255}` }))
  const over = await book.stamp(visit({ address: '192.0.2.200' }))
  assert.equal(over.visitor, undefined)
  assert.equal(over.pile.total, 500)
  clock.now += 86_400_000
  assert.ok((await book.stamp(visit({ address: '192.0.2.200' }))).visitor)
})

void test("a stamp is dated in the visitor's own time zone", async () => {
  // 23:30 UTC on 26 November is already the 27th in Jakarta.
  const { book } = ledger(Date.UTC(2026, 10, 26, 23, 30))
  const jakarta = await book.stamp(
    visit({
      geo: { city: 'Depok', region: 'West Java', countryCode: 'ID', timeZone: 'Asia/Jakarta' },
    }),
  )
  assert.deepEqual(jakarta.pile.you?.date, { day: 27, month: 10, year: 2026 })
  const unknown = await book.stamp(
    visit({ address: '198.51.100.9', geo: { ...visit().geo, timeZone: 'Nowhere/Else' } }),
  )
  assert.deepEqual(unknown.pile.you?.date, { day: 26, month: 10, year: 2026 }, 'else UTC')
})

void test('addressGroup keeps IPv4 whole and cuts IPv6 to its /64', () => {
  assert.equal(addressGroup('203.0.113.7'), '203.0.113.7')
  assert.equal(addressGroup('2001:0db8:0005:0007:abcd:1:2:3'), '2001:db8:5:7::/64')
  assert.equal(addressGroup('2001:db8:5:7::1'), '2001:db8:5:7::/64')
  assert.equal(addressGroup('2001:db8::1'), '2001:db8:0:0::/64')
  assert.equal(addressGroup('::1'), '0:0:0:0::/64')
  assert.equal(addressGroup('::ffff:192.0.2.1'), '192.0.2.1')
})

void test("a place nobody has drawn gets its map outline once, after the answer; a drawn one doesn't", async () => {
  const { book, outlines, queue } = ledger()
  const first = await book.stamp(visit())
  assert.equal(first.pile.you?.place.outline, placeholderOutline, 'answered before the outline')
  assert.deepEqual(outlines, [])
  await book.stamp(visit({ address: '198.51.100.9' }))
  await book.drawOutlines()
  assert.deepEqual(outlines, ['nz-wellington-region-wellington'], 'fetched once')
  const { pile } = await book.look(visit({ visitor: first.visitor }))
  assert.equal(pile.you?.place.outline, 'M0 0L100 0L100 100Z', 'every stamp from there')
  assert.ok(
    pile.newest.every((record) => record.place.outline === ''),
    "the newest carry no outlines; they're sent once a place",
  )
  assert.deepEqual(pile.outlines, { 'nz-wellington-region-wellington': 'M0 0L100 0L100 100Z' })
  const calls = queue.calls
  await book.stamp(visit({ address: '198.51.100.11' }))
  assert.equal(queue.calls, calls, 'a drawn place queues nothing')
  await book.stamp(
    visit({
      address: '198.51.100.10',
      geo: { city: 'Depok', region: 'West Java', countryCode: 'ID' },
    }),
  )
  await book.drawOutlines()
  assert.equal(outlines.length, 1, "Depok, a prototype place, carries its region's outline")
})

void test("every place in a region shares the region's outline, fetched once", async () => {
  const { book, outlines } = ledger()
  await book.stamp(visit())
  await book.drawOutlines()
  const lowerHutt = visit({
    address: '198.51.100.9',
    geo: { city: 'Lower Hutt', region: 'Wellington Region', countryCode: 'NZ' },
  })
  const { visitor } = await book.stamp(lowerHutt)
  await book.drawOutlines()
  assert.deepEqual(outlines, ['nz-wellington-region-wellington'])
  const { pile } = await book.look({ ...lowerHutt, visitor })
  assert.equal(pile.you?.place.outline, 'M0 0L100 0L100 100Z')
})

void test("places drawn with their own boundary are redrawn with their region's, once", async () => {
  const sql = memory()
  const fetched: string[] = []
  let queued = 0
  const open = () =>
    new Ledger(sql, {
      outline: (place) => {
        fetched.push(place.key)
        return Promise.resolve('M5 5Z')
      },
      queued: () => {
        queued += 1
      },
    })
  const book = open()
  const { visitor } = await book.stamp(visit())
  await book.drawOutlines()
  // As a place was drawn before this backfill: with its own boundary.
  sql.exec("UPDATE places SET outline = 'M9 9Z'")
  sql.exec("DELETE FROM meta WHERE key = 'backfill:region-outlines-2026-11'")
  const before = queued
  const again = open()
  assert.equal(queued, before + 1, 'the alarm is set to draw them')
  await again.drawOutlines()
  assert.deepEqual(fetched, ['nz-wellington-region-wellington', 'nz-wellington-region-wellington'])
  const { pile } = await again.look(visit({ visitor }))
  assert.equal(pile.you?.place.outline, 'M5 5Z')
  open()
  assert.equal(queued, before + 1, 'it runs once')
})

void test('a place Nominatim has no boundary for shows the placeholder, and the next visitor tries again', async () => {
  let fails = true
  const book = new Ledger(memory(), {
    outline: () => Promise.resolve(fails ? undefined : 'M1 1Z'),
  })
  const first = await book.stamp(visit())
  await book.drawOutlines()
  const { pile } = await book.look(visit({ visitor: first.visitor }))
  assert.equal(pile.you?.place.outline, placeholderOutline)
  fails = false
  const second = await book.stamp(visit({ address: '198.51.100.9' }))
  await book.drawOutlines()
  const again = await book.look(visit({ visitor: second.visitor }))
  assert.equal(again.pile.you?.place.outline, 'M1 1Z')
})

void test('the pile sends at most the newest 200', async () => {
  const { book, clock } = ledger()
  for (let n = 0; n < 205; n += 1) {
    clock.now += 86_400_000
    await book.stamp(visit({ address: `10.0.${n >> 8}.${n & 255}` }))
  }
  const { pile } = await book.look(visit({ address: '10.9.9.9' }))
  assert.equal(pile.total, 205)
  assert.equal(pile.newest.length, 200)
  assert.equal(pile.newest[0]?.index, 5)
})

void test('online counts tabs that checked in in the last minute and a half', async () => {
  const { book, clock } = ledger()
  const { visitor } = await book.stamp(visit())
  book.here(visitor)
  book.here('not-a-visitor')
  assert.equal(book.stats().online, 1)
  clock.now += 120_000
  assert.equal(book.stats().online, 0)
})

void test("a known place is the prototype's own, and others are keyed by country and region", () => {
  assert.equal(placeFor({ city: 'Depok', region: 'West Java', countryCode: 'ID' })?.key, 'depok')
  assert.equal(
    placeFor({ city: 'Zürich', region: 'Zurich', countryCode: 'CH' })?.key,
    'ch-zurich-zurich',
  )
  assert.equal(placeFor({ region: 'Bali', countryCode: 'ID' })?.name, 'Bali')
  assert.equal(placeFor({ countryCode: 'T1' }), undefined)
})

void test('isBot knows crawlers from browsers', () => {
  assert.equal(isBot(browser), false)
  assert.equal(isBot('Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/131.0.0.0'), true)
  assert.equal(isBot('facebookexternalhit/1.1'), true)
  assert.equal(isBot('curl/8.5.0'), true)
  for (const crawler of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Slackbot 1.0 (+https://api.slack.com/robots)',
    'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'Pinterest/0.2 (+http://www.pinterest.com/)',
    'WhatsApp/2.23.20.0 A',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0)',
  ])
    assert.equal(isBot(crawler), true, crawler)
  for (const person of [
    'Mozilla/5.0 (Linux; Android 11; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Telegram-Android/10.6.2',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9150 Chrome/124.0.0.0 Electron/30.0.0 Safari/537.36',
  ])
    assert.equal(isBot(person), false, person)
})

void test('the pile sends an outline only for places whose stamps draw one', async () => {
  const { book } = ledger()
  const depok = { city: 'Depok', region: 'West Java', countryCode: 'ID' }
  for (const address of ['198.51.100.1', '198.51.100.2', '198.51.100.3', '198.51.100.4'])
    await book.stamp(visit({ address, geo: depok }))
  const { pile } = await book.look(visit({ address: '198.51.100.9' }))
  const drawn = pile.newest.filter((record) => record.deal.pictorial !== undefined)
  assert.ok(drawn.length > 0 && drawn.length < pile.newest.length, 'Depok deals both')
  assert.deepEqual(Object.keys(pile.outlines), ['depok'])
  const { book: other } = ledger()
  await other.stamp(visit({ address: '198.51.100.1', geo: depok }))
  const one = (await other.look(visit({ address: '198.51.100.9' }))).pile
  assert.deepEqual(
    Object.keys(one.outlines),
    one.newest[0]?.deal.pictorial === undefined ? ['depok'] : [],
  )
})

void test('an outline that fails to load is tried again later, not settled coarser', async () => {
  let failures = 2
  const retries: number[] = []
  const book = new Ledger(memory(), {
    outline: () => {
      if (failures > 0) {
        failures -= 1
        return Promise.reject(new Error('Nominatim answered 503'))
      }
      return Promise.resolve('M2 2Z')
    },
    retry: (after) => retries.push(after),
  })
  const { visitor } = await book.stamp(visit())
  await book.drawOutlines()
  await book.drawOutlines()
  assert.deepEqual(retries, [60_000, 120_000], 'waits longer each time')
  await book.drawOutlines()
  const { pile } = await book.look(visit({ visitor }))
  assert.equal(pile.you?.place.outline, 'M2 2Z')
})

void test('stamps that came before their place was drawn get a pictorial once, keeping their frame', async () => {
  const sql = memory()
  const book = new Ledger(sql)
  const jakarta = visit({ geo: { city: 'Jakarta', region: 'Jakarta', countryCode: 'ID' } })
  const drawn = (await book.stamp(jakarta)).pile.you
  await book.stamp(visit({ address: '198.51.100.9' }))
  assert.ok(drawn?.deal.pictorial)
  // As the stamp was saved before Jakarta had a drawing, and before this backfill ran.
  const { pictorial: _, ...bare } = drawn.deal
  sql.exec('UPDATE visitors SET deal = ? WHERE idx = 0', JSON.stringify(bare))
  sql.exec("DELETE FROM meta WHERE key LIKE 'backfill:%'")

  const upgraded = (await new Ledger(sql).look({ ...jakarta, address: '192.0.2.1' })).pile.newest
  assert.deepEqual(
    upgraded[0]?.deal,
    drawn.deal,
    'the pictorial it would be dealt, the rest as it was',
  )
  assert.equal(upgraded[1]?.deal.pictorial, undefined, 'Wellington still has no drawing')

  // It runs once: a stamp without a pictorial after it stays as it is.
  sql.exec('UPDATE visitors SET deal = ? WHERE idx = 0', JSON.stringify(bare))
  const later = (await new Ledger(sql).look({ ...jakarta, address: '192.0.2.1' })).pile.newest
  assert.equal(later[0]?.deal.pictorial, undefined)
})

void test("the browser test's stamps come off the pile once, and only where they are those", async () => {
  const sql = memory()
  const book = new Ledger(sql, { now: () => Date.UTC(2026, 10, 26, 9) })
  const columbus = { city: 'Columbus', region: 'Ohio', countryCode: 'US' }
  for (let at = 0; at < 49; at += 1) await book.stamp(visit({ address: `198.51.${at}.1` }))
  for (let at = 0; at < 3; at += 1)
    await book.stamp(
      visit({ address: `203.0.${at}.9`, userAgent: `${browser} ${at}`, geo: columbus }),
    )
  await book.stamp(visit({ address: '192.0.2.200' }))
  sql.exec("DELETE FROM meta WHERE key LIKE 'cleanup:%'")

  const after = new Ledger(sql, { now: () => Date.UTC(2026, 10, 27, 9) })
  const { pile } = await after.look(
    visit({ address: '203.0.0.9', userAgent: `${browser} 0`, geo: columbus }),
  )
  assert.equal(pile.you, null, 'their fingerprint finds no stamp')
  assert.deepEqual(
    pile.newest.filter((record) => record.place.key === 'us-ohio-columbus'),
    [],
  )
  assert.equal(pile.newest.at(-1)?.index, 52, 'the stamp after them keeps its number')
  assert.equal(sql.exec("SELECT 1 FROM places WHERE key = 'us-ohio-columbus'").toArray().length, 0)

  // On a ledger where those numbers are other visitors', nothing goes.
  const other = memory()
  const dev = new Ledger(other, { now: () => Date.UTC(2026, 10, 26, 9) })
  for (let at = 0; at < 52; at += 1) await dev.stamp(visit({ address: `198.51.${at}.1` }))
  other.exec("DELETE FROM meta WHERE key LIKE 'cleanup:%'")
  const kept = await new Ledger(other).look(visit({ address: '192.0.2.1' }))
  assert.equal(kept.pile.newest.length, 52)
})
