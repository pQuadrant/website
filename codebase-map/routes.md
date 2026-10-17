# Routes

Owns the two routes, `/` (home) and `/marketplace`, and everything that changes between
them: how the page knows which route it is on, the globe's move, the fades of each
route's content, the ways between routes, and focus. The marketplace is a deployed,
evolving feature whose product design is unfinished; its implementation currently lives
in `src/spike/` (see [status](#status-of-the-spike-folder)). Its copy, and the intended
platform data, are in [content](content.md#marketplace-copy-and-platform-data).

## Route structure

- [src/app/(stage)/layout.tsx](<../src/app/(stage)/layout.tsx>) mounts `StageShell` for
  the route group, so it persists across navigation.
- [src/app/(stage)/page.tsx](<../src/app/(stage)/page.tsx>) and
  [marketplace/page.tsx](<../src/app/(stage)/marketplace/page.tsx>) return `null`. They
  exist for the URLs; all visible content is in the persistent stage.
- [src/spike/StageShell.tsx](../src/spike/StageShell.tsx), `StageShell`, derives
  `mode` from `usePathname()`: `"market"` when the path starts with `/marketplace`,
  otherwise `"home"`. Every route-dependent component takes `mode` as a prop and styles
  on `data-mode`. The type is `StageMode` in
  [starfield-points.ts](../src/lib/starfield/starfield-points.ts), although it is not a
  starfield concept.
- Because nothing remounts, marketplace scroll position and search text survive a trip
  home and back. The pull gesture resets on each visit.
- A deep link to `/marketplace` opens in place. `StageShell` sets `data-ready` on the
  motif wrapper only after the first scale is measured, so the globe starts small
  rather than animating from full size.

## Route content

Rendered by `StageShell` as children of `Stage`, all mounted on both routes and faded
by `mode`:

| Component                       | Shown on           | File                                                                    |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `Tagline`                       | home               | [src/spike/Tagline.tsx](../src/spike/Tagline.tsx)                       |
| `BrowseHint`                    | home, below `row:` | [src/spike/BrowseHint.tsx](../src/spike/BrowseHint.tsx)                 |
| `HomeSwipe` (no markup)         | home, touch        | [src/spike/HomeSwipe.tsx](../src/spike/HomeSwipe.tsx)                   |
| `MarketplaceHeading`            | marketplace        | [src/spike/MarketplaceHeading.tsx](../src/spike/MarketplaceHeading.tsx) |
| `MarketplacePanel`              | marketplace        | [src/spike/MarketplacePanel.tsx](../src/spike/MarketplacePanel.tsx)     |
| `SpikeTopBar` (top-left corner) | both               | [src/spike/SpikeTopBar.tsx](../src/spike/SpikeTopBar.tsx)               |

**The tagline is a chrome corner.** It carries `data-chrome-corner`, so the globe sizes
itself to clear it, and on most windows the tagline is what limits the globe's size
(see [motif radius](globe.md#motif-radius)). It stays mounted on the marketplace for that
reason: a corner that came and went would change the globe's size between routes.

**Current responsive behaviour** (not confirmed as design rules):

- Tall windows (`row:`): tagline bottom-left, its width limited to stay about 130px short
  of the window's middle.
- Phone upright (below 640px wide, 500px or taller): tagline centred above the Browse
  hint, both under the globe, with the [portrait-phone centre override](stage.md#stage-centre).
- Phone on its side (`short:`, 640px or wider): tagline as a 13em column bottom-left at
  a smaller size; Browse hint bottom-right.
- The tagline is hidden below 310px tall, and below 640px wide when under 500px tall.

## The globe's move

The motif wrapper in `StageShell` translates and scales the globe canvas with CSS:

- `data-[mode=market]:[scale:var(--globe-scale,0.15)]` and a `translate` from the stage
  centre to `--mk-globe-x` / `--mk-globe-y`, around `origin-[50%_var(--stage-centre-y)]`.
- `--globe-scale` is the only number set from script: `measureScale` divides `--mk-r`
  by the motif's radius from `motifRadius`, with the same arguments the globe uses, on
  mount and on `resize`. If those arguments drift from the globe's, the small globe
  lands at the wrong size ([motif radius](globe.md#motif-radius)).
- The globe keeps rotating during the move. The move deliberately does not use view
  transitions, which freeze rendering while they snapshot the page and would stop the
  globe mid-move.

## Route transition timing

These are kept in step by hand; nothing ties them together in code.

| Element                    | Leaving home → marketplace                                                     | Returning to home           | Where                                                                              |
| -------------------------- | ------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------- |
| Globe move                 | 800ms `cubic-bezier(0.4,0,0.2,1)`                                              | same, reversed              | Motif wrapper classes in `StageShell`                                              |
| Starfield layer dim to 40% | 800ms, Tailwind's default curve, which is the same `cubic-bezier(0.4,0,0.2,1)` | same                        | Starfield wrapper in `StageShell`                                                  |
| Ambient light crossfade    | 800ms, same curve as the globe                                                 | same                        | Two wrappers in [Starfield.tsx](../src/components/starfield/Starfield.tsx)         |
| Star crossfade             | `ROUTE_MIX_MS` 800 with `routeEase`                                            | from wherever the mix stood | [route-mix.ts](../src/lib/starfield/route-mix.ts), crossfade effect in `Starfield` |
| Tagline                    | out in 100ms                                                                   | in over 400ms after 600ms   | `Tagline` classes                                                                  |
| Browse hint                | out in 160ms                                                                   | in over 400ms after 600ms   | `BrowseHint` classes                                                               |
| Marketplace heading        | in over 600ms after 350ms                                                      | out in 100ms                | `MarketplaceHeading` classes                                                       |
| Marketplace panel          | rises 24px and fades in over 800ms after 350ms                                 | out in 100ms                | `MarketplacePanel` classes                                                         |

**The shared outcome:** outgoing content is gone before the moving globe passes under
it, and incoming content waits until the globe has nearly arrived.

**Changes that disturb it:** changing the globe's duration or curve without
`route-mix.ts` and the ambient wrappers; lengthening an outgoing fade; moving content
into the globe's path; adding a route-dependent element without fade timings of its own.

**Interrupted and repeated moves:** CSS transitions reverse from their current value,
and the star crossfade starts from the current mix, so reversing part way does not jump.
Gestures set a `committed` flag so one gesture navigates once.

**Verify** forward, back, a reversal mid-move, repeated round trips, and a deep link,
sampling frames during the move rather than only the end state
([interactive states](../docs/verification.md#interactive-and-visual-states)).

## Marketplace geometry

The `/* SPIKE. Marketplace geometry */` block at the end of
[globals.css](../src/app/globals.css) defines every marketplace length as custom
properties on `:root`, so CSS has them on the first paint. Four are registered lengths
(`--mk-r`, `--mk-globe-x`, `--mk-globe-y`, `--mk-content-top`) so script can read
pixels.

| Property                                                               | Consumers                                                                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--mk-inset-left/right/bottom` (page margin plus safe area)            | `Tagline`, `MarketplacePanel`, and the other `--mk-*` values. Not marketplace-specific despite the name          |
| `--mk-bar`, `--mk-bar-bottom` (top bar height and bottom edge)         | Other `--mk-*` values                                                                                            |
| `--mk-r`, `--mk-globe-x`, `--mk-globe-y` (small globe)                 | The motif wrapper and `measureScale` in `StageShell`; `marketGlobe` in `Starfield` (star hole and ambient light) |
| `--mk-heading-*`                                                       | `MarketplaceHeading`                                                                                             |
| `--mk-content-top`, `--mk-panel-left`, `--mk-panel-pad`, `--mk-column` | `MarketplacePanel`                                                                                               |

There are two compositions. Tall (500px and up): the small globe under the wordmark,
the heading beside it, the catalogue below both. Short (under 500px): globe and heading
in a left column, the catalogue beside them. The inset tiers repeat the stage margins
as literals ([tokens](stage.md#tokens-breakpoints-and-variants)).

## Navigation and gestures

| Way                                     | Direction      | Implemented in     | Notes                                                                                                                                                                        |
| --------------------------------------- | -------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HOME / MARKETPLACE switch               | both           | `SpikeTopBar`      | `next/link`, `aria-current`; shown at `row:` only                                                                                                                            |
| Wordmark                                | to home        | `SpikeTopBar`      | Link to `/`                                                                                                                                                                  |
| BROWSE AI SYSTEMS ↓                     | to marketplace | `BrowseHint`       | Shown below `row:`; `inert` on the marketplace                                                                                                                               |
| Swipe up                                | to marketplace | `HomeSwipe`        | Touch only; `window` listeners while on home; `SWIPE_DISTANCE` 60px or a flick (`FLICK_SPEED`, `FLICK_DISTANCE`)                                                             |
| Pull down from the top of the catalogue | to home        | `MarketplacePanel` | Touch and wheel, on the scroller; `RESISTANCE`, `COMMIT_AT`, `DEAD_ZONE` in [src/spike/pull.ts](../src/spike/pull.ts); only a fresh gesture that starts at scroll top counts |
| Esc                                     | to home        | `StageShell`       | `keydown` on `window`, marketplace only                                                                                                                                      |
| Browser Back/Forward                    | both           | Next.js router     | The routes carry the state                                                                                                                                                   |

- `HomeSwipe` and the panel share `DEAD_ZONE`, and each calls `preventDefault` only
  after it has claimed a vertical gesture. The scroller is `overscroll-contain`, so a
  pull does not also start the browser's pull-to-refresh.
- **Changes that disturb it:** a new touch or wheel listener on `window` or the panel;
  changing `overscroll` behaviour; making the document scroll.
- The starfield's pointer response listens to `window` `pointermove` on hover-capable
  devices only, so it does not compete with touch gestures
  ([pointer response](starfield.md#pointer-response)).

## Focus and visibility

- Off-route content is `inert` (no focus, no clicks) and, for the hint, heading and panel,
  `invisible` once faded. `visibility` is delayed to the end of each fade.
- The catalogue scroller is `role="region"`, labelled from content, and `tabIndex={0}`
  so a keyboard can scroll it. The search field uses 16px text on coarse pointers so
  iOS does not zoom on focus.
- The tagline renders its full sentence in an `sr-only` span and the animated words
  `aria-hidden`.
- **Focus is not moved on a route change.** Nothing in the code moves it, so after
  activating MARKETPLACE with the keyboard, focus stays on that link on the marketplace
  and again after Esc returns home. **Open:** whether this is the intended behaviour
  has not been decided. It is a design question, not a known defect.

## Status of the spike folder

Everything under `src/spike/` and the `SPIKE.` blocks in `globals.css` is the deployed
marketplace and home-route implementation. Treat it as production code (see
[production readiness](../AGENTS.md#production-readiness)). Its folder, names, untyped
copy (`spikeContent`) and "deleted with the rest of `src/spike/`" comments are
experimental leftovers. Moving it into production locations is a separate, planned
change.

## Verification

Use [interactive and visual states](../docs/verification.md#interactive-and-visual-states)
for transitions and gestures, and [window sizes](../docs/verification.md#window-sizes)
around 640px wide and 500px tall, where the compositions switch.
