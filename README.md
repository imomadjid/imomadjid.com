# imomadjid.com

Personal portfolio built with TanStack Start, React 19, Tailwind CSS v4, and
Cloudflare Workers. Bun manages dependencies. Vite+ provides Vite, Oxfmt,
Oxlint, and type-aware linting; TypeScript 7 checks application types.

## AI coding guidance

TanStack Intent loads version-matched Start and Router skills from installed
packages. The allowlist is in `package.json`; loading instructions are in
`AGENTS.md`. Use `bun run intent list` and, for example,
`bun run intent load '@tanstack/react-start#react-start'`.

The script calls the local Intent CLI directly because TanStack Devtools also
provides an `intent` executable. After regenerating guidance with
`bun run intent install`, keep the managed block's commands set to
`bun run intent` to avoid this conflict. No Intent agent hooks are installed.

## Development

```bash
bun install           # Install dependencies and Lefthook hooks
bun run dev           # Start on port 3000
bun run build         # Build client and Worker output
bun run build:dev     # Build dev.imomadjid.com: dev tools on, noindex
bun run preview       # Preview the production build
```

Routes live in `src/routes/`. The root route loads `src/styles.css`, which
imports Tailwind and holds theme variables. Do not edit `src/routeTree.gen.ts`;
the TanStack Start plugin generates it during development and builds. Keep the
generated file committed. After adding or moving routes, run the dev server or
`bun run build` before checking types. Do not run a separate Router CLI against
this file; its output differs from Start's and triggers dev-server reloads.

DialKit tunes the Sunlit background and the Sleep Focus avatar state in the
dev server and on dev.imomadjid.com. `src/routes/index.tsx` reads the controls
through a hook that is chosen at build time by `import.meta.env.DEV_TOOLS`, so
production uses `defaultAmbientSettings` from `src/lib/ambient-settings.ts` and
ships no DialKit code. Change the defaults in `ambientControls`; tuned values
persist only in the browser that tuned them.

Inside `main`, the `dark:` variant follows the renderer's `data-scene-tone`
crossover instead of the instant `.dark` class, so text and inverted marks flip
with the light. Without WebGPU it falls back to `.dark`.

## Quality checks

```bash
bun run format        # Format files; sort imports and Tailwind classes
bun run lint          # Oxlint with type-aware checks and anti-slop rules
bun run lint:fix      # Apply safe lint fixes
bun run typecheck     # Run TypeScript 7
bun run test          # Bun tests; the shader test needs a native WebGPU adapter
bun run check         # Check formatting, lint, and types
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
classes in `className` and in `cn`, `cva`, and `tw` calls; wrap a class string
kept in a constant in `tw` (`src/lib/tw.ts`) so it is sorted too. All 15 generic
anti-slop rules are enabled. Their vendored source is in
`tools/oxlint/anti-slop/`, copied from the local `install-anti-slop` skill.
Generated files, build output, and this vendor directory are excluded.
Biome is not installed or configured.

Install the recommended Oxc and Tailwind CSS IntelliSense editor extensions
for format-on-save and lint fixes. In a Vite+ project the Oxc extension runs
`vp fmt --lsp` and `vp lint --lsp`, so it reads the same `vite.config.ts`.
Keep formatting and lint configuration in Vite+ rather than adding separate
Oxc configuration files, and format through `vp fmt` (`bun run format`): the
bare `oxfmt` binary doesn't read `vite.config.ts` and falls back to its
defaults.

## Fluid Functionalism

`components.json` registers `@fluid`. The installed foundation includes all
eight light/dark surface levels, interaction tokens, `SurfaceProvider`,
`useSurface`, `surfaceClasses`, and `cn`. The root page starts at level 1.
Add UI components on demand with `bunx shadcn@latest add @fluid/base/button --yes`.
Base UI variants follow the project's preferred primitive library.

Follow the surface rules in `AGENTS.md`. Local changes to the upstream helpers
use a closed level type and share normalization between context and CSS classes.
Review these changes before re-installing helpers with overwrite.

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

No test suite or coverage threshold is configured yet. GitHub Actions runs the
formatting, lint, type, React Doctor, and build checks on pull requests and pushes
to `master`. Run
`bun run check`, `bun run build`, and relevant browser checks before review.

## Deployment

`wrangler.jsonc` configures the `imomadjid-com` Cloudflare Worker. The site is
served at `imomadjid.com` and the account's `workers.dev` subdomain.

The current deployment is at https://imomadjid-com.mhmmadjid.workers.dev.
The `imomadjid.com` zone is on Cloudflare's Free plan. Rumahweb delegates DNS to
`bailey.ns.cloudflare.com` and `micah.ns.cloudflare.com`. The Worker custom domain
is configured in `wrangler.jsonc` so deployments preserve it.

The [Check and deploy workflow](.github/workflows/deploy.yml) deploys after all
checks pass on pushes to `master`, and to dev.imomadjid.com on pushes to `dev`.
Pull requests into either branch run checks without deploying. You can also run
the workflow manually on `master` or `dev`.

Configure these GitHub Actions values in the repository settings:

- Secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token scoped to the deployment
  account, with Workers Scripts Edit and Account Settings Read permissions, plus
  Zone Read and Workers Routes Edit scoped to the `imomadjid.com` zone.
- Variable `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.

Use an API token for CI, not a local Wrangler OAuth token. Keep credentials out
of source control. No runtime secrets are required by the portfolio.

For an authorized local deployment, authenticate with Wrangler and run
`bun run deploy`. To roll back, use `bunx wrangler rollback` and select a prior
deployed version. Check `bunx wrangler deployments list` for deployment history.

### Dev site

Pushes to the `dev` branch deploy dev.imomadjid.com, a second Worker
(`imomadjid-com-dev`) from the `dev` environment in `wrangler.jsonc`. It is a
production build with the dev tools on: the `/dev` playground, DialKit, Sleep
Focus, and `?ambientProfile`. It also answers on its own `workers.dev` subdomain.
Every page carries a `noindex` robots meta tag, and static files send
`X-Robots-Tag: noindex`. `robots.txt` still lets crawlers in, because a crawler
that is kept out never reads the noindex and can list a linked URL anyway.

`bun run build:dev` builds it locally (`CLOUDFLARE_ENV=dev`), and
`bun run deploy:dev` deploys it. Wrangler creates the `dev.imomadjid.com` custom
domain and its DNS record on the first deploy, using the same API token. To keep
the site private as well as unindexed, put it behind Cloudflare Access in the
Zero Trust dashboard; the build needs no change for that.

### Dependency audit

On 6 October 2026, `bun audit fix` updated compatible transitive dependencies.
Remaining advisories affect Solid's development tools serializer, Miniflare's
`sharp` and `undici`, and Oxfmt's `tinypool`. Their parents pin affected versions.
The production build removes TanStack Devtools; TanStack's runtime uses patched
`seroval` 1.6.7. No vulnerable Solid serializer is used by the portfolio in
production. Recheck these tool dependencies before updating the build stack.
The dependency audit is not clean; formatting, lint, types, React Doctor, build,
and Wrangler dry-run checks pass.
