import { deepStrictEqual, strictEqual } from 'node:assert/strict'
import { test } from 'node:test'

import { informationField, stampSlug, stampTitle, themeList } from './candidate.ts'

void test('stampTitle takes the name from a Colnect file', () => {
  strictEqual(
    stampTitle('Stamp of Indonesia - 1971 - Colnect 257403 - Batik handicrafts.jpeg', 'Stamp'),
    'Batik handicrafts',
  )
})

void test('stampTitle falls back from a generic description to the file name', () => {
  strictEqual(stampTitle('W c handy stamp.jpg', 'Stamp'), 'W c handy stamp')
  strictEqual(stampTitle('Stamp_US_1847_5c.jpg', ''), 'Stamp US 1847 5c')
  strictEqual(stampTitle('x.jpg', 'Moon landing, 10 cents'), 'Moon landing, 10 cents')
})

void test('informationField reads a Colnect information row', () => {
  const wikitext = [
    '{{information field|name=Themes|value=Animals_(Fauna) {{dot}} Bees {{dot}} Insects}}',
    '{{information field|name=Issued on|value=1971-05-25}}',
  ].join('\n')
  strictEqual(informationField(wikitext, 'Issued on'), '1971-05-25')
  deepStrictEqual(themeList(informationField(wikitext, 'Themes')), [
    'Animals (Fauna)',
    'Bees',
    'Insects',
  ])
  strictEqual(informationField(wikitext, 'Series'), undefined)
})

void test('stampSlug is lower case, hyphenated and ASCII', () => {
  strictEqual(
    stampSlug('Stamp of Indonesia - 1971 - Colnect 257403 - Batik handicrafts.jpeg'),
    'stamp-of-indonesia-1971-colnect-257403-batik-handicrafts',
  )
  strictEqual(stampSlug('Selo postal, Estados Unidos, 1847.jpg'), 'selo-postal-estados-unidos-1847')
  strictEqual(stampSlug('Alexandria “Blue Boy”.png'), 'alexandria-blue-boy')
})
