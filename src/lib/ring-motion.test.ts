import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createRingMotion, RING_COUNT, ringUniforms } from './ring-motion'

const linear = { duration: 1, lead: 0.5, ease: (progress: number) => progress }

void test('the middle ring leads and the outer ring trails by the lead', () => {
  const motion = createRingMotion()
  motion.retarget(1, 0)
  assert.equal(motion.step(500, linear), false)
  assert.equal(motion.progress[0], 0.5)
  assert.equal(motion.progress[RING_COUNT - 1], 0)
  assert.equal(motion.step(1500, linear), true)
  assert.equal(motion.progress[RING_COUNT - 1], 1)
})

void test('a reversal starts every ring from where it is', () => {
  const motion = createRingMotion()
  motion.retarget(1, 0)
  motion.step(500, linear)
  const before = Array.from(motion.progress)
  motion.retarget(0, 500)
  motion.step(500, linear)
  assert.deepEqual(Array.from(motion.progress), before)
})

void test('retargeting to the current target does nothing', () => {
  assert.equal(createRingMotion().retarget(0, 0), false)
})

void test('ringUniforms never lets an outer ring reach inside an inner one', () => {
  // Middle zoomed far out, edges magnified: radius / zoom would fall without the clamp.
  const vectors = ringUniforms((ring) => (ring < RING_COUNT / 2 ? 1 : 4))
  const values = vectors.flat()
  assert.equal(values.length, RING_COUNT)
  let previous = 0
  for (let i = 1; i < RING_COUNT; i += 1) {
    const reach = (i / (RING_COUNT - 1)) * values[i]
    assert.ok(reach >= previous - 1e-9, `ring ${i} folds back`)
    previous = reach
  }
})
