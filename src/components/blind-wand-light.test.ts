import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { defaultAmbientSettings } from '#/lib/ambient-settings'
import type { SceneLight } from '#/lib/sunlit-scene'

import { barProfile, lightWand, profileFacets, starProfile } from './blind-wand-light'

const scene: SceneLight = {
  night: 0,
  direction: 0,
  entrance: 0,
  entranceNight: 0,
  aimX: 1.08,
  aimY: 0.45,
  phoneTilt: [0, 0, 0],
  surface: [0.98, 0.98, 0.98],
}

void test('visible faces run left to right across the silhouette', () => {
  for (const profile of [
    starProfile(6, 6, 0),
    starProfile(36, 6, 0.22),
    barProfile(2.9, 1.1, 0.3),
  ]) {
    for (let turn = 0; turn < Math.PI * 2; turn += 0.37) {
      const facets = profileFacets(profile, turn)
      assert.ok(facets.length > 0)
      for (const facet of facets) {
        assert.ok(facet.left <= facet.right + 1e-9)
        assert.ok(facet.normalZ > 0)
      }
    }
  }
})

void test('the flat tip faces the room at rest and turns edge-on a quarter turn later', () => {
  const span = (turn: number) => {
    const facets = profileFacets(barProfile(2.9, 1.1, 0.3), turn)
    return (facets.at(-1)?.right ?? 0) - (facets[0]?.left ?? 0)
  }
  assert.ok(Math.abs(span(0) - 2.9) < 1e-9)
  assert.ok(Math.abs(span(Math.PI * 3) - 2.9) < 1e-9)
  assert.ok(Math.abs(span(Math.PI / 2) - 1.1) < 1e-9)
})

void test('closing the slats at night leaves less of the wand in direct light', () => {
  const points = Array.from({ length: 80 }, (_, index) => [0.7, index / 80] as const)
  const settings = defaultAmbientSettings
  const lit = (night: number) => {
    const { stripes } = lightWand(settings, { ...scene, night }, points, 1.6, settings.wand.depth)
    return stripes.reduce((sum, value) => sum + value, 0) / stripes.length
  }
  const day = lit(0)
  assert.ok(Math.abs(day - settings.blinds.opening) < 0.08)
  assert.ok(lit(1) < day * 0.7)
})
