import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { glowBackdrop } from './sunlit-backdrop'

const light = [250, 250, 250]
const dark = [23, 23, 23]
const glowing = { direction: 1, warmth: 0.55, intensity: 0.7 }

void test('steady day and night keep the plain surface', () => {
  assert.deepEqual(glowBackdrop({ ...glowing, surface: light, night: 0 }), light)
  assert.deepEqual(glowBackdrop({ ...glowing, surface: dark, night: 1 }), dark)
  assert.deepEqual(glowBackdrop({ ...glowing, surface: light, night: 0.3, intensity: 0 }), light)
})

void test('the glow raises the backdrop evenly, never past white', () => {
  for (let night = 0.05; night < 0.6; night += 0.05) {
    const surface = 250 + (23 - 250) * night
    const [red = 0, green, blue] = glowBackdrop({
      ...glowing,
      surface: [surface, surface, surface],
      night,
    })
    assert.ok(red > surface && red <= 255, `phase ${night}: ${red} over ${surface}`)
    assert.equal(green, red)
    assert.equal(blue, red)
  }
})

void test('the backdrop settles on the surface before the text turns light', () => {
  const surface = [80, 80, 80]
  assert.deepEqual(glowBackdrop({ ...glowing, surface, night: 0.74 }), surface)
  assert.deepEqual(glowBackdrop({ ...glowing, surface, night: 0.9 }), surface)
})
