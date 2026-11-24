import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { cssSpring, springOf, stepSprings } from './flight-springs'

const run = (response: number, seconds: number) => {
  const state = { values: [0], velocities: [0] }
  const spring = springOf({ type: 'spring', visualDuration: response, bounce: 0 })
  let settled = false
  let peak = 0
  for (let time = 0; time < seconds && !settled; time += 1 / 60) {
    settled = stepSprings(state, [100], [spring], [0.05], 1 / 60)
    peak = Math.max(peak, state.values[0])
  }
  return { value: state.values[0], settled, peak }
}

void test('a spring without bounce is nearly there one response in and never overshoots', () => {
  const { value, peak } = run(0.5, 0.5)
  assert.ok(value > 97 && value < 100, `${value}`)
  assert.ok(peak <= 100)
})

void test('a spring settles onto its target exactly', () => {
  const { value, settled } = run(0.5, 2)
  assert.equal(settled, true)
  assert.equal(value, 100)
})

void test('a new target turns a moving value around with its speed', () => {
  const spring = springOf({ type: 'spring', visualDuration: 0.5, bounce: 0 })
  const state = { values: [0], velocities: [0] }
  for (let frame = 0; frame < 6; frame += 1) stepSprings(state, [100], [spring], [0.05], 1 / 60)
  const { values, velocities } = state
  const [before] = values
  assert.ok(velocities[0] > 0)
  stepSprings(state, [0], [spring], [0.05], 1 / 60)
  // Still moving outward for a moment: it carries its speed into the turn.
  assert.ok(state.values[0] > before)
})

void test('cssSpring samples a spring from 0 to 1 as a linear() easing', () => {
  const { duration, easing } = cssSpring({ type: 'spring', visualDuration: 0.5, bounce: 0 })
  assert.ok(duration > 0.5 && duration < 1.5, `${duration}`)
  assert.match(easing, /^linear\(0, .*, 1\)$/)
  const stops = easing.slice(7, -1).split(', ').map(Number)
  assert.ok(stops.every((stop, index) => index === 0 || stop >= stops[index - 1]))
})
