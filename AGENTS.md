<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `bun run intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bun run intent load '<package>#<skill>'` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

Claude Code also loads the `userinterface-wiki` skill from `.claude/skills/`, which covers UI audio, sound synthesis, animation, and typography rules. It is pinned in `skills-lock.json` with the other local skills; treat it as vendored and update it with `bunx skills update userinterface-wiki`.

# Repository Guidelines

## Project structure

This is the personal portfolio website for imomadjid.com, built with TanStack Start, React, TypeScript 7, Vite+, Tailwind CSS v4, and Cloudflare Workers. Keep content accurate and personal. Do not invent projects, experience, achievements, or testimonials.

- `src/routes/` contains file-based routes. `index.tsx` defines `/`; `__root.tsx` defines the document shell and stylesheet link.
- `src/router.tsx` creates the router. Start generates `src/routeTree.gen.ts` during development and builds. Keep it committed; do not edit it manually or run a separate Router CLI against it.
- `src/styles.css` imports Tailwind and holds global styles and theme extensions. Its `dark` variant follows `data-scene-tone` inside the Sunlit scene; do not override text colors with unlayered CSS.
- DialKit and the Sleep Focus particles are development-only. Keep them behind `import.meta.env.DEV` so production bundles exclude them.
- `/dev` is a local playground: route files in `src/routes/dev/` gate `head` and `component` on `import.meta.env.DEV` and lazy-load pages from `src/dev/`; production throws `notFound()` and the prerender filter skips `/dev`. Add test pages to `src/dev/pages.ts`.
- Static glass (Button's `glass="static"`, the homepage `LinkButton`) shares the surface classes in `src/lib/glass.ts` and draws from `--glass-fill` and `--glass-shadow` in `src/styles.css`. The light values are fitted to two iOS 26 captures at 3x, on white and on `#f2f1f6` (`/dev/glass` holds both reference frames); a single white backdrop cannot separate fill color from opacity, so refit against both. The dark values are fitted the same way on `#1c1c1e` and black. Dark glass is near-additive light, so keep it a white alpha fill: `mix-blend-mode: plus-lighter` breaks under the buttons' `isolate`.
- `wrangler.jsonc` configures the Worker. Build output goes to `dist/`. Start prerenders `/` into a static asset; the Worker handles other URLs, including the 404. `public/_headers` sets asset caching.
- Shaders are `.wgsl` modules loaded by vgpu's `wgslVitePlugin`; `bunfig.toml` preloads `tools/bun-wgsl-loader.js` so Bun tests can import them. vgpu render targets need whole-pixel sizes.

## Development and validation commands

Use Bun and update `bun.lock` with dependency changes. Node 26 is pinned in `.node-version` (fnm, CI) and `engines`; keep `@types/node` on the same major. See `README.md` and `package.json` for commands. Run `bun run deploy` only with deployment authorization.

## Coding style and naming

Let Oxfmt enforce formatting. Use PascalCase for React components and camelCase for functions and variables. Follow TanStack file-based route naming. Use type-only imports where appropriate.

Use Tailwind utilities for styling. Keep Oxfmt, Oxlint, and anti-slop settings in `vite.config.ts`. Do not add Biome. Treat `tools/oxlint/anti-slop/` as vendored code.

## Icons

- **Utility icons** (arrows, chevrons, close, external link, copy, menu): use Tabler via `@tabler/icons-react`. It isn't installed right now; add it with `bun add @tabler/icons-react` when the first one is needed.
- **Decorative or unconventional icons** (theme toggle, feature accents, anything the page features rather than just labels): draw Fill Duo icons with the `duotone-icons` skill in `.agents/skills/duotone-icons` (source: `imomadjid/duotone-icons`). Load the skill before drawing, and run its `lint.mjs` and `preview.mjs` scripts on the result. Put the icons next to their component, following `src/components/theme-icons.tsx`.
- Don't mix the two styles in one control. Size Tabler icons to match the Fill Duo 18px grid wherever they sit side by side.
- Restore or update local skills with `bunx skills experimental_install` and `bunx skills update`; `skills-lock.json` pins the source commit.

## Testing guidelines

Tests use `bun test` (`bun run test`). CI runs only `src/components` tests and `tools/fluid-registry-files.test.ts` because the shader test needs a native WebGPU adapter. No coverage threshold is configured. For implementation changes, run `bun run check`, `bun run test`, and `bun run build` before review. Verify UI changes in a browser. For documentation-only changes, check formatting and verify affected instructions against the repository. A read-only audit does not require a build unless needed to investigate a finding. Use descriptive `*.test.ts` or `*.test.tsx` names for future tests.

Run `bun run doctor` when the task requests a full React audit or a React-related finding needs broader investigation. The full audit blocks errors; staged React Doctor warnings block commits. Review advisory findings before changing code. See `README.md` for hook and advisory tool details.

## Commits and pull requests

Use concise imperative messages with `feat:`, `fix:`, or `chore:` prefixes. Keep changes focused.

Commit to `master` directly. Pushing `master` runs `.github/workflows/deploy.yml`, which deploys production, so push only with deployment authorization.

PRs should describe the change, link relevant issues, and report validation results. Include screenshots for visible UI changes. Never commit credentials, environment files, or generated build output.

## Fluid Functionalism surfaces

FF is a copy-in registry configured in `components.json`. Add components only when needed: `bunx shadcn@latest add @fluid/base/button --yes`. Prefer the Base UI variants (`@fluid/base/<name>`). Review source and dependencies before installation; do not overwrite local adaptations blindly.

- Keep the local `src/lib/utils.ts`, `surface-classes.ts`, and `surface-context.tsx`; restore them after `--overwrite`.
- The shadcn CLI mangles `src/styles.css` (self-referencing vars, keyframes inside `@theme`) and may rewrite `src/lib/utils.ts` or re-add `clsx`/`tailwind-merge`. Review the diff, merge tokens by hand, and keep `cn` re-exported from the `cn` package.
- FF's `src/lib/icon-context.tsx` and the `/dev` fixtures use `lucide-react`. Keep it to those files; production UI follows the icon rules above.
- `cn` resolves conflicts with tailwind-merge's default groups, so it reads the custom `text-display`/`text-title`/`text-body`/... sizes as text colors and drops one of them next to a color. Pass those through plain strings, or use the `text-[length:...]` forms in `src/lib/type-scale.ts`.
- FF components read neutral shadcn roles (`foreground`, `muted-foreground`, `border`, ...) defined in `src/styles.css`.
- The site uses FF's `pill` shape, set once by `<ShapeProvider defaultShape="pill">` in `__root.tsx`. FF components read it from context; no CSS reads the `--shape-input-radius` property the provider writes, and the base `:focus-visible` outline follows each element's own corners. The `/dev/components` shape switcher previews other shapes at runtime only.
- Add new FF registry files to `fluidRegistryFiles` in `tools/fluid-registry-files.ts` (`vite.config.ts` relaxes anti-slop rules there only), to `ignore.files` in `doctor.config.json`, to `ignoreFindings` in `.fallowrc.json`, and to the matching `@source` lists in `src/styles.css` (excluded) and `src/dev/dev.css` (scanned). `tools/fluid-registry-files.test.ts` fails if those lists drift. When a production page starts rendering an FF component, also move the runtime CSS it needs (spinner keyframes, `.scroll-fade`, `.scroll-divider`) from `src/dev/dev.css` into `src/styles.css`. `dev.css` links only under `/dev`, so site pages in dev show production CSS. Production CSS skips the playground and FF components; remove a file from the `@source not` list once a production page renders it.
- `src/theme.css` holds the shared dark variant and `@theme` mappings. `src/dev/dev.css` references it; it must not reference `src/styles.css`, or that sheet's `@source not` rules apply to the dev scan.

The root provides level 1 and paints `bg-surface-1`. Surface colors and shadows live in `src/styles.css`; light mode uses shadows above white surfaces, while dark mode also increases background brightness. Activate dark tokens with `.dark` on `<html>`.

- Read the parent level with `useSurface()` from `#/lib/surface-context`. For custom overlays, use `normalizeSurfaceLevel(parent + offset)` from `#/lib/surface-classes`: menus/popovers use `+2`, dialogs use `+4`, capped at 8.
- Paint the container with `surfaceClasses(level)` and wrap its children in `<SurfaceProvider value={level}>`. Context alone does not paint a background. Preserve this context through portals.
- Keep FF components' existing elevation logic. Do not add a second offset around them.
- Use `surfaceClasses(level, shadowLevel)` when a component deliberately keeps its shadow depth separate. Avoid arbitrary background colors or shadows for elevated panels.
- Never interpolate `bg-surface-${level}` or `shadow-surface-${level}`. Use the literal lookup helpers so Tailwind emits the classes. Use `bg-hover` and `bg-active` for interaction overlays.
- Check nested surfaces in light and dark modes, including focus and clipping. See [upstream surface rules](https://www.fluidfunctionalism.com/docs/surfaces).
