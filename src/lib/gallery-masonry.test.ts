import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { masonryColumns, tileCells } from './gallery-masonry'

void test('masonryColumns lays the lead rows out as a grid', () => {
  assert.deepEqual(masonryColumns([1, 2, 1, 1, 1, 1], 3, 6), [
    [0, 3],
    [1, 4],
    [2, 5],
  ])
})

void test('masonryColumns adds the rest to the shortest column', () => {
  // After the lead row the columns stand 1, 2 and 0.5 tall.
  assert.deepEqual(masonryColumns([1, 2, 0.5, 1, 1, 1], 3, 3), [[0, 4], [1], [2, 3, 5]])
})

void test('tileCells leaves a row above a phone tile only', () => {
  assert.deepEqual(tileCells(2), { startRow: 1, start: 2, end: 6 })
  assert.deepEqual(tileCells(4), { startRow: 0, start: 0, end: 16 })
})
