import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'

import { placeholderOutline } from '#/dev/postmark-visitor-places'

import { Ledger, isBot, placeFor } from './postmark-ledger'
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
  const book = new Ledger(memory(), {
    now: () => clock.now,
    outline: (place) => {
      outlines.push(place.key)
      return Promise.resolve('M0 0L100 0L100 100Z')
    },
  })
  return { book, clock, outlines }
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
  for (const language of ['en', 'id', 'ja']) await book.stamp(visit({ language }))
  const fourth = await book.stamp(visit({ language: 'de' }))
  assert.equal(fourth.visitor, undefined, 'three new stamps an address a day')
  assert.equal(fourth.pile.total, 3)
  clock.now += 86_400_000
  const tomorrow = await book.stamp(visit({ language: 'de' }))
  assert.ok(tomorrow.visitor)
})

void test("a place nobody has drawn gets its map outline once; a drawn one doesn't", async () => {
  const { book, outlines } = ledger()
  const first = await book.stamp(visit())
  assert.equal(first.pile.you?.place.outline, 'M0 0L100 0L100 100Z')
  await book.stamp(visit({ address: '198.51.100.9' }))
  assert.deepEqual(outlines, ['nz-wellington-region-wellington'], 'fetched once')
  await book.stamp(
    visit({
      address: '198.51.100.10',
      geo: { city: 'Depok', region: 'West Java', countryCode: 'ID' },
    }),
  )
  assert.equal(outlines.length, 1, 'Depok has its drawings')
})

void test('an outline that fails to load shows the placeholder and is tried again', async () => {
  let fails = true
  const book = new Ledger(memory(), {
    outline: () => (fails ? Promise.reject(new Error('offline')) : Promise.resolve('M1 1Z')),
  })
  const first = await book.stamp(visit())
  assert.equal(first.pile.you?.place.outline, placeholderOutline)
  fails = false
  const second = await book.stamp(visit({ address: '198.51.100.9' }))
  assert.equal(second.pile.you?.place.outline, 'M1 1Z')
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
})
