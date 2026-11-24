import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { seeMoreCellRect, seeMoreRestZoom, visibleFraction } from './see-more-grid'

const tile = { x: 100, y: 50, width: 178, height: 178 }
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9)

void test('seeMoreCellRect fills the tile edge to edge at 1x', () => {
  assert.deepEqual(seeMoreCellRect(tile, 0, 1), { x: 100, y: 50, width: 43, height: 43 })
  const last = seeMoreCellRect(tile, 15, 1)
  close(last.x + last.width, 278)
  close(last.y + last.height, 228)
})

void test('seeMoreCellRect fills the resting tile with the middle four cells', () => {
  const zoom = seeMoreRestZoom(tile.width)
  const first = seeMoreCellRect(tile, 5, zoom)
  const last = seeMoreCellRect(tile, 10, zoom)
  close(first.x, tile.x)
  close(first.y, tile.y)
  close(last.x + last.width, tile.x + tile.width)
  close(last.y + last.height, tile.y + tile.height)
  close(visibleFraction(first, tile), 1)
  assert.equal(visibleFraction(seeMoreCellRect(tile, 0, zoom), tile), 0)
  assert.equal(visibleFraction(seeMoreCellRect(tile, 4, zoom), tile), 0)
})
