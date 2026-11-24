import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  formatAperture,
  formatExposureCompensation,
  formatFocalLength,
  formatShutter,
} from '#/lib/exposure-format'

void test('sets the aperture with ƒ and a decimal comma', () => {
  assert.equal(formatAperture(6.3), 'ƒ6,3')
  assert.equal(formatAperture(22), 'ƒ22')
  assert.equal(formatAperture(5), 'ƒ5')
})

void test('keeps fractions of a second and marks whole seconds with a double prime', () => {
  assert.equal(formatShutter('1/4000'), '1/4000')
  assert.equal(formatShutter('0.8'), '0,8″')
  assert.equal(formatShutter('2'), '2″')
})

void test('rounds a zoom focal length to the millimetre', () => {
  assert.equal(formatFocalLength(21.4), '21mm')
  assert.equal(formatFocalLength(33), '33mm')
})

void test('steps exposure compensation in thirds with a true minus', () => {
  assert.equal(formatExposureCompensation(0), '±0')
  assert.equal(formatExposureCompensation(0.33), '+⅓')
  assert.equal(formatExposureCompensation(-0.33), '−⅓')
  assert.equal(formatExposureCompensation(0.67), '+⅔')
  assert.equal(formatExposureCompensation(-1.67), '−1⅔')
  assert.equal(formatExposureCompensation(2), '+2')
})
