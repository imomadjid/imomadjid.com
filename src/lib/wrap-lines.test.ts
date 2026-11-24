import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { wrapLines } from '#/lib/wrap-lines'

void test('items that fit with their gaps stay on one line', () => {
  assert.equal(wrapLines([100, 100, 100], 320, 10), 1)
  assert.equal(wrapLines([], 320, 10), 1)
})

void test('the item that would overflow starts the next line', () => {
  assert.equal(wrapLines([100, 100, 100], 319, 10), 2)
  assert.equal(wrapLines([100, 100, 100, 100], 210, 10), 2)
  assert.equal(wrapLines([100, 100, 100], 150, 10), 3)
})

void test('an item wider than the row takes a line of its own', () => {
  assert.equal(wrapLines([50, 400, 50], 300, 10), 3)
})
