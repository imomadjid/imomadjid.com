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
  for (const language of ['en', 'id', 'ja']) await book.stamp(visit({ language }))
  const fourth = await book.stamp(visit({ language: 'de' }))
  assert.equal(fourth.visitor, undefined, 'three new stamps an address a day')
  assert.equal(fourth.pile.total, 3)
  clock.now += 86_400_000
  const tomorrow = await book.stamp(visit({ language: 'de' }))
  assert.ok(tomorrow.visitor)
})

void test("an IPv6 connection counts as its /64 toward the day's new stamps", async () => {
  const { book } = ledger()
  for (const host of ['1', '2', '3']) {
    const { visitor } = await book.stamp(visit({ address: `2001:db8:5:7::${host}` }))
    assert.ok(visitor)
  }
  const sameNetwork = await book.stamp(visit({ address: '2001:db8:5:7:abcd:1:2:3' }))
  assert.equal(sameNetwork.visitor, undefined, 'another address in the same /64')
  const otherNetwork = await book.stamp(visit({ address: '2001:db8:5:8::1' }))
  assert.ok(otherNetwork.visitor)
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
  assert.equal(outlines.length, 1, 'Depok has its drawings')
})

void test('an outline that fails to load shows the placeholder and is tried again', async () => {
  let fails = true
  const book = new Ledger(memory(), {
    outline: () => (fails ? Promise.reject(new Error('offline')) : Promise.resolve('M1 1Z')),
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
