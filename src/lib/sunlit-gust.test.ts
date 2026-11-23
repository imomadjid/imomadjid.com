import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { anchorShadow, canopies } from './sunlit-geometry'
import { createGust, pushRate } from './sunlit-gust'

const settings = { strength: 1, recovery: 1.3, rustle: 1 }
const near: [number, number] = [0, 1]
const far: [number, number] = [0.2, 0.6]
const anchors = { near, far }

// A stroke of `length` wall heights straight up, at the left of both anchors.
function stroke(gust: ReturnType<typeof createGust>, length: number, seconds: number) {
  const steps = 10
  for (let index = 0; index < steps; index += 1) {
    const y = 0.8 - (length * index) / steps
    gust.push([-0.8, y], [0, -length / steps], seconds / steps, anchors, settings)
  }
}

void test('a stroke across the lever swings the branch along it, one toward it does not', () => {
  // Below the attachment and moving right: clockwise on screen, so positive.
  assert.ok(pushRate([0, 1.5], [0.1, 0], 0.05, [0, 1]) < 0)
  assert.ok(pushRate([0, 0.5], [0.1, 0], 0.05, [0, 1]) > 0)
  assert.ok(Math.abs(pushRate([0, 0.5], [0, 0.1], 0.05, [0, 1])) < 1e-12)
})

void test('a faster stroke over the same path pushes harder', () => {
  const slow = pushRate([-0.5, 0.5], [0, -0.1], 0.1, [0, 1])
  const fast = pushRate([-0.5, 0.5], [0, -0.1], 0.05, [0, 1])
  assert.ok(Math.abs(fast / slow - 2) < 1e-9)
})

void test('a branch swings past rest and back before it settles', () => {
  const gust = createGust()
  stroke(gust, 0.3, 0.15)
  const angles: number[] = []
  for (let frame = 0; frame < 60 * 6; frame += 1) angles.push(gust.step(1 / 60, settings).nearSway)
  const first = Math.sign(angles.find((angle) => Math.abs(angle) > 1e-4) ?? 0)
  assert.notEqual(first, 0)
  assert.ok(angles.some((angle) => Math.sign(angle) === -first && Math.abs(angle) > 1e-4))
  assert.ok(Math.abs(angles.at(-1) ?? 1) < 1e-4)
})

void test('swings ease into their limit however hard the push', () => {
  const gust = createGust()
  for (let push = 0; push < 20; push += 1) stroke(gust, 1, 0.05)
  let largest = 0
  for (let frame = 0; frame < 120; frame += 1) {
    largest = Math.max(largest, Math.abs(gust.step(1 / 60, settings).nearSway))
  }
  assert.ok(largest <= (1.4 * Math.PI) / 180 + 1e-9)
})

void test('the far branch feels the push a moment later', () => {
  const gust = createGust()
  stroke(gust, 0.3, 0.1)
  const early = gust.step(0.1, settings)
  assert.ok(Math.abs(early.nearSway) > 0)
  assert.equal(early.farSway, 0)
  assert.ok(Math.abs(gust.step(0.1, settings).farSway) > 0)
})

void test('the flicker spreads and fades, and a reset stops everything', () => {
  const gust = createGust()
  stroke(gust, 0.3, 0.1)
  const start = gust.step(1 / 60, settings)
  const later = gust.step(0.5, settings)
  assert.ok(start.rustle > later.rustle && later.rustle > 0)
  assert.ok(later.rustleSpread > start.rustleSpread)
  gust.reset()
  assert.equal(gust.moving(), false)
  assert.equal(gust.step(1 / 60, settings).nearSway, 0)
})

void test('canopy geometry matches the shader at the default foliage', () => {
  const { near, far } = canopies(1, 0.4)
  const close = (a: readonly number[], b: readonly number[]) =>
    a.every((value, index) => Math.abs(value - (b[index] ?? Number.NaN)) < 1e-9)
  assert.ok(close(near.origin, [-0.352 - 0.932, -0.625 - 0.932 * 0.95, 1.05]))
  assert.ok(close(far.origin, [0.21 - 0.85, 0.22 - 0.85 * 0.95, 1.81]))
  // The attachment's shadow lies on the line from the sun through the attachment.
  const source: [number, number, number] = [2.6, -2.66, 5]
  const [x, y] = anchorShadow(near, source)
  const attached = [near.origin[0] + near.size, near.origin[1] + 0.95 * near.size, near.origin[2]]
  const along = (attached[2] ?? 0) / source[2]
  assert.ok(close([x + (source[0] - x) * along, y + (source[1] - y) * along], attached.slice(0, 2)))
})
