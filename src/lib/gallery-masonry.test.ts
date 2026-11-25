import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { masonryColumns } from './gallery-masonry'

void test('masonryColumns lays the lead rows out as a grid', () => {
  assert.deepEqual(masonryColumns([1, 2, 1, 1, 1, 1], 3, 6, 3), [
    [0, 3],
    [1, 4],
    [2, 5],
  ])
})

void test('masonryColumns adds the rest to the shortest column', () => {
  // After the lead row the columns stand 1, 2 and 0.5 tall.
  assert.deepEqual(masonryColumns([1, 2, 0.5, 1, 1, 1], 3, 3, 3), [[0, 4], [1], [2, 3, 5]])
})

void test('masonryColumns gives each of half as many columns two of the grid, row by row', () => {
  // A 4-wide grid of 8 in 2 columns: the left half's rows, then the right half's.
  assert.deepEqual(
    masonryColumns(
      Array.from({ length: 9 }, () => 1),
      2,
      8,
      4,
    ),
    [
      [0, 1, 4, 5, 8],
      [2, 3, 6, 7],
    ],
  )
})
