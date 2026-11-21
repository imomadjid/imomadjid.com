#!/usr/bin/env node
// Lints 18px duotone SVG icons against the fill duo grid (or outline duo with --outline).
// Usage: node lint.mjs [--outline] [--json] icon.svg [more.svg ...]
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readIcon } from './svg.mjs'

const EPS = 0.01
const COLOR_OK = new Set(['currentColor', 'none'])

const overlaps = (a, b) => a[0] < b[2] - EPS && b[0] < a[2] - EPS && a[1] < b[3] - EPS && b[1] < a[3] - EPS
const round = (n) => Math.round(n * 100) / 100

export function lintIcon(source, { outline = false } = {}) {
  const { root, shapes } = readIcon(source)
  const errors = []
  const warnings = []
  if (!root) return { errors: ['no <svg> element'], warnings }

  const viewBox = (root.viewBox ?? '').trim().split(/[\s,]+/).map(Number)
  if (viewBox.join(' ') !== '0 0 18 18') {
    errors.push(`viewBox is "${root.viewBox ?? 'missing'}"; use "0 0 18 18"`)
  }
  if (!shapes.length) errors.push('no shapes')

  for (const s of shapes) {
    for (const [key, value] of [['fill', s.attrs.fill], ['stroke', s.attrs.stroke]]) {
      if (value !== undefined && !COLOR_OK.has(value)) {
        errors.push(`${s.tag} has ${key}="${value}"; use currentColor so the icon follows text color`)
      }
    }
    if (s.rawStyle && /(fill|stroke|color)\s*:/.test(s.rawStyle)) {
      warnings.push(`${s.tag} sets color in style="${s.rawStyle}"; use attributes and currentColor`)
    }
  }
  for (const key of ['fill', 'stroke']) {
    if (root[key] !== undefined && !COLOR_OK.has(root[key])) {
      errors.push(`<svg> has ${key}="${root[key]}"; use currentColor`)
    }
  }

  const tones = new Set(shapes.map((s) => round(s.tone)).filter((t) => t < 1))
  const allowed = outline ? [0.3, 0.2] : [0.4, 0.2]
  if (!tones.size) errors.push('no secondary layer: give the body fill-opacity or a group opacity')
  for (const t of tones) {
    if (!allowed.includes(t)) warnings.push(`secondary tone ${t}; this set uses ${allowed.join(' or ')}`)
  }

  const stroked = shapes.filter((s) => s.strokeWidth > 0)
  if (outline) {
    for (const s of stroked) {
      if (Math.abs(s.strokeWidth - 1.5) > EPS) warnings.push(`${s.tag} stroke-width ${s.strokeWidth}; use 1.5`)
    }
    if (!stroked.length) warnings.push('no strokes; outline duo draws every line as a 1.5 stroke')
  } else if (stroked.length) {
    warnings.push(
      `${stroked.length} stroked shape(s); fine in an app, but expand strokes to fills before shipping a library`,
    )
  }

  // Secondary shapes in the same opacity group composite once, so only cross-group pairs stack.
  const secondary = shapes.filter((s) => s.tone < 1 && s.box)
  for (let i = 0; i < secondary.length; i++) {
    for (let j = i + 1; j < secondary.length; j++) {
      const [a, b] = [secondary[i], secondary[j]]
      if (a.group !== null && a.group === b.group) continue
      if (overlaps(a.box, b.box)) {
        warnings.push(`two secondary shapes (${a.tag}, ${b.tag}) may overlap; stacked tints show as a darker band`)
      }
    }
  }

  const boxes = shapes.map((s) => s.box).filter(Boolean)
  let bounds = null
  if (boxes.length) {
    bounds = [
      Math.min(...boxes.map((b) => b[0])),
      Math.min(...boxes.map((b) => b[1])),
      Math.max(...boxes.map((b) => b[2])),
      Math.max(...boxes.map((b) => b[3])),
    ].map(round)
    if (bounds[0] < -EPS || bounds[1] < -EPS || bounds[2] > 18 + EPS || bounds[3] > 18 + EPS) {
      errors.push(`shapes reach outside the canvas: ${bounds.join(', ')}`)
    }
    const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1])
    if (span < 14.5 - EPS) {
      warnings.push(`icon spans only ${round(span)} units; the body should reach 1 to 17 on at least one axis`)
    }
  }

  const decimals = Math.max(0, ...shapes.map((s) => s.decimals))
  if (decimals > 3) warnings.push(`coordinates use ${decimals} decimals; round to 3`)

  return { errors, warnings: [...new Set(warnings)], bounds }
}

function main(argv) {
  const outline = argv.includes('--outline')
  const json = argv.includes('--json')
  const files = argv.filter((a) => !a.startsWith('--'))
  if (!files.length) {
    console.error('usage: node lint.mjs [--outline] [--json] icon.svg [more.svg ...]')
    return 2
  }
  const results = files.map((file) => ({ file, ...lintIcon(readFileSync(file, 'utf8'), { outline }) }))
  if (json) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    for (const r of results) {
      const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'WARN' : 'ok  '
      console.log(`${status}  ${basename(r.file)}${r.bounds ? `  bounds ${r.bounds.join(' ')}` : ''}`)
      for (const e of r.errors) console.log(`      error  ${e}`)
      for (const w of r.warnings) console.log(`      warn   ${w}`)
    }
  }
  return results.some((r) => r.errors.length) ? 1 : 0
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2))
}
