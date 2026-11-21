import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { wgslVitePlugin } from 'vgpu/client'
import { defineConfig } from 'vite-plus'

import { fluidRegistryFiles } from './tools/fluid-registry-files.ts'

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

// Upstream FF code keeps its own conventions and public API names (ShapeProvider, etc.), so house
// style rules are relaxed there.
const vendoredStyleRules = {
  'anti-slop/no-chained-type-assertions': 'off',
  'anti-slop/no-known-value-widening': 'off',
  'anti-slop/no-runtime-typeof': 'off',
  'anti-slop/no-shape-in-symbol-names': 'off',
  'anti-slop/no-unknown-parameters': 'off',
  'anti-slop/no-unsafe-dictionary-type': 'off',
  'anti-slop/require-safety-comment-for-type-assertion': 'off',
  'unicorn/no-useless-fallback-in-spread': 'off',
  'typescript/no-base-to-string': 'off',
  // NOTE: FF rows and scroll viewports handle keyboard input at the container level.
  'jsx-a11y/click-events-have-key-events': 'off',
  'jsx-a11y/interactive-supports-focus': 'off',
  'jsx-a11y/label-has-associated-control': 'off',
  'jsx-a11y/no-noninteractive-tabindex': 'off',
  'jsx-a11y/no-static-element-interactions': 'off',
  'jsx-a11y/prefer-tag-over-role': 'off',
  // NOTE: False positive on Button's asChild path, which forwards the ref prop via cloneElement.
  'react/refs': 'off',
} as const

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
    overrides: [
      { files: fluidRegistryFiles, rules: vendoredStyleRules },
      // FF's public shape API (ShapeProvider, defaultShape) trips the shape rule where it is used.
      {
        files: ['src/dev/**', 'src/routes/__root.tsx'],
        rules: { 'anti-slop/no-shape-in-symbol-names': 'off' },
      },
    ],
    ignorePatterns: toolingIgnores,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    wgslVitePlugin(),
    // Serve the static homepage as an asset; the Worker still handles unknown URLs.
    tanstackStart({
      // /dev is a local playground that 404s in production builds.
      prerender: {
        enabled: true,
        filter: ({ path }) => path !== '/dev' && !path.startsWith('/dev/'),
      },
    }),
    viteReact(),
  ],
})

export default config
