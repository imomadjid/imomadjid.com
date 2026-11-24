import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { containRect, cornerLags, coverCrop, diagonal, quadOf } from './gallery-flight-geometry'

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

void test('cornerLags starts the corner farthest from its viewport corner first', () => {
  const viewport = { x: 0, y: 0, width: 1000, height: 800 }
  const tile = quadOf({ x: 100, y: 100, width: 100, height: 100 })
  const lags = cornerLags(tile, quadOf(viewport), diagonal(viewport))
  // The bottom right has the longest way to go.
  assert.equal(lags[2], 0)
  assert.ok(lags[0] > lags[3] && lags[3] > 0 && lags[1] > 0)
})

void test('cornerLags moves an edge as one when its corners are as far as each other', () => {
  const viewport = { x: 0, y: 0, width: 1000, height: 800 }
  // Centred across, near the top: the bottom edge leads, both corners together.
  const tile = quadOf({ x: 450, y: 100, width: 100, height: 100 })
  const lags = cornerLags(tile, quadOf(viewport), diagonal(viewport))
  assert.ok(Math.abs(lags[2] - lags[3]) < 1e-9 && lags[2] === 0)
  assert.ok(Math.abs(lags[0] - lags[1]) < 1e-9 && lags[0] > 0)
})

void test('cornerLags starts every corner together from the middle of the screen', () => {
  const viewport = { x: 0, y: 0, width: 1000, height: 800 }
  const tile = quadOf({ x: 450, y: 350, width: 100, height: 100 })
  const lags = cornerLags(tile, quadOf(viewport), diagonal(viewport))
  for (const lag of lags) assert.ok(Math.abs(lag) < 1e-9)
})

void test('cornerLags spreads a tile near the edge more than one near the middle', () => {
  const viewport = { x: 0, y: 0, width: 1000, height: 800 }
  const spread = (tile: ReturnType<typeof quadOf>) =>
    Math.max(...cornerLags(tile, quadOf(viewport), diagonal(viewport)))
  const nearMiddle = quadOf({ x: 400, y: 300, width: 100, height: 100 })
  const atBottom = quadOf({ x: 450, y: 690, width: 100, height: 100 })
  assert.ok(spread(atBottom) > spread(nearMiddle))
})
