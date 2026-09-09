# imomadjid.com

Personal portfolio built with TanStack Start, React 19, Tailwind CSS v4, and
Cloudflare Workers. Bun manages dependencies. Vite+ provides Vite, Oxfmt,
Oxlint, and type-aware linting; TypeScript 7 checks application types.

## Development

```bash
bun install           # Install dependencies and Lefthook hooks
bun run dev           # Start on port 3000
bun run build         # Build client and Worker output
bun run preview       # Preview the production build
```

Routes live in `src/routes/`. The root route loads `src/styles.css`, which
imports Tailwind and holds theme variables. Do not edit `src/routeTree.gen.ts`;
the router CLI generates it.

## Quality checks

```bash
bun run format        # Format files; sort imports and Tailwind classes
bun run lint          # Oxlint with type-aware checks and anti-slop rules
bun run lint:fix      # Apply safe lint fixes
bun run typecheck     # Generate routes and run TypeScript 7
bun run check         # Generate routes; check formatting, lint, and types
bun run doctor        # React Doctor; errors block
bun run deadcode      # Fallow unused-code report; findings exit nonzero
bun run audit:code    # Fallow codebase audit
bun run audit:ui      # Shadscan source audit
bun run deps:check    # Taze update report; does not change dependencies
```

For browser overflow checks, start the app and run:

```bash
bun run audit:ui:browser http://localhost:3000
```

Formatting and lint rules live in `vite.config.ts`. Oxfmt sorts Tailwind
classes in JSX and `clsx`, `cn`, `cva`, and `twMerge` calls. All 15 generic
anti-slop rules are enabled. Their vendored source is in
`tools/oxlint/anti-slop/`, copied from the local `install-anti-slop` skill.
Generated files, build output, and this vendor directory are excluded.
Biome is not installed or configured.

Install the recommended Oxc and Tailwind CSS IntelliSense editor extensions
for format-on-save and lint fixes. Keep formatting and lint configuration in
Vite+ rather than adding separate Oxc configuration files.

## Commit hooks

Lefthook runs formatting checks, syntax linting, and React Doctor on staged
files. Doctor warnings block commits. Full type-aware checks remain in
`bun run check` to keep commits fast. Hooks check files without rewriting them
and preserve partially staged changes. Run `bun run format`, then stage the
intended fixes when formatting fails.

Fallow runs as a non-blocking advisory against changes since `HEAD`. It skips
this comparison before the first commit. Shadscan stays a manual advisory;
its findings can describe missing product features rather than defects.
React Doctor telemetry and supply-chain checks are disabled in these scripts.

No test suite, coverage threshold, or CI workflow is configured yet. Run
`bun run check`, `bun run build`, and relevant browser checks before review.

## Deployment

`wrangler.jsonc` configures Cloudflare Workers. With deployment authorization
and Cloudflare authentication, run `bun run deploy`. Store secrets with
Wrangler secret commands, never in source control.
