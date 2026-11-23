import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  createTiltTracker,
  relativeTilt,
  rotate,
  tiltSource,
  toScreen,
  upFromOrientation,
} from './device-tilt'
import type { Vec3 } from './vec3'

// A range far past any test angle, so the easing into it stays linear.
const settings = { influence: 1, range: 1e5, recenter: 3 }
const near = (a: readonly number[], b: readonly number[], epsilon = 1e-9) =>
  a.every((value, index) => Math.abs(value - (b[index] ?? Number.NaN)) < epsilon)

void test('world up follows the phone from flat to upright', () => {
  assert.ok(near(upFromOrientation(0, 0), [0, 0, 1]))
  assert.ok(near(upFromOrientation(90, 0), [0, 1, 0]))
  // Right edge down: up leans toward the left edge.
  assert.ok(upFromOrientation(0, 20)[0] < 0)
  // Gamma is unstable when upright, but up stays put.
  assert.ok(near(upFromOrientation(90, 70), [0, 1, 0]))
})

void test('a screen turned a quarter has its top along the device right edge', () => {
  // Landscape with the top of the device to the left: up runs along the device x axis.
  assert.ok(near(toScreen([1, 0, 0], 90), [0, 1, 0]))
  assert.ok(near(toScreen([0, 1, 0], 90), [-1, 0, 0]))
})

void test('rotation matches the turn that carries the rest pose to the current one', () => {
  const rest: Vec3 = [0, 0, 1]
  const current = upFromOrientation(0, 15)
  const turn = relativeTilt(rest, current, settings)
  // Undo the wall frame's mirrored y to turn the rest pose the way the phone did.
  const turned = rotate(rest, [-turn[0], turn[1], -turn[2]])
  assert.ok(near(turned, current, 1e-6))
})

void test('shadows slide downhill as the phone tilts', () => {
  const source: Vec3 = [2.6, -2.66, 5]
  const flat: Vec3 = [0, 0, 1]
  // Right edge down: the sun moves left, so shadows slide right.
  const right = tiltSource(source, relativeTilt(flat, upFromOrientation(0, 10), settings), 1.6)
  assert.ok(right[0] < source[0])
  // Top edge raised toward the viewer: the sun moves up the wall, so shadows slide down.
  const raised = tiltSource(source, relativeTilt(flat, upFromOrientation(10, 0), settings), 1.6)
  assert.ok(raised[1] < source[1])
})

void test('the turn eases into its range and scales with influence', () => {
  const flat: Vec3 = [0, 0, 1]
  const steep = upFromOrientation(0, 80)
  const limited = relativeTilt(flat, steep, { influence: 1, range: 6, recenter: 3 })
  assert.ok(Math.hypot(...limited) < (6 * Math.PI) / 180)
  const half = relativeTilt(flat, upFromOrientation(0, 2), {
    influence: 0.5,
    range: 90,
    recenter: 3,
  })
  assert.ok(Math.abs(Math.hypot(...half) - (1 * Math.PI) / 180) < 1e-4)
  assert.ok(near(relativeTilt(flat, steep, { influence: 1, range: 0, recenter: 3 }), [0, 0, 0]))
})

// A tracker whose light has turned partway toward a 12 degree roll.
function turned() {
  const tracker = createTiltTracker()
  tracker.read([0, 0, 1], true)
  tracker.read(upFromOrientation(0, 12), true)
  for (let frame = 0; frame < 30; frame += 1) tracker.step(1 / 60, settings, true)
  return tracker
}

void test('a held pose settles back to rest', () => {
  const tracker = createTiltTracker()
  tracker.read([0, 0, 1], true)
  tracker.read(upFromOrientation(0, 12), true)
  const first = tracker.step(1 / 60, settings, true)
  let latest = first
  for (let frame = 0; frame < 60 * 40; frame += 1) latest = tracker.step(1 / 60, settings, true)
  assert.ok(Math.hypot(...first) > 0)
  assert.ok(Math.hypot(...latest) < 1e-4)
  assert.equal(tracker.moving(), false)
})

void test('reduced motion puts the light back at rest at once', () => {
  const tracker = turned()
  assert.ok(tracker.moving())
  // The renderer stops scheduling frames under reduced motion, so the next one has no delta.
  assert.ok(near(tracker.step(0, settings, false), [0, 0, 0]))
  assert.equal(tracker.moving(), false)
})

void test('readings while disabled ask for no redraw and become the rest pose', () => {
  const tracker = turned()
  tracker.step(0, settings, false)
  assert.equal(tracker.read(upFromOrientation(60, 0), false), false)
  // Enabling again starts from the pose the phone is in now, with no turn.
  assert.ok(near(tracker.step(1 / 60, settings, true), [0, 0, 0]))
  assert.equal(tracker.read(upFromOrientation(60, 5), true), true)
})

void test('a reset starts from rest without gliding back', () => {
  const tracker = turned()
  tracker.reset()
  assert.ok(near(tracker.step(1 / 60, settings, true), [0, 0, 0]))
  assert.equal(tracker.moving(), false)
})
