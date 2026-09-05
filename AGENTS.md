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

**A radial gradient's size percentages are radii, not extents.** `118% 88%`
is an ellipse whose horizontal radius is 1.18 times the element's width — wider
than the element itself, so most of the ramp falls outside it. This has been
misread twice on this project, in both directions: once producing a vignette
that contributes nothing along the left and right edges, once producing an
ambient layer that covered every pixel and flattened the page it was meant to
give depth to. Work out where the stops actually land before tuning them.

**A gradient still descending when it reaches its last stop leaves a visible
edge**, even though no value steps. The eye reads the change in slope, not the
change in level, and on a dark surface a slope break of about one level per
sampled step is enough to see. Ease the tail into its endpoint, and check by
sampling a radial profile rather than by looking for a step.

## Design specs

Every visual surface has a specification in `docs/design/`. Read the one
for the surface you are working on before building it, and build against
it.

If the code and the spec disagree, one of them is a bug. Fix whichever is
wrong rather than working around the difference.

## Viewports

Every surface is built for every window it can be opened in. A phone is not
a later phase of this site; it is the device most people will arrive on.

Do not implement a surface whose narrow-window behaviour its spec does not
cover. That is not permission to invent it — stop and ask, decide it, write
it into `docs/design/`, and then build it. A spec that stops at the desktop
composition is incomplete, and shipping against it produces a page that
overlaps itself on a phone while every check passes.

**320px is the narrowest window supported.** No fixed pixel width above that
may be used without a stated fallback for windows narrower than it. A fixed
width on a flexible element does not overflow — it silently shrinks past its
own clearance, so nothing warns you and no scrollbar appears.

Reflow is the lever, not scale. Nothing is hidden and no type is shrunk to
make a narrow window fit; a group laid out as a row becomes a column — unless
it holds two controls that still fit beside each other, which is a judgement
the surface's spec records rather than a rule applied blindly.

A coarse pointer is a different input, not a smaller cursor. Anything
interactive needs a hit area of at least 44px and a state that responds to a
tap — Tailwind confines `hover:` to devices that hover, so a control with
only a hover state does nothing at all on a phone.

The sizes to verify at are the table in `docs/design/home.md`.

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
npm ci --dry-run
```

Do not report work as complete without running them.

The last one is only relevant when you have added, removed or upgraded a
dependency, and it is the one you will skip and regret. The other four run
against the `node_modules` already installed, where nothing is missing, so none
of them can see a broken lockfile. CI resolves from the lockfile alone and
fails at the install step, before any of the other four get to run.

Installing on top of an existing `node_modules` can silently drop transitive
dependencies of optional packages that do not install on this platform. When
that happens, resolve from scratch rather than patching:

```bash
rm -rf node_modules package-lock.json && npm install
```

Check the diff too. **A change that adds a dependency should only add lines to
`package-lock.json`.** If `git diff main -- package-lock.json` shows packages
being removed, something was pruned unintentionally — do not commit it. If
`npm install` reports that it removed packages you did not ask it to remove,
that is the same signal, and it is not dedupe.

If the change touches layout, also check it at the window sizes in the table
in `docs/design/home.md`, with a coarse pointer as well as a fine one. None
of the five commands above can see a page overlapping itself: the chrome
collided on a phone for as long as it did precisely because all of them were
passing the whole time.

## Measuring the page

Several acceptance criteria here are tonal — contrast, black point, whether a
gradient is traceable, whether the motif still reads against its background.
None of those can be settled by looking at a screenshot and deciding it looks
right, and doing that has produced confidently wrong answers on this project
more than once. Measure them.

The Chrome extension does not connect in this repository. Drive headless Chrome
over the DevTools Protocol from a Node script instead: launch with
`--headless=new --remote-debugging-port=<port>`, read the page target from
`http://127.0.0.1:<port>/json/list`, and connect with Node's global `WebSocket`.
Set the viewport with `Emulation.setDeviceMetricsOverride` rather than
`--window-size`, which reserves space for browser UI and silently gives you a
shorter viewport than you asked for.

To read the composited page, screenshot it and draw the PNG back into a canvas
**inside the page** — the background layers are CSS, so there is nothing else to
sample them from. Luminance is `0.2126R + 0.7152G + 0.0722B` over raw sRGB.
To read the background behind something, hide the thing and screenshot again.

**Assert the page rendered before trusting a number.** A dev server serving an
error overlay screenshots perfectly happily and returns plausible figures. Check
for something that only exists when the page works — `main canvas` will do — and
fail loudly when it is missing.

**Identical results across different inputs mean a broken harness, not a
finding.** A sweep whose rows are all the same is measuring something that is not
responding to the parameter being changed. Find out what before reading a
conclusion into it.

**This shell is zsh, and zsh does not word-split unquoted variables.** A loop
like `for cfg in "1.25 0.05" ...; set -- $cfg` puts the entire string in `$1` and
leaves `$2` empty. That has already written a malformed constant into a source
file, broken the build, and produced a four-row parameter sweep of the Next.js
error page — every row identical, and all of it garbage. Drive parameter sweeps
from Node or Python, where arguments are explicit, rather than from shell loops.

## Reading a ticket

A ticket usually states a value and then states what that value produces. **Re-derive
the second before designing against it.** Three times now the stated consequence has
not followed from the stated formula: a star count whose "roughly 340 survivors"
was arithmetically 157, a magnitude exponent whose "60% below 0.1" was 44%, and a
sequencing claim that turned out backwards. In each case the formula was right and
the prose about it was wrong.

When they disagree, say so in the work and fix the file. Do not quietly implement
one and leave the other standing — the next person reads the prose.

The same applies to a ticket's own scope notes. `home.md` moved on while several
tickets still said behaviour below 1024px was undecided; the tickets were stale,
not the spec.

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
