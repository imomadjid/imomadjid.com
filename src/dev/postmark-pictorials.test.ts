import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { pictorials } from './postmark-pictorials'
import type { Pictorial } from './postmark-pictorials'

// Enforces the rules of tools/postmarks/pictorial-style.md that markup can show, so pictorials
// drawn by many hands stay one style. Review at 64 px on /dev/postmarks covers the rest.

const allowedTags = new Set([
  'svg',
  'g',
  'defs',
  'mask',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
])
const weights = new Set(['3.4', '2.4', '1.8', '1.6'])
const structural = new Set(['svg', 'g', 'defs', 'mask'])

function markup(pictorial: Pictorial) {
  return renderToStaticMarkup(
    createElement(
      'svg',
      { viewBox: '0 0 100 100' },
      createElement(Fragment, null, pictorial.draw('t')),
    ),
  )
}

// The drawing without its masks, whose cut shapes may use other widths and black or white.
function drawn(svg: string) {
  return svg.replace(/<mask[\s\S]*?<\/mask>/g, '')
}

for (const [key, pictorial] of Object.entries(pictorials)) {
  void test(`${key}: one ink, allowed elements, no text or effects`, () => {
    const svg = markup(pictorial)
    for (const [, tag] of svg.matchAll(/<([a-zA-Z]+)/g)) {
      assert.ok(tag && allowedTags.has(tag), `${key} uses <${tag}>`)
    }
    for (const banned of [
      'opacity',
      'gradient',
      'filter',
      'style=',
      '<text',
      '<image',
      'pattern',
    ]) {
      assert.ok(!svg.toLowerCase().includes(banned), `${key} uses ${banned}`)
    }
    for (const [, attribute, value] of drawn(svg).matchAll(/\s(fill|stroke)="([^"]*)"/g)) {
      assert.ok(value === 'none' || value === 'currentColor', `${key} sets ${attribute}="${value}"`)
    }
    for (const [, value] of svg.matchAll(/\s(?:fill|stroke)="([^"]*)"/g)) {
      assert.ok(
        ['none', 'currentColor', '#fff', '#000'].includes(value ?? ''),
        `${key} uses the colour ${value}`,
      )
    }
  })

  void test(`${key}: only the three line weights`, () => {
    for (const [, width] of drawn(markup(pictorial)).matchAll(/stroke-width="([^"]*)"/g)) {
      assert.ok(weights.has(width ?? ''), `${key} uses stroke-width ${width}`)
    }
  })

  void test(`${key}: within the detail budget`, () => {
    const elements = [...drawn(markup(pictorial)).matchAll(/<([a-zA-Z]+)/g)].filter(
      ([, tag]) => tag && !structural.has(tag),
    )
    assert.ok(
      elements.length >= 8 && elements.length <= 30,
      `${key} draws ${elements.length} elements`,
    )
  })

  void test(`${key}: names its subject and fills the frame`, () => {
    assert.ok(pictorial.subject.trim().length > 0)
    const [x, y, w, h] = pictorial.ink
    assert.ok(
      x >= 0 && y >= 0 && x + w <= 100.5 && y + h <= 100.5,
      `${key} ink box leaves the canvas`,
    )
    assert.ok(Math.max(w, h) >= 50, `${key} is too small: ${w} x ${h}`)
  })
}
