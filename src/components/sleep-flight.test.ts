import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createBreath, flightPose, maxBank } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

const breaths = Array.from({ length: 400 }, () => createBreath(0))
const steps = 200

const poseAt = (flight: SleepFlight, time: number) =>
  flightPose(flight, Math.min(1, Math.max(0, (time - flight.start) / flight.duration)))

void test('a breath lets out two or three Z’s, through one exhale', () => {
  for (const breath of breaths) {
    assert.ok(breath.length === 2 || breath.length === 3)
    for (let index = 1; index < breath.length; index++) {
      const gap = breath[index].start - breath[index - 1].start
      assert.ok(gap >= 650 && gap <= 800, `gap ${gap}`)
    }
  }
})

void test('a Z floats away from the head and never comes back', () => {
  for (const flight of breaths.flat()) {
    let previous = -Infinity
    for (let step = 0; step <= steps; step++) {
      const { x, y } = flightPose(flight, step / steps)
      const away =
        (x - flight.originX) * Math.sin((flight.heading * Math.PI) / 180) -
        (y - flight.originY) * Math.cos((flight.heading * Math.PI) / 180)
      assert.ok(away >= previous - 1e-9, 'moved back toward the head')
      previous = away
    }
  }
})

void test('a Z slows as it rises', () => {
  for (const flight of breaths.flat()) {
    const angle = (flight.heading * Math.PI) / 180
    const speed = (from: number, to: number) => {
      const a = flightPose(flight, from)
      const b = flightPose(flight, to)
      return (b.x - a.x) * Math.sin(angle) - (b.y - a.y) * Math.cos(angle)
    }
    assert.ok(speed(0.2, 0.3) > speed(0.5, 0.6))
    assert.ok(speed(0.5, 0.6) > speed(0.8, 0.9))
  }
})

void test('a breath’s Z’s never catch each other, and settle into zzZ', () => {
  for (const breath of breaths) {
    const end = Math.max(...breath.map((flight) => flight.start + flight.duration))
    for (let index = 1; index < breath.length; index++) {
      const [ahead, behind] = [breath[index - 1], breath[index]]
      for (let time = behind.start; time <= end; time += 40) {
        const a = poseAt(ahead, time)
        const b = poseAt(behind, time)
        if (a.opacity < 0.3 || b.opacity < 0.3) continue
        // Clear of each other: a Z's box is about 13 px wide at full size, and the glyph's corners
        // sit inside it, so at worst two Z's brush, where the newer one's ring parts them.
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 0.9 * 6.5 * (a.scale + b.scale))
      }
      // The one ahead ends farther out and larger.
      const a = flightPose(ahead, 1)
      const b = flightPose(behind, 1)
      assert.ok(Math.hypot(a.x, a.y) > Math.hypot(b.x, b.y))
      assert.ok(a.scale > b.scale)
    }
  }
})

void test('a Z rests clear of the photo, and lets its ring show only in focus', () => {
  for (const flight of breaths.flat()) {
    // Past the middle of its way, its centre is off the photo (radius 24).
    const pose = flightPose(flight, 0.5)
    assert.ok(Math.hypot(pose.x, pose.y) > 24, 'still over the photo')
    assert.equal(flightPose(flight, 0).ring, 0)
    assert.equal(flightPose(flight, 0.4).ring, 1)
  }
})

void test('it leans into its drift no further than the limit', () => {
  for (const flight of breaths.flat()) {
    for (let step = 0; step <= steps; step++) {
      const { rotation } = flightPose(flight, step / steps)
      const lean = rotation - flight.tilt - 0.25 * flight.heading
      assert.ok(Math.abs(lean) < maxBank)
    }
  }
})
