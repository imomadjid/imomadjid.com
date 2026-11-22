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
- Allo is upstream's unmodified variable Friendly webfont from v1.0.3 (`public/fonts/allo/AlloVariableFriendly.woff2`: weight 100 to 900, optical size 9 to 32, no roundness axis). Any weight works and weight changes animate, so use `font-*` weights rather than faking bold. Its 400 matches the static Regular it replaced.
- DialKit, the Sleep Focus particles, and the `?ambientProfile` renderer timer are dev tools. Keep them behind `import.meta.env.DEV_TOOLS` so production bundles exclude them. The `dev-tools` plugin in `vite.config.ts` sets it: true in the dev server and in the dev.imomadjid.com build (`CLOUDFLARE_ENV=dev`), false in production builds. Don't gate dev tools on `import.meta.env.DEV`, which is false on the dev site. `src/env.d.ts` declares it.
- `/dev` is a playground served by the dev server and dev.imomadjid.com: route files in `src/routes/dev/` gate `head` and `component` on `import.meta.env.DEV_TOOLS` and lazy-load pages from `src/dev/`; production throws `notFound()` and the prerender filter skips `/dev`. Add test pages to `src/dev/pages.ts`.
- The Sunlit canvas is fixed to the viewport: the light comes through a window, so it stays put while the page scrolls past. Anything that casts a shadow into it scrolls with the page, so it publishes its geometry in the canvas's frame, not `main`'s, and republishes on scroll. The wand does this in `src/components/blind-wand-engine.ts` (`frameLight`, `follow`) through `wandPose` in `src/lib/sunlit-scene.ts`; the shader reads that pose as is.
- The homepage's `sections` list in `src/routes/index.tsx` names its sections once: `<Section id>` renders each one's `id` and screen-reader heading, and `TableOfContents` (`src/components/table-of-contents.tsx`) lists them, fixed to the left from `lg` up, and render nothing with fewer than two sections. The whole original page (avatar row, intro, signature, and contact links) is the `about` section, which fills the first screen with `min-h-svh`. A section's `mark` replaces its visible label in the contents, which screen readers still announce; About's is the `Logo` (`src/components/logo.tsx`, the favicon's mark in `currentColor`). The logo is drawn as stroked centre-lines, so its stroke width is its weight: 12 (the favicon's outline) when active, 9.34 when inactive. The active link turns semibold, and the 2.66-unit difference is the 0.55px stem gain from 400 to 600 at 14px, so text and mark change weight together. Add or rename a section in that list. The contents are hidden below `lg` until a mobile design exists. The `draftSections` there render only with `DEV_TOOLS`, so production never shows them: Random bullshit (`projects`, a `ProjectList` of public repos in `src/components/project-list.tsx`, each linking to its live site or else its repo), then Gallery and Guestbook, which are still empty stand-ins. Move a section into the production list once it's ready, and don't fill the stand-ins with invented content.
- Static glass (Button's `glass="static"`, the homepage `LinkButton`) shares the surface classes in `src/lib/glass.ts`; the layer stack is the `glass-surface` utility in `src/theme.css`, drawing from `--glass-fill` and `--glass-shadow` in `src/styles.css`. The light values are fitted to two iOS 26 captures at 3x, on white and on `#f2f1f6` (`/dev/glass` holds both reference frames); a single white backdrop cannot separate fill color from opacity, so refit against both. The dark values are fitted the same way on `#1c1c1e` and black. Dark glass is near-additive light, so keep it a white alpha fill: `mix-blend-mode: plus-lighter` breaks under the buttons' `isolate`.
- `wrangler.jsonc` configures the Worker. Build output goes to `dist/`. Start prerenders `/` into a static asset; the Worker handles other URLs, including the 404. `public/_headers` sets asset caching.
- Its `dev` environment is a second Worker, `imomadjid-com-dev`, on dev.imomadjid.com. `bun run build:dev` builds it (`CLOUDFLARE_ENV=dev`), with the dev tools on and the site kept out of search: every page has `<meta name="robots" content="noindex">`, and the `dev-tools` plugin appends `X-Robots-Tag: noindex` to the built `_headers` and drops the sitemap from `robots.txt`. Keep `robots.txt` allowing crawlers there, or they never see the noindex. The built `dist/server/wrangler.json` records the environment, so deploy it with `--config`, as `bun run deploy:dev` does.
- `tint-*` (`src/theme.css`) colors Buttons like SwiftUI's `.tint()`: `tint-red-500`, `tint-blue-100`, arbitrary values. No opacity modifier (a translucent tint reads as disabled); use a lighter palette step instead. It sets `--btn-tint*` variables, so it cascades to nested Buttons; primary fills with it, glass lays it between `--glass-fill` and a soft-light edge shine, and the label turns white below oklch L 0.75. Don't use `bg-*` for Button color: the fill is an inner span. `cn` doesn't merge two `tint-*` classes (registering a group needs `cn/config`, +45 KB JS), so pass one.
- `tools/glass-tints/` is a SwiftUI fixture (iOS and macOS 26+) rendering Liquid Glass tinted with Tailwind colors converted to Display P3. Generate with `xcodegen generate` there. `capture.sh` takes lossless 3x PNGs from an iOS 27 simulator named `GlassTints` (iPhone 16 Pro) into `<dir>/ref`; `shoot.sh` renders `/dev/glass` at 3x into `<dir>/web`; `tintdiff.py` diffs the tinted reference frames per region. Fit against simulator captures, not macOS: macOS glass can differ, and inactive macOS windows desaturate it. Simulator glass is close to, but not the same as, the iOS 26 device captures behind untinted glass, so tinted fits are relative to plain glass.
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

Tests use `bun test` (`bun run test`). CI runs only `src/components` and `src/lib` tests and `tools/fluid-registry-files.test.ts` because the shader test needs a native WebGPU adapter. No coverage threshold is configured. For implementation changes, run `bun run check`, `bun run test`, and `bun run build` before review. Verify UI changes in a browser. For documentation-only changes, check formatting and verify affected instructions against the repository. A read-only audit does not require a build unless needed to investigate a finding. Use descriptive `*.test.ts` or `*.test.tsx` names for future tests.

Run `bun run doctor` when the task requests a full React audit or a React-related finding needs broader investigation. The full audit blocks errors; staged React Doctor warnings block commits. Review advisory findings before changing code. See `README.md` for hook and advisory tool details.

## Commits and pull requests

Use concise imperative messages with `feat:`, `fix:`, or `chore:` prefixes. Keep changes focused.

Commit to `master` directly. Pushing `master` runs `.github/workflows/deploy.yml`, which deploys production, so push only with deployment authorization. Pushing `dev` runs the same checks and deploys dev.imomadjid.com instead; it needs the same authorization. To preview work there, commit it to `dev` and push; merge `dev` into `master` to release it.

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
- `src/theme.css` holds the shared dark variant and `@theme` mappings. `src/dev/dev.css` references it; it must not reference `src/styles.css`, or that sheet's `@source not` rules apply to the dev scan. `src/dev/dev.css` puts its utilities in the same `utilities` layer and scans every source, not only the playground, so it is a complete, ordered utility set that wins over `src/styles.css` on `/dev`; narrowing that scan lets its plain utilities override variants only `styles.css` emits.

The root provides level 1 and paints `bg-surface-1`. Surface colors and shadows live in `src/styles.css`; light mode uses shadows above white surfaces, while dark mode also increases background brightness. Activate dark tokens with `.dark` on `<html>`.

- Read the parent level with `useSurface()` from `#/lib/surface-context`. For custom overlays, use `normalizeSurfaceLevel(parent + offset)` from `#/lib/surface-classes`: menus/popovers use `+2`, dialogs use `+4`, capped at 8.
- Paint the container with `surfaceClasses(level)` and wrap its children in `<SurfaceProvider value={level}>`. Context alone does not paint a background. Preserve this context through portals.
- Keep FF components' existing elevation logic. Do not add a second offset around them.
- Use `surfaceClasses(level, shadowLevel)` when a component deliberately keeps its shadow depth separate. Avoid arbitrary background colors or shadows for elevated panels.
- Never interpolate `bg-surface-${level}` or `shadow-surface-${level}`. Use the literal lookup helpers so Tailwind emits the classes. Use `bg-hover` and `bg-active` for interaction overlays.
- Check nested surfaces in light and dark modes, including focus and clipping. See [upstream surface rules](https://www.fluidfunctionalism.com/docs/surfaces).
