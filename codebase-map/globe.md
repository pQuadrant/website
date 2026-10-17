# Globe

Owns the rotating point-cloud globe (the "motif"): the React component that hosts its
canvas, the engine in `src/lib/globe/`, the size rule that other layers also use, and
the build-time generator for its points. Where it sits in the layers is in
[layer order](stage.md#layer-order); how it moves between routes is in
[the globe's move](routes.md#the-globes-move).

## Lifecycle

[src/components/globe/Globe.tsx](../src/components/globe/Globe.tsx), `Globe`, takes no
props. On mount it reads `--color-land`, `--color-ocean` and `--color-highlight` from
CSS, calls `createGlobe` with them and a `centreY` callback
([stage centre](stage.md#stage-centre)), observes the canvas with a `ResizeObserver`
that calls `resize()`, and calls `destroy()` on unmount.

[src/lib/globe/globe.ts](../src/lib/globe/globe.ts), `createGlobe`, returns a
`GlobeHandle` (`resize`, `destroy`) and owns the frame loop, the reduced-motion switch
(`applyMotionPreference`, live) and shutdown.

- **Exactly one loop per canvas.** `destroy` must run before a second `createGlobe`, or
  two loops fight over the canvas. A development fast refresh exercises this path.
- **Nothing outside re-renders it.** No props means a React re-render elsewhere cannot
  reach the loop.
- The canvas is `fixed`, `h-lvh`, with an explicit `w-full` (a canvas's `auto` width
  resolves to its backing store). Backing store capped at `MAX_PIXEL_RATIO` 1.5.
- Colours live only in CSS tokens; the engine holds no colour values. Renaming or
  removing those tokens is not caught by any check: the globe would read empty strings.

## Engine modules

| File                                                        | Responsibility                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [state.ts](../src/lib/globe/state.ts)                       | `GlobeState`, `advance` (eased spin and tilt, `MAX_DELTA` clamp), `snap` for reduced motion |
| [entrance.ts](../src/lib/globe/entrance.ts)                 | `ENTRANCE` timings and per-point drift, `createEntranceField`, `rotationRamp`               |
| [projection.ts](../src/lib/globe/projection.ts)             | `motifRadius`, `project` into opacity buckets, highlight and far-side cull                  |
| [draw.ts](../src/lib/globe/draw.ts)                         | `resolveColours`, `paint`: one fill per bucket                                              |
| [point-set.ts](../src/lib/globe/point-set.ts)               | `createGlobePointSet` decodes the generated indices                                         |
| [fibonacci-sphere.ts](../src/lib/globe/fibonacci-sphere.ts) | `writeSpherePoint`, the single definition of point placement                                |

Boundaries, as the `globe.ts` header states them: no React, nothing imported from
`src/components/`, no colour values, state separated from drawing. The engine reads the
DOM in two ways: the canvas and motion preference, and the corner boxes through
`chromeClearance` ([motif radius](#motif-radius)).

Performance techniques: typed arrays allocated once, no per-point
allocation in the loop, about 24 fills per frame through opacity bucketing
(`BUCKET_COUNT` 10 per class, `HIGHLIGHT_BUCKET_COUNT` 4), and far-side points
(`CULL_DEPTH`) drawn only at even indices. Points are axis-aligned squares once
settled; entrance points are circles.

## Motif radius

`motifRadius(width, visibleHeight, chromeLimit)` in `projection.ts` returns the smallest
of four terms, with a floor:
`max(RADIUS_FLOOR 48, min(min(width, visibleHeight) × 0.44, RADIUS_CAP 396, chromeLimit, visibleHeight / 2 − EDGE_MARGIN 24))`.

`visibleHeight` is `2 × --stage-centre-y`, not the `lvh` canvas height.
`chromeLimit` is `chromeClearance(width / 2, centreY)` from
[src/lib/stage/chrome-clearance.ts](../src/lib/stage/chrome-clearance.ts): the distance
to the nearest displayed `[data-chrome-corner]` box, less `CHROME_CLEARANCE` (24px).

**Three callers must pass the same arguments:**

| Caller                                                                     | Uses the radius for                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `measure` in `globe.ts`                                                    | Drawing the globe                                                                |
| `draw` in [Starfield.tsx](../src/components/starfield/Starfield.tsx)       | The star-free disc and the ambient hole ([field](starfield.md#field-generation)) |
| `measureScale` in [StageShell.tsx](../src/components/stage/StageShell.tsx) | `--globe-scale` for the marketplace move                                         |

If one diverges, stars appear inside the sphere, a halo sits on its rim, or the small
globe lands at the wrong size.

**What feeds the corner term.** Three elements carry `data-chrome-corner`: the two top
corner regions in `Stage`, and the tagline wrapper. Hidden elements report empty boxes
and are skipped.

The tagline is usually the nearest corner, so **its wording, size and position set the
globe's size on most windows**, desktop included; on some phone sizes the size factor
or the edge margin limits it instead. A copy change can resize the globe. Measure the terms at the
[window sizes](../docs/verification.md#window-sizes) to see which one applies.

**Changes that disturb it:** adding, removing, resizing or moving any
`data-chrome-corner` element; changing the corner margins or chrome scale; changing
the stage centre; changing any constant in `motifRadius`.

**When each caller re-measures (from the code, not observed as a fault):** the globe
and `measureScale` re-measure on a window or canvas resize only. The starfield also
re-measures when any `data-star-clear` element changes size, which includes the
tagline. A tagline size change without a window resize, such as a late web-font swap,
could therefore leave the starfield's disc and the globe briefly disagreeing until the
next resize.

**Verify** by reading the corner boxes and centre at the
[window sizes](../docs/verification.md#window-sizes), and confirm the globe, the
starfield's empty disc and the marketplace's small globe agree.

## Point set

[scripts/generate-globe-points.mts](../scripts/generate-globe-points.mts) (`npm run
generate:globe`, optional `--count`, `--chart <path>`) places Fibonacci candidates with
`fibonacci-sphere.ts`, classifies them against Natural Earth 50m land (`world-atlas`,
`d3-geo` `geoContains`, all dev dependencies), keeps every land candidate and thins the
ocean by a regular stride, then writes
[point-set.generated.ts](../src/lib/globe/point-set.generated.ts). Never edit the
generated file by hand.

- **Generated ahead of time, shipped as data.** No geometry fetch and no mapping library
  in the browser; the script header explains this.
- **The land class is never thinned** (design constraint, `LAND_SHARE_FLOOR` in the
  script): thinning a dense lattice punches visible holes.
- **15,000 points** is the default count. Changing it re-rolls every point (`total` is
  fixed at 34,063 for this count) and changes which small islands exist. Measure frame
  time before changing it. Earlier design documents preferred scaling point size over
  cutting the count if cost ever had to give (not confirmed).
- Far-side culling uses the point's slot, so a regenerated set changes which far-side
  points are drawn. That shows in a pixel diff without being visible.

## Entrance and motion

The entrance timings are part of the [page entrance timeline](stage.md#page-entrance-timeline).
Within the globe: every point is at its true geometry from the first frame and starts
scattered by a seeded drift (`ENTRANCE.seed`, independent of the starfield's seed), dim
and colourless, then settles. No per-point value derives from position. Idle spin is
`SPIN` 0.055 rad/s with `TILT` 0.16. Under reduced motion no entrance field is built
and one settled frame is painted. Because the seed is fixed, the sequence repeats on
every load; the rotation means a still frame differs by capture time.

## Open questions

- Frame cost of 15,000 points on a mid-range Android phone has never been measured.

## Verification

[Required checks](../docs/verification.md#required-checks); for point-set changes,
regenerate with `--chart` and inspect the plot. For visual changes, follow
[interactive and visual states](../docs/verification.md#interactive-and-visual-states).
For brightness or contrast, see
[measuring tone and contrast](../docs/verification.md#measuring-tone-and-contrast).
