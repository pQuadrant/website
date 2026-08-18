# pQuadrant website — agent rules

Marketing website. Next.js 16 (App Router), TypeScript, Tailwind 4.

## Before writing code

Propose a plan first: files you will change, what each change does, and any
new dependency. Wait for approval. Do not start editing on the first
message.

If two attempts fail to fix a problem, stop. Say so. Do not stack a third
fix on top of two failed ones.

## Structure

src/
app/ Routes only. A folder is a URL segment.
components/
ui/ Generic primitives. No pQuadrant-specific content.
layout/ Header, Footer, Nav.
sections/ Full-width page sections. Hero, FeatureGrid, CTA.
content/ Page copy. One file per page.
lib/ Shared utilities.
public/ Static assets.

Create a folder when its first file needs it. Do not create empty folders.

Dependencies point one way: `sections` may import from `ui` and `layout`.
`ui` may not import from `sections`, and may not reference pQuadrant
copy or branding.

## Naming

- Components: PascalCase, matching the export. `Hero.tsx` exports `Hero`.
- Everything else: kebab-case. `site-config.ts`, `home.ts`.
- Route folders: lowercase. `about/`, `contact/`.
- One component per file.
- Import via the `@/` alias, never relative paths that climb (`../../`).

## Content

All copy lives in `src/content/`, as typed TypeScript objects. Pages and
components receive content as props or import it directly.

Never put user-facing text in a `.tsx` file. If a sentence appears in JSX,
that is a bug.

```tsx
// Wrong
<h1>Improve your realized revenue</h1>

// Right
<h1>{content.hero.heading}</h1>
```

## Styling

Tailwind utility classes only. No CSS modules, no styled-components, no
inline `style` props. `globals.css` holds Tailwind directives and design
tokens only.

## Types

Component prop types live in the component file. Shared content types live
in `src/content/types.ts`. Do not create a global `src/types/` folder.

## Dependencies

Do not install a package without asking first. This includes animation
libraries, icon sets, UI kits, and utility libraries. Explain what problem
it solves and what it costs before adding it.

Prefer CSS over a library for animation.

## Images and media

Use `next/image`, not raw `<img>`. Images must have `alt` text. Use WebP or
AVIF for stills. Use muted looping video for motion — never GIF.

## Before saying you are done

Run these and confirm they pass:

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

Do not report work as complete without running them.

## Testing

There is no test framework yet, deliberately — the site has no logic worth
testing. When the first real function appears (form validation, a content
helper), add Vitest and test it. Do not add a test framework before then.

## Scope

Change only what the task asks for. Do not refactor unrelated code, rename
things, or "clean up" files you were not asked to touch. If you notice a
problem outside scope, mention it and leave it alone.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
