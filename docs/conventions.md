# Code conventions

How code in this repository is organised and written. These apply to every change.
Where the current code departs from a rule, the departure is recorded in the relevant
[codebase map](../codebase-map/README.md) rather than here.

## Structure

```
src/
  app/           Routes only. A folder is a URL segment; (stage) is a route group.
  components/    One folder per surface, named after it (chrome, globe, home, marketplace,
                 stage, starfield).
    ui/          Generic primitives, once one exists.
  content/       Page copy, as typed objects.
  lib/           TypeScript modules that are not React components.
scripts/         Build-time tools, run through npm scripts.
public/          Static assets.
```

- Create a folder when its first file needs it. Do not create empty folders.
- A surface gets its own folder under `components/` when it is built.
- A component moves into `ui/` on its second use, not its first.
- `lib/` holds non-component modules, including rendering and animation engines: they
  are handed a canvas, own their own loop, and contain no JSX.
- Dependencies point one way. Surface folders may import from `ui/` and `lib/`. `ui/`
  may not import from a surface folder or reference pQuadrant copy or branding. Engines
  in `lib/` import nothing from `components/`.
- Do not create a global `src/types/` folder. Component prop types live in the component
  file; shared content types live in `src/content/types.ts`.
- Generated files say so in their header and are never edited by hand
  (`src/lib/globe/point-set.generated.ts`).

## Naming

- Components: PascalCase, matching the export. `TopRightCluster.tsx` exports
  `TopRightCluster`. One component per file.
- Everything else: kebab-case (`chrome-clearance.ts`, `home.ts`).
- Route folders: lowercase.
- Import through the `@/` alias, never with relative paths that climb (`../../`).

## Content

All user-facing copy lives in `src/content/`, as typed TypeScript objects. Components
receive it as props or import it. A sentence in JSX is a bug:

```tsx
// Wrong
<p>Pick the job you need done.</p>

// Right
<p>{content.subline}</p>
```

Glyphs that are presentation rather than language (an arrow, a divider) may live in the
component, marked `aria-hidden`.

## Styling

- Tailwind utility classes only. No CSS modules, no styled-components, no inline `style`
  props in markup. Setting a custom property from script when the value only exists at
  runtime (as `StageShell` and `MarketplacePanel` do) is not an inline style prop.
- `src/app/globals.css` holds the Tailwind import, design tokens, custom variants, and
  the base rules that apply to an element because of what it is.
- **Do not add `cursor-pointer`.** A base rule in `globals.css` gives a pointer to
  `button`, `a[href]`, `[role="button"]`, button-like inputs and `summary`, excluding
  anything disabled. A control that needs a different cursor is a change to that rule.
- **Hover is not a tap.** Tailwind emits `hover:` only for devices that hover, so give
  every control an `active:` state as well. Use `focus-visible:` for the focus ring.
- **A radial gradient's size percentages are radii, not extents.** `118% 88%` is an
  ellipse whose horizontal radius is 1.18 times the element's width, so most of its ramp
  falls outside the element. This has been misread on this project in both directions.
  Work out where the stops land before tuning them.
- **A gradient still descending at its last stop leaves a visible edge**, even though no
  value steps: the eye reads the change in slope. Ease the tail into its endpoint, and
  check with a sampled radial profile, not by eye.
- Colours and dimensions that the design reuses are tokens. Values that a canvas engine
  needs are read from tokens at runtime rather than duplicated in TypeScript.

## Interaction and windows

- The narrowest supported window is 320px wide. A fixed pixel width above that needs a
  stated fallback: on a flexible element it shrinks silently rather than overflowing.
- Interactive elements need a hit area of at least 44px on coarse pointers.
- Navigation that leaves the page or changes route is a real link (`<a href>` or
  `next/link`), not a click handler.
- How a surface behaves on narrow, short or touch windows is a product decision. When
  the current behaviour does not settle it, ask before building.

## Images and media

- Raster images go through `next/image`, never a raw `<img>`, with `alt` text. Use WebP
  or AVIF for stills, and muted looping video for motion, never GIF.
- SVG is written inline in the component that uses it. Do not route SVG through
  `next/image`; that needs `dangerouslyAllowSVG`, which stays off.

## Dependencies

Do not add, remove or upgrade a package without asking first, including animation
libraries, icon sets, UI kits and utilities. Explain what it solves and what it costs.
Prefer CSS over a library for animation. The lockfile procedure is in
[verification](verification.md#dependencies-and-the-lockfile).
