# Repository Guidelines

## Project structure

This is the personal portfolio website for imomadjid.com, built with TanStack Start, React, TypeScript 7, Vite+, Tailwind CSS v4, and Cloudflare Workers. Keep content accurate and personal. Do not invent projects, experience, achievements, or testimonials.

- `src/routes/` contains file-based routes. `index.tsx` defines `/`; `__root.tsx` defines the document shell and stylesheet link.
- `src/router.tsx` creates the router. `src/routeTree.gen.ts` is generated; do not edit it manually.
- `src/styles.css` imports Tailwind and holds global styles and theme extensions.
- `wrangler.jsonc` configures the Worker. Build output goes to `dist/`.

## Development and validation commands

Use Bun and update `bun.lock` with dependency changes.

- `bun install`: install dependencies and Lefthook hooks.
- `bun run dev`: start the development server on port 3000.
- `bun run build`: build client and server output.
- `bun run preview`: preview the production build locally.
- `bun run format`: format files and sort imports and Tailwind classes.
- `bun run lint:fix`: apply safe Oxlint fixes.
- `bun run check`: check formatting, run type-aware linting, generate routes, and check TypeScript.
- `bun run deploy`: build and deploy to Cloudflare. Run only with deployment authorization.

## Coding style and naming

Use two-space indentation, single quotes, and no semicolons. Let Oxfmt enforce formatting. Use PascalCase for React components and camelCase for functions and variables. Follow TanStack file-based route naming. Use type-only imports where appropriate.

Use Tailwind utilities for styling. Oxfmt sorts classes in JSX and `clsx`, `cn`, `cva`, and `twMerge` calls. Keep Oxfmt, Oxlint, and anti-slop settings in `vite.config.ts`. Do not add Biome. Treat `tools/oxlint/anti-slop/` as vendored code.

## Testing guidelines

No test suite or coverage threshold is configured. Run `bun run check` and `bun run build` before review. Verify UI changes in a browser. Use descriptive `*.test.ts` or `*.test.tsx` names for future tests.

Lefthook checks staged formatting, syntax linting, and React Doctor warnings. Run `bun run doctor` for a full React audit. Fallow is advisory in hooks; Shadscan is a manual advisory. Review findings before changing code. `bun run deps:check` reports updates without applying them.

## Commits and pull requests

There are no commits yet, so no historical convention exists. Use concise imperative messages, optionally prefixed with `feat:`, `fix:`, or `chore:`. Keep changes focused.

PRs should describe the change, link relevant issues, and report validation results. Include screenshots for visible UI changes. Never commit credentials, environment files, or generated build output.
