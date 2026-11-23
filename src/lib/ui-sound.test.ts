import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createClockCheck } from './ui-sound'

const running = (currentTime: number) => ({ state: 'running' as const, currentTime })

void test('sounds wait for the audio clock to start', () => {
  const check = createClockCheck(50)
  assert.equal(check({ state: 'suspended', currentTime: 0.5 }, 0), false)
  // Chrome reports running while the clock still reads 0 as the output opens.
  assert.equal(check(running(0), 0), false)
  assert.equal(check(running(0), 400), false)
  assert.equal(check(running(0.01), 410), true)
})

void test('sounds in one output callback all play', () => {
  const check = createClockCheck(50)
  assert.equal(check(running(1), 1000), true)
  assert.equal(check(running(1), 1016), true)
  assert.equal(check(running(1.02), 1033), true)
})

void test('a stalled clock stops sounds from piling up', () => {
  const check = createClockCheck(50)
  assert.equal(check(running(2), 1000), true)
  assert.equal(check(running(2), 1040), true)
  assert.equal(check(running(2), 1050), false)
  assert.equal(check(running(2), 1500), false)
  assert.equal(check(running(2.6), 1600), true)
})
