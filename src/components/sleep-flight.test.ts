import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createFlight, flightsConflict, reserveFlight } from './sleep-flight'
import type { SleepFlight } from './sleep-flight'

void test('rejects coincident flights but permits separate times and paths', () => {
  const flight = createFlight(0)
  assert.equal(flightsConflict(flight, flight), true)
  assert.equal(flightsConflict(flight, { ...flight, start: 6000 }), false)
  assert.equal(flightsConflict(flight, { ...flight, startX: 80, crestX: 100 }), false)
})

void test('scheduled flights avoid sustained overlap without changing existing paths', () => {
  const flights = new Map<number, SleepFlight>()
  for (let index = 0; index < 300; index++) {
    const slot = index % 3
    const previous = flights.get(slot)
    const earliest = previous ? previous.start + previous.duration + 200 : index * 1500
    const others = [...flights.entries()].filter(([key]) => key !== slot)
    const snapshots = others.map(([, flight]) => JSON.stringify(flight))
    const candidate = reserveFlight(flights, slot, earliest)
    assert.ok(candidate.start >= earliest)
    others.forEach(([, flight], otherIndex) => {
      assert.equal(flightsConflict(candidate, flight), false)
      assert.equal(JSON.stringify(flight), snapshots[otherIndex])
    })
  }
})
