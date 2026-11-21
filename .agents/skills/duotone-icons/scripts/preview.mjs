#!/usr/bin/env node
// Writes an HTML contact sheet for 18px duotone icons: real size in both themes, 2x, a 4x grid
// view with the 1-unit padding marked, and the secondary layer in red.
// Usage: node preview.mjs icon.svg [more.svg ...] [--out preview.html]
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const clean = (svg) =>
  svg
    .replace(/<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->/g, '')
    // Drop only the root size so CSS controls it.
    .replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, ''))
    .trim()

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const gridLines = Array.from({ length: 17 }, (_, i) => i + 1)
  .map((n) => `<path d="M${n} 0V18M0 ${n}H18"/>`)
  .join('')
const grid = `<svg class="grid" viewBox="0 0 18 18" aria-hidden="true"><g>${gridLines}</g><rect x="1" y="1" width="16" height="16"/></svg>`

export function renderPreview(icons) {
  const rows = icons
    .map(
      ({ name, svg }) => `
      <tr>
        <th scope="row">${escape(name)}</th>
        <td class="light s18">${svg}</td>
        <td class="dark s18">${svg}</td>
        <td class="light s36">${svg}</td>
        <td class="light s72"><div class="stack">${svg}${grid}</div></td>
        <td class="light s72 red">${svg}</td>
      </tr>`,
    )
    .join('')
  const strip = icons.map(({ svg }) => svg).join('')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Icon preview</title>
<style>
  :root { color-scheme: light; font: 13px/1.4 system-ui, sans-serif; }
  body { margin: 0; padding: 24px 16px; background: #fff; color: #111; }
  h1 { font-size: 15px; margin: 0 0 16px; }
  .set { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; padding: 12px 16px; margin-bottom: 8px; }
  .set svg { width: 18px; height: 18px; }
  .set.dark { background: #111; color: #eee; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; }
  th, td { padding: 12px 16px; text-align: center; vertical-align: middle; }
  thead th { font-weight: 500; color: #666; white-space: nowrap; }
  tbody th { text-align: left; font-weight: 500; white-space: nowrap; }
  .light { background: #fff; color: #111; }
  .dark { background: #111; color: #eee; }
  .s18 svg { width: 18px; height: 18px; }
  .s36 svg { width: 36px; height: 36px; }
  .s72 svg { width: 72px; height: 72px; display: block; }
  .stack { position: relative; width: 72px; height: 72px; }
  .stack .grid { position: absolute; inset: 0; }
  .grid g path { stroke: #3b82f6; stroke-opacity: 0.18; stroke-width: 0.04; fill: none; }
  .grid rect { fill: none; stroke: #3b82f6; stroke-opacity: 0.6; stroke-width: 0.05; stroke-dasharray: 0.2 0.2; }
  /* CSS beats presentation attributes, so this repaints the secondary layer only. */
  .red [fill-opacity], .red [opacity], .red [opacity] * { fill: #e5484d; stroke: #e5484d; }
  .red [fill-opacity], .red [opacity] { fill-opacity: 1; opacity: 1; }
</style>
</head>
<body>
<h1>${icons.length} icon${icons.length === 1 ? '' : 's'} at 18px</h1>
<div class="set light">${strip}<span>Text at 14px for weight</span></div>
<div class="set dark">${strip}<span>Text at 14px for weight</span></div>
<div class="scroll">
<table>
  <thead><tr><th></th><th>18 light</th><th>18 dark</th><th>36</th><th>72, grid and padding</th><th>Secondary in red</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>
</body>
</html>
`
}

function main(argv) {
  const outIndex = argv.indexOf('--out')
  const out = outIndex === -1 ? 'icon-preview.html' : argv[outIndex + 1]
  const files = argv.filter((a, i) => !a.startsWith('--') && i !== outIndex + 1)
  if (!files.length) {
    console.error('usage: node preview.mjs icon.svg [more.svg ...] [--out preview.html]')
    return 2
  }
  const icons = files.map((file) => ({ name: basename(file, '.svg'), svg: clean(readFileSync(file, 'utf8')) }))
  writeFileSync(out, renderPreview(icons))
  console.log(resolve(out))
  return 0
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2))
}
