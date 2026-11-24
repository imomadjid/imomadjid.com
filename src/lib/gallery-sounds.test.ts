import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { curtainGap, shutterSeconds } from './gallery-sounds'

void test('exposure times read as the camera prints them', () => {
  assert.equal(shutterSeconds('1/250'), 0.004)
  assert.equal(shutterSeconds('0.8'), 0.8)
  assert.equal(shutterSeconds('2'), 2)
  assert.equal(shutterSeconds(''), 0)
  assert.equal(shutterSeconds('1/0'), 0)
})

void test('a curtain gap stays audible and lands before the photo does', () => {
  // Fast shutters all sound as two contacts close together.
  assert.equal(curtainGap(shutterSeconds('1/4000')), 0.012)
  assert.equal(curtainGap(shutterSeconds('1/20')), 0.05)
  assert.equal(curtainGap(shutterSeconds('1/7')), 0.143)
  // A long exposure's second curtain closes with the open, not after it.
  assert.equal(curtainGap(shutterSeconds('2')), 0.55)
})
