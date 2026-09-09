import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'

const toolingIgnores = [
  'src/routeTree.gen.ts',
  'dist/**',
  '.tanstack/**',
  '.wrangler/**',
  '.fallow/**',
  'tools/oxlint/anti-slop/**',
  '.agent/**',
  '.agents/**',
  '.claude/**',
  '.codex/**',
  '.continue/**',
  '.cursor/**',
  '.gemini/**',
  '.opencode/**',
  '.pi/**',
  '.roo/**',
  '.windsurf/**',
]

const config = defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    sortImports: {},
    sortTailwindcss: {
      stylesheet: './src/styles.css',
      functions: ['clsx', 'cn', 'cva', 'twMerge'],
    },
    ignorePatterns: [...toolingIgnores, 'bun.lock'],
  },
  lint: {
    options: {
      typeAware: process.env.PORTFOLIO_STAGED_LINT !== '1',
      typeCheck: process.env.PORTFOLIO_STAGED_LINT !== '1',
    },
    plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y', 'import'],
    categories: { correctness: 'error' },
    jsPlugins: [{ name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' }],
    rules: {
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'warn',
      'typescript/no-floating-promises': 'error',
      'typescript/no-misused-promises': 'error',
      'typescript/consistent-type-imports': 'error',
      'import/no-duplicates': 'error',
      'oxc/no-accumulating-spread': 'error',
      'anti-slop/no-chained-type-assertions': 'error',
      'anti-slop/no-conditional-empty-object-spread': 'error',
      'anti-slop/no-known-value-widening': 'error',
      'anti-slop/no-module-mocking': 'error',
      'anti-slop/no-object-parameters': 'error',
      'anti-slop/no-reflect-apply': 'error',
      'anti-slop/no-reflect-get': 'error',
      'anti-slop/no-runtime-typeof': 'error',
      'anti-slop/no-shape-in-symbol-names': 'error',
      'anti-slop/no-unknown-parameters': 'error',
      'anti-slop/no-unknown-returns': 'error',
      'anti-slop/no-unknown-type-aliases': 'error',
      'anti-slop/no-unsafe-dictionary-type': 'error',
      'anti-slop/no-widen-then-assert': 'error',
      'anti-slop/require-safety-comment-for-type-assertion': 'error',
    },
    ignorePatterns: toolingIgnores,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
