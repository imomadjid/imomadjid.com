import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

import { settleTheme, THEME_SCRIPT } from './theme'
import type { ThemeRecord } from './theme'

// Local times, so the 06:00 and 18:00 catch-up hours read the same in any test time zone.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).getTime()
const stored = (record: Partial<ThemeRecord>) =>
  JSON.stringify({ theme: 'system', base: 'light', at: 0, seen: 'light', auto: false, ...record })

void test('an override holds until the system catches up with it', () => {
  const dark = stored({ theme: 'dark', base: 'light', at: at(21, 10) })
  assert.equal(settleTheme(dark, 'light', at(21, 11)).theme, 'dark')
  const caughtUp = settleTheme(dark, 'dark', at(21, 19))
  assert.equal(caughtUp.theme, 'system')
  // Once cleared, the next morning follows the system back to light.
  assert.equal(settleTheme(JSON.stringify(caughtUp), 'light', at(22, 8)).theme, 'system')
})

void test('a missed sunset clears the override only when the system is known to switch', () => {
  const fixed = stored({ theme: 'dark', base: 'light', at: at(21, 10), seen: 'light' })
  assert.equal(settleTheme(fixed, 'light', at(22, 9)).theme, 'dark')
  const automatic = stored({ theme: 'dark', base: 'light', at: at(21, 10), auto: true })
  assert.equal(settleTheme(automatic, 'light', at(21, 17, 59)).theme, 'dark')
  assert.equal(settleTheme(automatic, 'light', at(22, 9)).theme, 'system')
  const evening = stored({ theme: 'light', base: 'dark', at: at(21, 20), auto: true })
  assert.equal(settleTheme(evening, 'dark', at(22, 5)).theme, 'light')
  assert.equal(settleTheme(evening, 'dark', at(22, 21)).theme, 'system')
})

void test('seeing the system scheme change marks it as switching on its own', () => {
  const record = settleTheme(stored({ seen: 'light' }), 'dark', at(21, 19))
  assert.equal(record.auto, true)
  assert.equal(record.seen, 'dark')
})

void test('a choice that matches the system stays pinned', () => {
  const pinned = stored({ theme: 'light', base: 'light', at: at(21, 10), auto: true })
  assert.equal(settleTheme(pinned, 'dark', at(21, 20)).theme, 'light')
  assert.equal(settleTheme(pinned, 'light', at(23, 10)).theme, 'light')
})

void test('reads earlier bare values and ignores malformed records', () => {
  assert.equal(settleTheme('dark', 'light', at(21, 10)).theme, 'dark')
  assert.equal(settleTheme('dark', 'dark', at(21, 10)).theme, 'dark')
  assert.equal(settleTheme('system', 'dark', at(21, 10)).theme, 'system')
  assert.equal(settleTheme('{nope', 'dark', at(21, 10)).theme, 'system')
  assert.equal(settleTheme(null, 'light', at(21, 10)).theme, 'system')
})

void test('the inline script applies the settled theme and stores the record', () => {
  const storage = new Map([['imomadjid:theme', stored({ theme: 'dark', base: 'light', at: 1 })]])
  const classes = new Set<string>()
  const root = { classList: { add: (name: string) => classes.add(name) }, dataset: {}, style: {} }
  runInNewContext(THEME_SCRIPT, {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    matchMedia: () => ({ matches: true }),
    document: { documentElement: root },
    Date,
    JSON,
  })
  assert.deepEqual([...classes], ['dark'])
  assert.deepEqual(root.dataset, { theme: 'system' })
  assert.match(storage.get('imomadjid:theme') ?? '', /"theme":"system"/)
})
