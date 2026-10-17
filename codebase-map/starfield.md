# Starfield

Owns the background star layer: the canvases that hold it, where stars go and how they
look, the ambient light behind them, keeping stars off text, and the drag response to
the pointer. Its position in the layers is in [layer order](stage.md#layer-order); its
crossfade between routes is timed in
[route transition timing](routes.md#route-transition-timing).

## Component and canvases

[src/components/starfield/Starfield.tsx](../src/components/starfield/Starfield.tsx),
`Starfield`, takes `mode` and renders three `fixed`, `h-lvh`, decorative,
`pointer-events-none` canvases: home's ambient light, the marketplace's ambient light,
and the stars. The ambient light is split from the stars so the frame loop never
repaints the background, which must never move (design constraint).

Its single `draw` function:

1. Measures the stars canvas, both routes' text (`measureClearRects`), and the small
   globe (`marketGlobe`, which reads `--mk-globe-x/y` and `--mk-r`).
2. Skips work if nothing changed (a `ResizeObserver` fires at start and on toolbar moves).
3. Sizes backing stores (`MAX_PIXEL_RATIO` 2), computes home's radius with
   [motifRadius](globe.md#motif-radius) using the globe's arguments, builds the field,
   paints both ambient canvases and the stars, and hands the field to the pointer
   response.

It reruns 150ms (`RESIZE_DEBOUNCE_MS`) after the canvas or any `data-star-clear`
element changes size. The field is regenerated, never scaled, so a resize may show a
different arrangement.

**Nothing runs at rest** (design constraint): no loop, timer or per-frame listener
unless the pointer is moving or the route crossfade is running. Idle CPU must be zero.

## Field generation

[src/lib/starfield/starfield-points.ts](../src/lib/starfield/starfield-points.ts),
`createStarfield(width, height, home, market)`, is pure and seeded (`STARFIELD.seed`,
via `mulberry32` in [src/lib/random.ts](../src/lib/random.ts)), so the same size gives
the same field on every load. All tuning is in `STARFIELD`.

- **Count** is `width × height / countDivisor`, clamped to 220–900. It counts
  survivors, not candidates.
- **Density falloff:** no stars within `falloffInner` × radius of a route's globe,
  smoothstep to full density at `falloffOuter`. The radius comes from the caller, so it
  depends on the [motif radius](globe.md#motif-radius) and the small globe's `--mk-r`.
- **Both routes from one stream:** each candidate is judged against both routes with
  one draw, and carries `home` and `market` flags. Stars on both never move between
  routes.
- **Appearance:** magnitude `u ** magnitudeExponent`; most stars are faint bare cores;
  halos only above `haloThreshold`; bloom above `bloomThreshold`; additive compositing;
  sub-pixel cores held at `radiusMin` with the shortfall paid in alpha. The colours are
  in `STARFIELD.colours` and `colourShares`. **Open:** the amber star colour is marked
  "under review" in its comment.

## Text clearance

[src/lib/starfield/text-clearance.ts](../src/lib/starfield/text-clearance.ts):
`STAR_CLEAR_ATTRIBUTE` (`data-star-clear`) marks text the stars stay off.
`measureClearRects(mode)` measures each line of text inside marked elements (not the
element box), skips `sr-only` text, and skips text not displayed at this size. Stars are
kept with probability 0 within `textClearInner` (24px) of a line, easing to 1 at
`textClearOuter` (48px).

The value says which route's sky it clears: `""` for both, `"home"` or `"market"`.

| Marked element                          | Value      |
| --------------------------------------- | ---------- |
| Platform link in `TopRightCluster`      | `""`       |
| Wordmark and switch in `TopLeftCluster` | `""`       |
| Tagline paragraph, Browse hint          | `"home"`   |
| Marketplace heading block               | `"market"` |

**New text must carry the attribute, or stars can land on it.** The marketplace
catalogue (search field, row titles, cards) is not marked today. It sits over a panel
of its own, but nothing keeps stars out from behind its text. Whether it should be
marked has not been decided.

## Ambient light

`drawAmbient` in [src/lib/starfield/draw.ts](../src/lib/starfield/draw.ts) paints a
cool glow that is empty inside `AMBIENT.hole` × radius and rises monotonically to
`AMBIENT.peak` alpha at the far corner, in twelve sampled stops. It is on a canvas
rather than a CSS gradient because it must follow the motif radius, which a CSS
gradient's stops cannot do. It is drawn once per size, one canvas per route, and
crossfaded with the route.

**Design constraint:** the light goes around the globe, never behind it. The globe is
a transparent point cloud, and light behind it lifts the gaps its continents are read
against.

## Pointer response

[src/lib/starfield/pointer-response.ts](../src/lib/starfield/pointer-response.ts),
`createPointerResponse`, returns `setField`, `setMix`, `destroy`. Stars along the
segment the cursor swept each frame are pushed, then coast home under the closed-form
decay tuned by `POINTER`. When everything is back it snaps stars home, draws once and
cancels the loop. No smear: every frame clears fully.

- Listens on `window` `pointermove`/`pointerout`, because the canvas takes no pointer
  events and the field keeps responding under the chrome.
- Attached only when `(hover: hover)` matches and reduced motion is off; re-evaluated
  live. Touch devices get a static field.
- `setMix` is how the route crossfade redraws stars; it is drawn through `drawStars`.

## Verification

Field determinism allows pixel comparison of the stars canvas at a fixed size, as long
as the pointer has not moved. Check: no star within 24px of text on either route; the
empty disc follows the globe on both routes; the background does not change during a
pointer sweep; no animation frames after the field settles. See
[interactive and visual states](../docs/verification.md#interactive-and-visual-states)
and [measuring tone and contrast](../docs/verification.md#measuring-tone-and-contrast).
