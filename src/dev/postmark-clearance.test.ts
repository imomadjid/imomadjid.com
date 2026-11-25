import assert from 'node:assert/strict'
import { test } from 'node:test'

import { depth, parseShape } from './postmark-clearance'

void test('parses each clearance spec', () => {
  assert.deepEqual(parseShape('e 10 20 30 40'), { kind: 'ellipse', cx: 10, cy: 20, rx: 30, ry: 40 })
  assert.deepEqual(parseShape('r 1 2 3 4'), { kind: 'box', x: 1, y: 2, w: 3, h: 4 })
  assert.equal(parseShape('p 0 0 1 0 1 1')?.kind, 'polygon')
  assert.equal(parseShape('p 0 0 1'), undefined)
  assert.equal(parseShape('e 1 2 x 4'), undefined)
})

void test('measures how far a point is inside a circle', () => {
  const circle = parseShape('e 0 0 10 10')
  assert.ok(circle)
  assert.ok(Math.abs(depth(circle, [6, 0]) - 4) < 1e-9)
  assert.ok(Math.abs(depth(circle, [0, -12]) + 2) < 1e-9)
})

void test('measures depth inside a polygon whichever way it winds', () => {
  const clockwise = parseShape('p 0 0 10 0 10 10 0 10')
  const anticlockwise = parseShape('p 0 0 0 10 10 10 10 0')
  assert.ok(clockwise && anticlockwise)
  for (const square of [clockwise, anticlockwise]) {
    assert.ok(Math.abs(depth(square, [2, 5]) - 2) < 1e-9)
    assert.ok(Math.abs(depth(square, [5, -3]) + 3) < 1e-9)
  }
})

void test('measures depth inside a box', () => {
  const box = parseShape('r 0 0 20 10')
  assert.ok(box)
  assert.equal(depth(box, [5, 3]), 3)
  assert.equal(depth(box, [25, 5]), -5)
})
