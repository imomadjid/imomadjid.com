import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { containRect, cornerOrder, coverCrop, quadOf } from './gallery-flight-geometry'

const viewport = { x: 0, y: 0, width: 1000, height: 800 }
const noInsets = { top: 0, right: 0, bottom: 0, left: 0 }

void test('containRect fits a landscape photo to the width and centres it', () => {
  assert.deepEqual(containRect(viewport, 2, noInsets), { x: 0, y: 150, width: 1000, height: 500 })
})

void test('containRect fits a portrait photo inside the insets', () => {
  const rect = containRect(viewport, 0.5, { top: 60, right: 20, bottom: 20, left: 20 })
  assert.equal(rect.height, 720)
  assert.equal(rect.width, 360)
  assert.equal(rect.y, 60)
  assert.equal(rect.x, 320)
})

void test('coverCrop keeps the middle square of a 3:2 photo', () => {
  const crop = coverCrop(1.5, 1)
  assert.equal(crop.y, 0)
  assert.equal(crop.height, 1)
  assert.ok(Math.abs(crop.width - 2 / 3) < 1e-9)
  assert.ok(Math.abs(crop.x - 1 / 6) < 1e-9)
})

void test('coverCrop keeps the middle square of a 2:3 photo', () => {
  const crop = coverCrop(2 / 3, 1)
  assert.equal(crop.x, 0)
  assert.ok(Math.abs(crop.height - 2 / 3) < 1e-9)
  assert.ok(Math.abs(crop.y - 1 / 6) < 1e-9)
})

void test('cornerOrder leads with the corner farthest from its viewport corner', () => {
  // A tile near the top left: its bottom right corner has the longest way to go.
  const tile = quadOf({ x: 100, y: 100, width: 200, height: 200 })
  assert.deepEqual(cornerOrder(tile, quadOf(viewport)), [2, 1, 3, 0])
})

void test('cornerOrder ranks a tile near the bottom right the other way round', () => {
  const tile = quadOf({ x: 700, y: 500, width: 200, height: 200 })
  assert.deepEqual(cornerOrder(tile, quadOf(viewport))[0], 0)
})

void test('cornerOrder breaks ties in corner order', () => {
  const square = quadOf({ x: 0, y: 0, width: 10, height: 10 })
  assert.deepEqual(cornerOrder(square, square), [0, 1, 2, 3])
})
