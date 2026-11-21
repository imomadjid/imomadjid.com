import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { hookPaths } from './blind-wand-shape'

void test('the hook curls out the front of the hole at rest and swaps sides as the wand turns', () => {
  // The curl's free end is the last point drawn: in front of the tip at rest, where a visitor
  // sees it, and behind it after half a turn, when the tip shows its other face.
  const freeEnd = (path: string) => /(-?[\d.]+ -?[\d.]+)$/.exec(path)?.[1]
  const rest = hookPaths(0)
  const turned = hookPaths(Math.PI)
  assert.match(rest.back, /^M0 /)
  assert.equal(freeEnd(rest.front), '-1.98 32.50')
  assert.equal(freeEnd(turned.back), '1.98 32.50')
})
