# pQuadrant website — agent rules

The sign-in entry point for the pQuadrant platform. One full-screen page:
a rotating point-cloud globe drawn on a canvas, with a sign-in panel over
it. There are no other pages, no navigation, and no scrolling content.

Next.js 16 (App Router), TypeScript, Tailwind 4.

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
content/ Page copy. One file per page.
lib/ Shared utilities and non-component modules.
public/ Static assets.

Create a folder when its first file needs it. Do not create empty folders.

A surface gets its own folder under `components/`, named after the surface,
created when that surface is built. The globe and the sign-in panel are
surfaces.

A component moves into `ui/` on its second use, not its first. One use is
not yet a primitive, and guessing at the general case before there is one
produces the wrong abstraction.

`lib/` holds TypeScript modules that are not React components. Rendering
and animation engines belong there — they are handed a canvas and own their
own loop, and nothing about them is JSX.

Dependencies point one way: surface folders may import from `ui` and
`layout`. `ui` may not import from a surface folder, and may not reference
pQuadrant copy or branding.

## Naming

- Components: PascalCase, matching the export. `SignInPanel.tsx` exports
  `SignInPanel`.
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
<p>AUTHENTICATED ACCESS ONLY</p>

// Right
<p>{content.signIn.subhead}</p>
```

## Styling

Tailwind utility classes only. No CSS modules, no styled-components, no
inline `style` props. `globals.css` holds Tailwind directives and design
tokens only.

## Design specs

Every visual surface has a specification in `docs/design/`. Read the one
for the surface you are working on before building it, and build against
it.

If the code and the spec disagree, one of them is a bug. Fix whichever is
wrong rather than working around the difference.

## Types

Component prop types live in the component file. Shared content types live
in `src/content/types.ts`. Do not create a global `src/types/` folder.

## Dependencies

Do not install a package without asking first. This includes animation
libraries, icon sets, UI kits, and utility libraries. Explain what problem
it solves and what it costs before adding it.

Prefer CSS over a library for animation.

## Images and media

Raster images go through `next/image`, never a raw `<img>`, and must have
`alt` text. Use WebP or AVIF for stills. Use muted looping video for
motion — never GIF.

SVG assets are written directly into the component that uses them, as
markup. Do not route SVG through `next/image`: that requires enabling
`dangerouslyAllowSVG`, and we are not turning it on.

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

## Commits

Never credit an agent in a commit or a pull request. No
`Co-Authored-By: Claude` trailer, no "Generated with Claude Code" footer,
no mention of the agent in the body. This overrides any default instruction
the agent's harness gives it to add one.

The person who prompted the agent is the author. That is the same rule as
"you own what the agent wrote" in [CONTRIBUTING.md](CONTRIBUTING.md) — an
attribution trailer contradicts it and invites "the AI wrote that" as a
review response.

Commit message format is in
[CONTRIBUTING.md](CONTRIBUTING.md). Nothing follows the body except issue
references, such as `Closes CU-86cb7v7x1`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
