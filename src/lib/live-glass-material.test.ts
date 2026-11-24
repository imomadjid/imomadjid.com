import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import material from '#/lib/live-glass-material.json'

// tools/glass-live/fit.py writes these tables; src/shaders/live-glass.wgsl reads them with fixed
// slot counts, so a refit that changes a shape has to change the shader too.
void test("the bevel profile fills the shader's ten knots and ends at no pull", () => {
  assert.equal(material.knots.length, 10)
  assert.equal(material.pulls.length, 10)
  assert.equal(material.slopes.length, 10)
  assert.equal(material.pulls.at(-1), 0)
  for (const [i, knot] of material.knots.entries())
    if (i > 0) assert.ok(knot > material.knots[i - 1])
})

void test('each scheme has a full table over distance and angle', () => {
  const rows = Math.round((12 - material.dMin) / material.dStep) + 1
  for (const scheme of [material.light, material.dark])
    for (const table of [scheme.offset, scheme.gain, scheme.curve]) {
      assert.equal(table.length, rows)
      for (const row of table) assert.equal(row.length, material.angles)
    }
})

void test('deep inside, the glass passes the backdrop through as iOS regular glass does', () => {
  // Gain there is the material's tone: light glass lifts toward white, dark toward a dark grey,
  // and neither hides the backdrop.
  for (const scheme of [material.light, material.dark]) {
    const middle = scheme.gain.at(-1)?.[0] ?? 0
    assert.ok(middle > 0.3 && middle < 1.2, `gain ${middle}`)
  }
})
