import { strict as assert } from 'node:assert'
import { describe, test } from 'node:test'

import { fujiRecipes, matchRecipe, parseExposure, parseFujiSettings } from '#/lib/fuji-settings'
import type { FujiExif } from '#/lib/fuji-settings'

// exiftool's output for an X-T30 III JPEG shot with Summer Chrome.
const summerChrome: FujiExif = {
  ExposureTime: '1/250',
  FNumber: 5.6,
  ISO: 1600,
  FocalLength: 13,
  ExposureCompensation: -0.333333333333333,
  LensModel: 'XC13-33mmF3.5-6.3 OIS',
  FilmMode: 'Classic Chrome',
  Saturation: '+4 (highest)',
  DynamicRangeSetting: 'Manual',
  DevelopmentDynamicRange: 400,
  GrainEffectRoughness: 'Strong',
  GrainEffectSize: 'Large',
  ColorChromeEffect: 'Strong',
  ColorChromeFXBlue: 'Strong',
  WhiteBalance: 'Auto',
  WhiteBalanceFineTune: 'Red +100, Blue -120',
  HighlightTone: '-2 (soft)',
  ShadowTone: '-2 (soft)',
  Sharpness: '0 (normal)',
  NoiseReduction: '-4 (weakest)',
  Clarity: -4,
}

void describe('parseExposure', () => {
  void test('keeps the printed shutter speed and rounds exposure compensation', () => {
    assert.deepEqual(parseExposure(summerChrome), {
      shutter: '1/250',
      aperture: 5.6,
      iso: 1600,
      focalLength: 13,
      exposureCompensation: -0.33,
      lens: 'XC13-33mmF3.5-6.3 OIS',
    })
  })
})

void describe('parseFujiSettings', () => {
  void test('reads levels from labels and the white balance shift in camera steps', () => {
    const settings = parseFujiSettings(summerChrome)
    assert.equal(settings.dynamicRange, 'DR400')
    assert.equal(settings.grain, 'Strong, Large')
    assert.deepEqual(settings.whiteBalanceShift, { red: 5, blue: -6 })
    assert.equal(settings.highlight, -2)
    assert.equal(settings.color, 4)
  })

  void test('names a film simulation from its parenthesised label', () => {
    const settings = parseFujiSettings({ ...summerChrome, FilmMode: 'F0/Standard (Provia)' })
    assert.equal(settings.filmSimulation, 'Provia')
  })

  void test('reads Kelvin white balance, DR-Auto and grain off', () => {
    const settings = parseFujiSettings({
      ...summerChrome,
      WhiteBalance: 'Kelvin',
      ColorTemperature: 5200,
      DynamicRangeSetting: 'Auto',
      DevelopmentDynamicRange: undefined,
      GrainEffectRoughness: 'Off',
    })
    assert.equal(settings.whiteBalance, '5200K')
    assert.equal(settings.dynamicRange, 'Auto')
    assert.equal(settings.grain, 'Off')
  })

  void test('takes a monochrome mode from Saturation and has no color level', () => {
    const settings = parseFujiSettings({
      ...summerChrome,
      FilmMode: undefined,
      Saturation: 'Acros',
    })
    assert.equal(settings.filmSimulation, 'Acros')
    assert.equal(settings.color, null)
  })
})

void describe('matchRecipe', () => {
  void test('matches a photo shot with a known recipe', () => {
    assert.equal(matchRecipe(parseFujiSettings(summerChrome))?.name, 'Summer Chrome')
  })

  void test('compares the white balance shift regardless of key order', () => {
    const settings = parseFujiSettings(summerChrome)
    const sorted = { ...settings, whiteBalanceShift: { blue: -6, red: 5 } }
    assert.equal(matchRecipe(sorted)?.name, 'Summer Chrome')
  })

  void test('returns null when any stated setting differs', () => {
    const provia = parseFujiSettings({ ...summerChrome, FilmMode: 'F0/Standard (Provia)' })
    assert.equal(matchRecipe(provia), null)
  })

  void test('matches only the settings a recipe states', () => {
    const terracotta = fujiRecipes.find((recipe) => recipe.name === 'Terracotta Sun')
    assert.ok(terracotta && !('clarity' in terracotta.settings))
    const settings = parseFujiSettings({
      ...summerChrome,
      FilmMode: 'F0/Standard (Provia)',
      DynamicRangeSetting: 'Auto',
      GrainEffectRoughness: 'Weak',
      GrainEffectSize: 'Small',
      ColorChromeFXBlue: 'Weak',
      ShadowTone: -1.5,
      Saturation: '+2 (high)',
    })
    assert.equal(matchRecipe(settings)?.name, 'Terracotta Sun')
  })
})
