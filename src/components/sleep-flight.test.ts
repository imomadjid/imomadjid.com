import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createFlight, createStream, emitEvery, flightPose, maxBank } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

// Sleeps of a minute's Z's each, let out as the particles let them out.
function sleep(): SleepFlight[] {
  const stream = createStream()
  const flights: SleepFlight[] = []
  let start = 0
  for (let index = 0; index < 36; index++) {
    flights.push(createFlight(stream, start))
    start += emitEvery.min + Math.random() * (emitEvery.max - emitEvery.min)
  }
  return flights
}
const sleeps = Array.from({ length: 60 }, sleep)
const flights = sleeps.flat()
const steps = 200

const poseAt = (flight: SleepFlight, time: number) =>
  flightPose(flight, Math.min(1, Math.max(0, (time - flight.start) / flight.duration)))
const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const awayOf = (flight: SleepFlight, x: number, y: number) =>
  (x - flight.originX) * Math.sin(toRadians(flight.heading)) -
  (y - flight.originY) * Math.cos(toRadians(flight.heading))

void test('a sleep lets its Z’s out evenly, along one path', () => {
  for (const flights of sleeps) {
    for (let index = 1; index < flights.length; index++) {
      const gap = flights[index].start - flights[index - 1].start
      assert.ok(gap >= emitEvery.min && gap <= emitEvery.max, `gap ${gap}`)
    }
    const headings = flights.map((flight) => flight.heading)
    assert.ok(Math.max(...headings) - Math.min(...headings) <= 6)
    assert.ok(headings.every((heading) => heading >= 17 && heading <= 33))
  }
})

void test('a Z floats away from the head and never comes back', () => {
  for (const flight of flights) {
    let previous = -Infinity
    for (let step = 0; step <= steps; step++) {
      const { x, y } = flightPose(flight, step / steps)
      const away = awayOf(flight, x, y)
      assert.ok(away >= previous - 1e-9, 'moved back toward the head')
      previous = away
    }
  }
})

void test('a Z drifts on, slowing only a little as it rises', () => {
  for (const flight of flights) {
    const speed = (from: number, to: number) => {
      const a = flightPose(flight, from)
      const b = flightPose(flight, to)
      return awayOf(flight, b.x, b.y) - awayOf(flight, a.x, a.y)
    }
    const early = speed(0.1, 0.4)
    const late = speed(0.6, 0.9)
    assert.ok(late > 0)
    assert.ok(early / late > 1.2 && early / late < 2.5, `early/late ${early / late}`)
  }
})

void test('a Z grows over its whole life', () => {
  for (const flight of flights) {
    let previous = 0
    for (let step = 0; step <= steps; step++) {
      const { scale } = flightPose(flight, step / steps)
      assert.ok(scale >= previous - 1e-9, 'shrank')
      previous = scale
    }
    assert.ok(flightPose(flight, 0.9).scale > 1.25 * flightPose(flight, 0.15).scale)
  }
})

void test('a Z never reaches the one ahead of it', () => {
  for (const flights of sleeps) {
    for (let index = 1; index < flights.length; index++) {
      const [ahead, behind] = [flights[index - 1], flights[index]]
      for (let time = behind.start; time <= ahead.start + ahead.duration; time += 40) {
        const a = poseAt(ahead, time)
        const b = poseAt(behind, time)
        if (a.opacity < 0.3 || b.opacity < 0.3) continue
        // A Z's box is about 13 px wide at full size, and the glyph's corners sit inside it, so at
        // worst two Z's brush, where the newer one's ring parts them.
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 0.9 * 6.5 * (a.scale + b.scale))
        assert.ok(Math.hypot(a.x, a.y) > Math.hypot(b.x, b.y))
      }
    }
  }
})

void test('once the stream is going, a Z is always out', () => {
  for (const flights of sleeps) {
    const last = flights.at(-1)
    if (!last) continue
    for (let time = flights[0].duration; time < last.start; time += 20) {
      const shown = flights.filter((flight) => poseAt(flight, time).opacity > 0.5).length
      assert.ok(shown >= 1, `none at ${time}`)
    }
  }
})

void test('its ring shows only in focus', () => {
  for (const flight of flights) {
    assert.equal(flightPose(flight, 0).ring, 0)
    assert.equal(flightPose(flight, 0.5).ring, 1)
    assert.ok(flightPose(flight, 0.98).ring < 0.5)
  }
})

void test('it leans into its drift no further than the limit', () => {
  for (const flight of flights) {
    for (let step = 0; step <= steps; step++) {
      const { rotation } = flightPose(flight, step / steps)
      const lean = rotation - flight.tilt - 0.25 * flight.heading
      assert.ok(Math.abs(lean) < maxBank)
    }
  }
})
