import { deepStrictEqual } from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { fluidRegistryFiles } from './fluid-registry-files.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const registry = [...fluidRegistryFiles].sort()

function expandBraces(pattern: string): string[] {
  const match = /\{([^{}]*)\}/.exec(pattern)
  if (!match) return [pattern]
  const [group, options] = match
  return options.split(',').flatMap((option) => expandBraces(pattern.replace(group, option)))
}

// Brace-expands each entry, resolves it against `base`, and lists the existing files it names.
function resolveEntries(base: string, entries: string[]): string[] {
  return entries
    .flatMap(expandBraces)
    .map((entry) => posix.join(base, entry))
    .filter((path) => existsSync(join(root, path)))
    .flatMap((path) =>
      statSync(join(root, path)).isDirectory()
        ? readdirSync(join(root, path), { recursive: true, encoding: 'utf8' })
            .map((file) => posix.join(path, file))
            .filter((file) => statSync(join(root, file)).isFile())
        : [path],
    )
    .sort()
}

function sourceEntries(cssPath: string, directive: string): string[] {
  const css = readFileSync(join(root, cssPath), 'utf8')
  return [...css.matchAll(new RegExp(`^${directive} '([^']+)';`, 'gm'))].map(([, entry]) => entry)
}

void test('production CSS excludes exactly the registry files', () => {
  // ./dev is the playground itself, not registry code.
  const entries = sourceEntries('src/styles.css', '@source not').filter((e) => e !== './dev')
  deepStrictEqual(resolveEntries('src', entries), registry)
})

void test('dev CSS scans exactly the registry files', () => {
  const entries = sourceEntries('src/dev/dev.css', '@source').filter((e) => e !== './')
  deepStrictEqual(resolveEntries('src/dev', entries), registry)
})

void test('React Doctor ignores every registry file', () => {
  const config = JSON.parse(readFileSync(join(root, 'doctor.config.json'), 'utf8'))
  const ignored: string[] = config.ignore.files.filter((path: string) => path.startsWith('src/'))
  deepStrictEqual(ignored.filter((path) => path !== 'src/routeTree.gen.ts').sort(), registry)
})

void test('every registry file exists', () => {
  deepStrictEqual(
    registry.filter((path) => !existsSync(join(root, path))),
    [],
  )
})

void test('fallow hides findings for every registry file', () => {
  const config = JSON.parse(readFileSync(join(root, '.fallowrc.json'), 'utf8'))
  const hidden: string[] = config.ignoreFindings
  deepStrictEqual([...hidden].sort(), registry)
})
