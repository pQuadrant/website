# Stage

Owns the page shell that both routes share: the document, the layer stack, the
vertical centre every layer draws on, the corner chrome, and the design tokens,
breakpoints and base rules in `globals.css`. What the two routes do on top of the
stage is in [routes](routes.md#routes); the two canvases are in [globe](globe.md#globe)
and [starfield](starfield.md#starfield).

## Page shell

[src/app/layout.tsx](../src/app/layout.tsx), `RootLayout`, loads IBM Plex Sans and
Mono (`display: "block"`), sets `metadata`, and sets `viewport`: `themeColor` and
`viewportFit: "cover"`. The `<html>` carries `bg-stage` and `scheme-dark`, so the
stage fill covers the whole document (an overscroll bounce exposes the fill, not
white) and browser-drawn controls render dark. There is no light mode.

[src/app/(stage)/layout.tsx](<../src/app/(stage)/layout.tsx>), `StageLayout`, mounts
`StageShell` once for both `/` and `/marketplace`, so the stage is never remounted on
navigation. See [route structure](routes.md#route-structure).

**The stage colour is written three times.** `#020306` appears as `--color-stage` in
[globals.css](../src/app/globals.css), `viewport.themeColor` in `layout.tsx`, and
`background_color`/`theme_color` in [src/app/manifest.ts](../src/app/manifest.ts),
because a meta tag and a manifest cannot read a CSS property. Change all three
together; each file's comment says so.

## Layer order

[src/components/stage/Stage.tsx](../src/components/stage/Stage.tsx), `Stage`, renders
bottom to top: the `starfield` prop, the `motif` prop, the vignette, an empty
document-height spacer, `children` (route content), then the two fixed top corner
regions (`topLeft`, `topRight`). Layer 1, the fill, is on `<html>`.

- Every layer is `fixed` to the window, so nothing moves relative to anything else
  during a touch rubber-band; pull-to-refresh and trackpad bounce are left alone.
- The spacer's height is `calc(var(--stage-centre-y) * 2)`, which makes the document
  exactly the visible viewport tall. The page does not scroll; the marketplace
  catalogue scrolls inside its own panel.
- The vignette is `radial-gradient(118% 88% at 50% 46%, transparent 52%, var(--color-vignette) 100%)`.
  Its sizes are radii, so it contributes almost nothing along the side edges and at
  the current fill is close to inert. Read the gradient notes in
  [conventions](../docs/conventions.md#styling) before tuning it.
- Decorative layers are `pointer-events-none`; the corner regions are too, and each
  control inside opts back in with `pointer-events-auto`.

**Design constraint:** glow is emission of an element's own colour (the chrome text
halos, the focus ring, star halos drawn on canvas), never a drop shadow; star halos are
canvas gradients, not `box-shadow` or a blur filter. The reasons are in the glow
comment in `globals.css` and the header of
[src/lib/starfield/draw.ts](../src/lib/starfield/draw.ts).

**Not confirmed:** the stage also uses only square corners and 1px borders, with no
border radius, backdrop blur, frosted glass, noise, scanlines, SVG or displacement
filters, or curvature. Earlier design documents excluded these; nothing current
confirms the exclusion is still intended.

## Stage centre

`--stage-centre-y` is a registered `<length>` in [globals.css](../src/app/globals.css)
(`@property --stage-centre-y`), set to `50svh` on `:root`.
[src/lib/stage/centre.ts](../src/lib/stage/centre.ts), `stageCentreY`, resolves it to
pixels and falls back to half the stage.

Consumers, which must all read the same value:

| Consumer                              | Where                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Globe centre and radius               | `options.centreY` in [Globe.tsx](../src/components/globe/Globe.tsx) → `measure` in [globe.ts](../src/lib/globe/globe.ts) |
| Star density falloff and ambient hole | `draw` in [Starfield.tsx](../src/components/starfield/Starfield.tsx)                                                     |
| Marketplace globe scale               | `measureScale` in [StageShell.tsx](../src/components/stage/StageShell.tsx)                                               |
| Globe move origin                     | `origin-[50%_var(--stage-centre-y)]` on the motif wrapper in `StageShell`                                                |
| Document height                       | The spacer in `Stage`                                                                                                    |

**Two sizes, on purpose.** Canvases are `h-lvh` so a retracting mobile toolbar does
not resize them mid-gesture; the drawing centre is `svh`, what the visitor actually
sees. Never centre on `window.innerHeight` (it tracks the toolbar) or on the canvas
height.

**Portrait-phone override.** A `@media (width < 640px) and (height >= 500px)` block in
`globals.css` sets `--stage-centre-y: calc(50svh - 40px)` because the tagline and
Browse hint stack under the globe there. It moves the globe, starfield, globe-move
origin and document height together. Changing the bottom-of-screen home layout on
phones is a reason to revisit it.

**If you change the centre:** check the ambient hole still sits over the sphere (a
mismatch shows as a halo on the rim) and the globe is not clipped at the top or bottom.
Use [window sizes](../docs/verification.md#window-sizes), especially landscape phones.

## Corner chrome

The two regions in `Stage` are `fixed`, `top-[56px]` at every size, with horizontal
margins on three width tiers (`stage-margin-tight` 24px, `stage-narrow:` 40px,
`stage:` 64px). The safe-area inset is **added** to the margin, not substituted with
`max()`, so the offset is measured from the usable edge of a notched display. Both
carry `data-chrome-corner` (`CHROME_CORNER_ATTRIBUTE`), which the globe measures; see
[motif radius](globe.md#motif-radius).

- **Top right:** [TopRightCluster.tsx](../src/components/chrome/TopRightCluster.tsx),
  `TopRightCluster`. The platform link is a real `<a href>` (modified/middle click and
  context menu work; same tab, no `target`). Row height is `h-chrome-touch` (44 units)
  below `row:` and `h-chrome-control` (34 units) at `row:` and up; the link stretches to
  it. The border is `fg-2`; earlier design documents chose it as the first ramp value
  clearing 3:1 non-text contrast against the corner ground (not confirmed; measure
  before changing the border, fill or background). The fill `--color-control-fill` is
  kept faint so the control reads as an object rather than a lit panel (its comment in
  `globals.css`).
- **Top left:** [TopLeftCluster.tsx](../src/components/chrome/TopLeftCluster.tsx),
  `TopLeftCluster`: the wordmark (link to `/`) and, from `row:` up, the HOME /
  MARKETPLACE switch. See
  [navigation and gestures](routes.md#navigation-and-gestures).
- **Control states:** every control has an `active:` state matching its `hover:` state,
  because Tailwind emits `hover:` only for devices that hover. Focus is
  `focus-visible:shadow-glow-focus` and is deliberately outside the transition, so it
  never fades in.
- The tagline is also a chrome corner (it carries `data-chrome-corner`), although it
  is not rendered by `Stage`. See [route content](routes.md#route-content).

## Tokens, breakpoints and variants

All in [src/app/globals.css](../src/app/globals.css). Each block's comment carries its
reasoning; read it before changing values.

- `@theme static`: colours (`stage`, `fg-0..2`, `separator`, `accent-bright`, `land`,
  `ocean`, `highlight`, `vignette`, `control-fill`), the glow text-shadows
  `--text-shadow-glow-0/1`, `--shadow-glow-focus`, `--text-chrome-label`, chrome
  spacings, stage margins, entrance animations, `--transition-duration-hover`.
  `static` keeps tokens emitted even when no utility uses them, because the globe
  reads `--color-land`, `--color-ocean` and `--color-highlight` at runtime
  ([lifecycle](globe.md#lifecycle)).
- **Chrome scale:** `--chrome-unit` on `:root` is
  `clamp(1px, 1px + (100vw − 1024px) × 0.00045573, 1.7px)`: exactly 1px at 1024px and
  below, 1.7px from 2560px. Chrome type, control heights, padding, gaps and glow radii
  are counts of this unit. Borders, the focus ring's 1px ring, letter-spacing (in `em`)
  and the corner margins do not scale (design constraint, explained beside the chrome
  dimensions in `globals.css`).
- **Breakpoints:** `--breakpoint-stage: 1100px` and `--breakpoint-stage-narrow: 640px`
  drive only the margin tiers, by width.
- **Variants:** `row:` is `(width >= 640px) and (height >= 500px)`, the roomy layout;
  `short:` is `(height < 500px)`, phones on their side. 500px sits between the tallest
  landscape phone viewport (about 480px) and the shortest landscape tablet (744px).
  The 640px in `row:` is a literal that duplicates `--breakpoint-stage-narrow`, because
  a media query cannot read a custom property; move both together. Media queries read
  the layout viewport, so an opening keyboard or a sliding toolbar does not reflow.
- **Stage insets and the chrome bar:** the `Stage insets and the chrome bar` block in
  `globals.css` sets `--stage-inset-left/right/bottom` (the page margin plus the safe
  area, on the same three width tiers) and `--chrome-bar`, `--chrome-bar-bottom` (the
  top row's height and bottom edge). `Tagline`, `MarketplacePanel` and the
  [marketplace geometry](routes.md#marketplace-geometry) lay out on them. The inset
  tiers repeat the 24/40/64 margins as literals; change both together.
- **Pointer cursor:** one `@layer base` rule gives a pointer to `button`, `a[href]`,
  `[role="button"]`, button-like inputs and `summary`, excluding disabled. See
  [conventions](../docs/conventions.md#styling).

## Page entrance timeline

The opening sequence spans three implementations that share one clock, the page's
time origin (CSS animations start on the document timeline; `requestAnimationFrame`
and `performance.now()` report the same origin). Nothing passes a start time between
them.

| Phase                                      | When                               | Implemented in                                                                                                                                          |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stars and ambient light fade in            | 0–400ms                            | `animate-stars-in` on the canvases in `Starfield.tsx`; token in `globals.css`                                                                           |
| Corner regions fade in                     | 200ms and 260ms delays, 520ms each | `animate-chrome-in` and `[animation-delay:*]` on the regions in `Stage.tsx`                                                                             |
| Globe resolves and spins up                | 250–1400ms                         | `ENTRANCE` in [entrance.ts](../src/lib/globe/entrance.ts), `advance` in [state.ts](../src/lib/globe/state.ts)                                           |
| Tagline words, then emphasis and underline | from 900ms, 45ms stagger           | `FIRST_WORD_MS`, `STAGGER_MS`, `EMPHASIS_HOLD_MS` in `Tagline` ([Tagline.tsx](../src/components/home/Tagline.tsx)), Web Animations with `startTime = 0` |

- Only opacity animates on the chrome; everything is laid out and clickable from the
  first frame.
- A late start shortens the sequence rather than delaying it: the globe skips its
  entrance if `performance.now()` is already past `ENTRANCE.endMs` when it is created,
  and tagline animations anchored at time 0 are already finished.
- The tagline's emphasis start depends on the number of lead words, so copy length
  changes its timing ([wording effects](content.md#wording-effects)).
- **If you change a timing:** re-check the phases still read as one sequence. Capture
  frames across the first 1.5s on a hard reload, with and without reduced motion
  ([interactive states](../docs/verification.md#interactive-and-visual-states)).

## Reduced motion

Each layer handles `prefers-reduced-motion` itself:

| Area                        | Behaviour                                                                                                               | Reacts to a change while open? |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| CSS fades and transitions   | `motion-reduce:animate-none` / `motion-reduce:transition-none` on most layers; exceptions below                         | Yes                            |
| Globe move between routes   | Still animates: `data-ready:transition-[translate,scale]` on the motif wrapper outranks `motion-reduce:transition-none` | Yes, but has no effect         |
| Tagline fade between routes | Still runs: the wrapper's opacity transition has no reduced-motion variant                                              | Not applicable                 |
| Globe                       | `applyMotionPreference` in `globe.ts` stops the loop, `snap`s state and paints one frame                                | Yes (`change` listener)        |
| Star pointer response       | `applyPreference` in [pointer-response.ts](../src/lib/starfield/pointer-response.ts)                                    | Yes                            |
| Star route crossfade        | `Starfield` jumps straight to the target mix                                                                            | Checked on each route change   |
| Tagline words               | `Tagline` skips its animations if the preference matches at mount; CSS `motion-reduce:opacity-100` shows the words      | **No**                         |

**Known defect,
[issue #54](https://github.com/pQuadrant/website/issues/54):** load with reduced motion
on, then turn it off, and the tagline disappears. Its words fall back to `opacity-0`
because the effect that would show them never ran. A change to the tagline's motion
should fix this or keep it in mind.

**Known defect,
[issue #56](https://github.com/pQuadrant/website/issues/56):** the globe move above
still animates under reduced motion. Elsewhere `motion-reduce:transition-none!` (the
important form) is what wins against a more specific transition class. Whether the
tagline's opacity fade should also stop is not decided.

## Verification

Use [required checks](../docs/verification.md#required-checks), the
[window sizes](../docs/verification.md#window-sizes) with fine and coarse pointers, and
[interactive and visual states](../docs/verification.md#interactive-and-visual-states).
Tonal changes (fill, vignette, glow, contrast) need
[measurement](../docs/verification.md#measuring-tone-and-contrast), not a visual check.
