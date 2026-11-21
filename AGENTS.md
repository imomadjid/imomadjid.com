<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `bun run intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bun run intent load '<package>#<skill>'` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# Repository Guidelines

## Project structure

This is the personal portfolio website for imomadjid.com, built with TanStack Start, React, TypeScript 7, Vite+, Tailwind CSS v4, and Cloudflare Workers. Keep content accurate and personal. Do not invent projects, experience, achievements, or testimonials.

- `src/routes/` contains file-based routes. `index.tsx` defines `/`; `__root.tsx` defines the document shell and stylesheet link.
- `src/router.tsx` creates the router. Start generates `src/routeTree.gen.ts` during development and builds. Keep it committed; do not edit it manually or run a separate Router CLI against it.
- `src/styles.css` imports Tailwind and holds global styles and theme extensions. Its `dark` variant follows `data-scene-tone` inside the Sunlit scene; do not override text colors with unlayered CSS.
- DialKit and the Sleep Focus particles are development-only. Keep them behind `import.meta.env.DEV` so production bundles exclude them.
- `wrangler.jsonc` configures the Worker. Build output goes to `dist/`.

## Development and validation commands

Use Bun and update `bun.lock` with dependency changes. See `README.md` and `package.json` for commands. Run `bun run deploy` only with deployment authorization.

## Coding style and naming

Let Oxfmt enforce formatting. Use PascalCase for React components and camelCase for functions and variables. Follow TanStack file-based route naming. Use type-only imports where appropriate.

Use Tailwind utilities for styling. Keep Oxfmt, Oxlint, and anti-slop settings in `vite.config.ts`. Do not add Biome. Treat `tools/oxlint/anti-slop/` as vendored code.

## Testing guidelines

Tests use `bun test` (`bun run test`). CI runs only `src/components` tests because the shader test needs a native WebGPU adapter. No coverage threshold is configured. For implementation changes, run `bun run check`, `bun run test`, and `bun run build` before review. Verify UI changes in a browser. For documentation-only changes, check formatting and verify affected instructions against the repository. A read-only audit does not require a build unless needed to investigate a finding. Use descriptive `*.test.ts` or `*.test.tsx` names for future tests.

Run `bun run doctor` when the task requests a full React audit or a React-related finding needs broader investigation. The full audit blocks errors; staged React Doctor warnings block commits. Review advisory findings before changing code. See `README.md` for hook and advisory tool details.

## Commits and pull requests

Use concise imperative messages with `feat:`, `fix:`, or `chore:` prefixes. Keep changes focused.

PRs should describe the change, link relevant issues, and report validation results. Include screenshots for visible UI changes. Never commit credentials, environment files, or generated build output.

## Fluid Functionalism surfaces

FF is a copy-in registry configured in `components.json`. Add components only when needed: `bunx shadcn@latest add @fluid/base/button --yes`. Prefer the Base UI variants (`@fluid/base/<name>`). Review source and dependencies before installation; do not overwrite local adaptations blindly.

The root provides level 1 and paints `bg-surface-1`. Surface colors and shadows live in `src/styles.css`; light mode uses shadows above white surfaces, while dark mode also increases background brightness. Activate dark tokens with `.dark` on `<html>`.

- Read the parent level with `useSurface()` from `#/lib/surface-context`. For custom overlays, use `normalizeSurfaceLevel(parent + offset)` from `#/lib/surface-classes`: menus/popovers use `+2`, dialogs use `+4`, capped at 8.
- Paint the container with `surfaceClasses(level)` and wrap its children in `<SurfaceProvider value={level}>`. Context alone does not paint a background. Preserve this context through portals.
- Keep FF components' existing elevation logic. Do not add a second offset around them.
- Use `surfaceClasses(level, shadowLevel)` when a component deliberately keeps its shadow depth separate. Avoid arbitrary background colors or shadows for elevated panels.
- Never interpolate `bg-surface-${level}` or `shadow-surface-${level}`. Use the literal lookup helpers so Tailwind emits the classes. Use `bg-hover` and `bg-active` for interaction overlays.
- Check nested surfaces in light and dark modes, including focus and clipping. See [upstream surface rules](https://www.fluidfunctionalism.com/docs/surfaces).
