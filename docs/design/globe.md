# Globe motif — design specification

The rotating point-cloud globe at the centre of the pQuadrant home page. Build against
this file. If the code and this file disagree, one of them is wrong; fix it rather than
working around it.

Read `docs/design/home.md` first. It defines the stage the globe sits on, its size cap,
and the layers above and below it.

This file is longer than the others and different in kind. The other surfaces can be
matched against a screenshot. This one cannot: nothing about an even distribution of
fifteen thousand points across a sphere is recoverable by looking at a picture of it. The
numbers and methods below are the specification.

---

## What it is

A sphere of small square points, rotating slowly, drawn on a single HTML canvas. Points
over land are one colour, points over ocean another. The continents are real Natural
Earth geometry, not decoration.

It is the visual centre of the page and it responds to what the visitor does: it
brightens when a field is focused, spins up while a sign-in is processing, flinches
when credentials are rejected, and dims behind the sign-in panel so the form stays
readable.

**It is not part of the sign-in surface.** The globe outlives this page's current
purpose. It is planned to become directly manipulable, to carry markers at real
coordinates, and to support zooming to a region. Build it as a self-contained module
that knows nothing about React, forms, or authentication. See _Module contract_.

---

## Terms

**Point** — one of the ~15,000 dots. Drawn as an axis-aligned square, never a circle.

**Land point / ocean point** — a point whose position falls over land, or not.
Determined once at generation time and never recomputed.

**Depth** — how near the front of the sphere a point currently is, from 0 at the back to
1 at the front. Drives both size and opacity, and is what makes the sphere read as
three-dimensional.

**Clear zone** — a rectangle where points are dimmed so content on top stays legible.
Currently the sign-in panel's footprint.

**Entrance** — the opening sequence: points gather in from scattered positions across the
window and resolve into the sphere. Covers the whole page, not only the motif.

---

## Geometry generation

Runs once. The result is a fixed set of unit-sphere coordinates plus a land flag per
point.

### Even distribution

Points are placed by the Fibonacci sphere method, which spaces them evenly without the
clustering at the poles that a latitude/longitude grid produces.

With `golden = π × (3 − √5)`, for each index `i` from `0` to `total − 1`:

```
z  = 1 − (i / (total − 1)) × 2
r  = √(1 − z²)
θ  = golden × i
x  = cos(θ) × r
y  = sin(θ) × r
```

### Land classification

Each point's spherical coordinates:

```
longitude = atan2(y, x)
latitude  = asin(clamp(z, −1, 1))
```

are tested against the land geometry described below.

### The land test

Source geometry is Natural Earth 50m land, taken from the `world-atlas` package as
TopoJSON and converted to GeoJSON. The coordinate is tested against the land polygons
directly, as spherical polygons, with `d3-geo`'s `geoContains`.

It is not rasterised into a bitmask first. A 2048 × 1024 mask has cells about 0.18°
across, which is coarser than the coastline detail the source geometry carries, and
quantising to it costs small islands for no benefit — the polygon test is exact at any
resolution and runs once, at build time, where its cost does not matter.

`geoContains` treats rings as spherical polygons, so Antarctica and polygons crossing
the antimeridian are handled without special cases, and polygon holes — inland lakes —
correctly read as ocean. A per-polygon spherical bounding box, from `geoBounds`, rejects
most of the 1,419 polygons before the containment test runs.

### Land and ocean balance

Natural Earth 50m land covers **28.748%** of the sphere, but the design wants **64% land
points and 36% ocean points**, so the continents read clearly instead of being lost in a
uniform fuzz.

This is achieved by generating more candidate points than are needed, classifying all of
them, and then thinning each class to its target:

```
landTarget  = round(N × 0.64)
oceanTarget = N − landTarget
coverage    = area of the land geometry ÷ 4π
total       = ceil((landTarget / coverage) × 1.02)
```

Every candidate is classified, and each class is then thinned by taking the `k`-th kept
point from position `floor(k × available / target)` of that class, for `k` from `0` to
`target − 1`.

Two properties of this are load-bearing:

**The coverage figure is measured, not assumed.** It comes from the spherical area of
the source geometry, so replacing the geometry cannot silently undersize the candidate
pool. The 1.02 margin covers the few tenths of a percent by which Fibonacci sampling of
the geometry varies from its true area; if even that is not enough, the pool grows and
the pass repeats.

**The stride spans the whole candidate list.** Keeping every n-th point until the target
is met instead would stop partway through the walk, and because the walk runs from one
pole to the other, that empties a cap of the sphere. Thinning across the full list keeps
both classes present at every latitude.

The even distribution is preserved within each class because the discards are regular
rather than random.

`N` is **15,000**, and that is settled. Do not change it without measuring frame time
at the new count first.

### What the point count does and does not buy

At 15,000 the land points sit about **1.1°** apart, and that spacing is what decides
which islands exist.

Islands from roughly 1.5° across up are reliable: Iceland, Sri Lanka, Hispaniola,
Hokkaido, Svalbard, Tasmania. Islands well under 1° never appear, and no affordable
point count recovers them — at 160,000 points, eighteen times the frame budget the
design targets, Tahiti and Malta are still missing. Treat the Azores, the Faroes, Crete,
Cape Verde and Malta as permanently absent.

Between those sizes it is a lottery, and it re-rolls whenever `N` changes, because a
different candidate total moves every point on the sphere rather than adding to the
existing ones. Going from 9,000 to 15,000 gained Hawaii and lost the Falklands, the
Galápagos and the Solomons. That is expected behaviour, not a regression.

So the point count is the wrong instrument for making a particular island appear. If one
ever has to be present — a marker anchoring to it, a client region — the generator would
need to place it deliberately, by forcing a point onto any landmass above some area that
the sampling missed. Nothing does that today.

### Generation happens at build time, not in the browser

The prototype fetches world atlas data from a public CDN at runtime, waits for two
mapping libraries to load, rasterises the mask in a hidden canvas, and only then builds
the real point set. Do not carry that approach over. It causes four problems:

**The globe assembles twice.** The first build runs before the mask arrives, producing a
featureless sphere. When the data lands the build restarts from zero. On a slow
connection the visitor watches a plain sphere form, pop, and re-form with continents.

**The failure mode is wrong.** If the fetch fails, every point is classified as land and
the globe becomes a uniform green ball.

**It is a third-party runtime dependency on the front door to the platform.** The page
cannot render correctly if an external CDN is unavailable.

**It ships two mapping libraries to every visitor** to compute something that never
changes.

Instead: generate the point set once, in a script committed to the repository, and ship
the result as a compact data file. No mapping library reaches the browser, there is no
fetch, and the first assemble is the only assemble.

**What is stored.** Only the surviving candidate indices, as gaps between consecutive
indices, LEB128 varint encoded and base64'd into a generated TypeScript module, land and
ocean in separate streams so the flag is implicit in which stream a point came from.
That is about 20KB of source for 15,000 points, against roughly 180KB for the positions
themselves.

**Where positions come from.** They are rebuilt at runtime from those indices by the same
module the generator used to place the candidates, `src/lib/globe/fibonacci-sphere.ts`.
Placement exists in exactly one function, so the stored classification and the drawn
position cannot come to describe different points on the sphere.

| File                                   | Role                                         |
| -------------------------------------- | -------------------------------------------- |
| `scripts/generate-globe-points.mts`    | The generator. `npm run generate:globe`      |
| `src/lib/globe/fibonacci-sphere.ts`    | Placement. Used by the generator and runtime |
| `src/lib/globe/point-set.generated.ts` | Generated data. Not edited by hand           |
| `src/lib/globe/point-set.ts`           | Decodes the data into typed arrays           |

The generation script is part of the codebase and re-runnable, so changing the point
count (`npm run generate:globe -- --count 12000`) or the source geometry is a build step
rather than a rewrite. It takes an optional `--chart <path>` that writes an
equirectangular plot of the result, for confirming by eye that the continents are where
they should be.

---

## Projection

Orthographic. The sphere is rotated, then flattened by discarding depth for position
while keeping it for size and opacity.

Two angles: `yaw`, which advances continuously, and `tilt`, which eases to a constant
**0.16** radians and stays there.

For a point at `(ax, ay, az)`:

```
X  = −ax·sin(yaw) + ay·cos(yaw)
Y  = −ax·sin(tilt)·cos(yaw) − ay·sin(tilt)·sin(yaw) + az·cos(tilt)
Z  =  ax·cos(tilt)·cos(yaw) + ay·cos(tilt)·sin(yaw) + az·sin(tilt)

screenX = centreX + X × R
screenY = centreY − Y × R
```

`R` is the radius, specified in `docs/design/home.md`, multiplied by the current
`contract` factor from the state table below.

`Z` is used only for depth. There is no perspective divide.

### Far-side culling

Points with `Z < −0.05` are drawn only if their index is even. This halves the point
count on the hidden hemisphere, where points are dim and overlapping anyway. It is a
significant saving for no visible difference.

---

## Rendering

### Depth, size and opacity

```
depth = clamp((Z + 1) / 2, 0, 1)
size  = max(0.7, (0.55 + 1.15 × depth) × (1 + 0.3 × glow + 0.22 × dotGlow))
alpha = (0.17 + 0.83 × depth^1.6) × dim
        × (1 + 0.5 × glow + 0.55 × dotGlow)
```

`glow`, `dotGlow` and `dim` come from the state table below. A point that has not yet
arrived carries two further factors on its alpha and a different size and shape
entirely — see _Entrance_.

Then, in order:

- Ocean points: `alpha × 0.95`
- Inside the clear zone: `alpha × 0.13`
- Points with `alpha ≤ 0.02` are dropped entirely

### Colour and shape

|              | Colour    | Size multiplier |
| ------------ | --------- | --------------- |
| Land points  | `#5FD98F` | ×1.1            |
| Ocean points | `#4E9BFB` | ×0.85           |

Points are **axis-aligned squares**, drawn as rectangles. Not circles, not arcs. This is
both a visual decision and a performance one; the squareness is visible at close
inspection and is part of the look.

### The highlight

The points nearest the viewer carry a **white core**: a smaller square of
`#F2F7FF` drawn centred inside the point, on top of it.

```
strength = ((depth − 0.86) / 0.14)^2.5      for depth > 0.86, else none
coreAlpha = alpha × strength                 dropped at or below 0.05
coreSize  = max(1, size × 0.6)
```

`alpha` and `size` are the point's own, from _Depth, size and opacity_ above, so the core
inherits everything they carry — it dims to 13% inside the clear zone, fades in with the
assemble, and scales with `dim` and the glows.

**Why the motif needs a second colour at all.** Land is luminance 186 and ocean 146, and
the top opacity bucket is 0.95, so the brightest pixel the motif could produce was
186 × 0.95 = **176** — and p99 and the maximum were the same number, because a large
population sat pressed against it. The ceiling was the paint, not the alphas: no change
to the ocean alpha, the depth cull, the alpha floor or the bucket count can lift a
colour above its own luminance. Reaching a white point required a colour that has one.

**Why depth is the source.** Three candidates were considered and only one is taken;
they are not stacked.

- **Depth**, chosen. The projection already carries it, so the term costs nothing, and it
  varies smoothly and slowly as the sphere turns. Read as a light behind the viewer's
  shoulder, which is where a viewer assumes one is.
- **The limb or terminator**, rejected. More photographic, and it would survive behind
  the panel where depth does not — but the brightest band would fall exactly where the
  sphere's points are most foreshortened and most crowded, which reads as a rim light
  drawn around the globe rather than as light falling on it.
- **Land over ocean**, rejected. It would put the white on the one distinction the motif
  exists to show, and the two are already separated by colour, size and alpha. Brightening
  one of them is the most direct route to losing the coastlines.

**Why the exponent is above one.** At 2.5 the strength leaves the threshold with zero
gradient, so a point rotating into the highlight arrives at zero and grows. A linear ramp
is continuous too, but points visibly wink on at the boundary; measured across a turn,
this shape moves the lit population by at most 5% between samples and holds the peak
luminance flat at 238.

**Desaturation, and its limit.** The core is near-white rather than a brighter green or
blue, because a saturated bright green point is the strongest synthetic tell the motif
could offer. The core replaces only the middle of the point: the land green and the ocean
blue survive as a ring around it, which is where the motif's identity lives. This applies
to the top of the range only — nothing below `depth 0.86` is touched, and the median
luminance of the motif is unchanged by the highlight.

**What it does not survive.** With the panel open, every point bright enough to exceed
luminance 200 projects within 187px of the sphere's centre, and the clear zone reaches
226px. The highlight is therefore entirely hidden while the panel is open. That is the
clear zone working as specified rather than a fault in the highlight, and it is the
accepted cost of taking the highlight from depth: a limb-sourced highlight would have
survived. If the panel's footprint or the radius changes, this is the number to re-check.

### Opacity bucketing

Canvas cannot vary opacity within a single fill, and changing it per point would mean
15,000 separate draw calls.

Instead, opacity is quantised into **10 buckets**. Every point is assigned to the bucket
matching its computed alpha, each bucket is drawn as one path containing all its
rectangles, and the whole path is filled once at that bucket's opacity, which is
`(bucketIndex + 0.5) / 10`.

This reduces roughly 15,000 draw calls to 24: ten land buckets, ten ocean buckets, and
four for the highlight. The ocean pass applies an additional ×1.15 to the bucket opacity.

Ten buckets is enough that the banding is invisible at these point sizes. Do not reduce
the count to save work.

The highlight pass uses **four**, and one set for both point classes rather than one
each. Its population is a few hundred points across a narrow range of strengths, so the
banding that ten buckets exist to hide is not there to hide, and the core is the same
colour whichever point it sits in — splitting it by class would double the fills to draw
the same pixels. It is drawn last, so a core sits on top of the point it belongs to.

### Bloom

While `glow` or `dotGlow` is above 0.05, points are drawn with a shadow blur of
`12 × max(glow, dotGlow)`, coloured to match the pass: land colour for the land pass,
ocean colour for the ocean pass, and the highlight colour for the highlight pass. All
three bloom on the stronger of the two glows, so a state change does not leave the cores
flat while the points under them glow.

### Device pixel ratio

The canvas backing store is capped at **1.5×** the layout size, even on displays with a
higher ratio. At these point sizes the difference is not visible, and the cost of a full
3× or 4× buffer is not worth paying for a field of 1-pixel squares.

### Density on a narrow window

The radius scales with the window, from `docs/design/home.md`, but **the point count and
the point size do not**. Neither `size` nor the count carries a radius term. The globe
therefore gets denser as the window narrows, not smaller-but-identical:

| Window     | Radius  | Disc area vs desktop | Points | Dots per square pixel |
| ---------- | ------- | -------------------- | ------ | --------------------- |
| 1440 × 900 | 396px   | —                    | 15,000 | ×1                    |
| 390 × 844  | 171.6px | 19%                  | 15,000 | **×5.3**              |

**This is intentional. Do not "fix" it.** On a phone the same fifteen thousand points fall
into a fifth of the area, the gaps between them close, and the globe reads as a denser and
more luminous object than it does on a desktop. That is wanted. The continents read at
least as clearly as they do at full size — the land and ocean masses gain contrast against
each other as they fill in — so the motif's content survives the density rather than being
lost to it.

Each individual point is unchanged. Nothing is brighter on a phone; there is simply more of
it per unit of screen. A report that the phone globe "glows more" is this, and is correct
behaviour.

**The one thing that could overturn this is frame cost, which is not yet measured.** See
_Not yet specified_. If it ever has to give, reach for the point **size** before the point
count: scaling `size` with the radius thins the density without removing a single island,
where cutting the count re-rolls the whole sphere and loses islands permanently — see
_What the point count does and does not buy_.

---

## Motion and states

The globe has one continuous behaviour and three states layered on top of it.

### Entrance

The page opens on empty space. The stars come up, the corner chrome follows them in, and
the globe resolves out of the dark. It runs on every load, in full — there is no
shortened variant for a return visitor, no session flag, and no skip.

| Phase          | Window       | What happens                                         |
| -------------- | ------------ | ---------------------------------------------------- |
| Stars in       | 0 → 400ms    | Both starfield canvases fade from 0 to full opacity  |
| Chrome in      | 200 → 900ms  | Four corner clusters fade in, 60ms apart, 520ms each |
| Globe resolves | 250 → 1400ms | Points settle, brighten and separate into colour     |
| Rotation ramp  | 250 → 1400ms | Rotation eases from stationary to the idle rate      |

**The globe is never assembled.** It is at its final geometry from the first frame it is
drawn. What changes is how well it can be read: points begin scattered a few pixels off
where they belong, dim and colourless, and the scatter settles out. Nothing travels
across the window, nothing arrives from anywhere, and no point is ever further from its
position than a few times the spacing between neighbours.

**This is a deliberate rejection of the obvious version, which was built first.** Points
flying in from the edges of the window and gathering into a sphere is among the most-used
motion effects on the web. It reads as a trick performed on the motif rather than as the
motif itself; there is no reason a globe's points would ever have been scattered across a
viewport; and it took 2.8 seconds to say nothing on a page whose job is to let someone in.
Adding curved paths and a swirl to it made it showier, not more serious — the axis was
never cheap-to-expensive, it was showy-to-restrained.

What survived is the part worth animating: **the continents separating out of an
undifferentiated haze.** That is the motif's own content rather than a flourish attached
to it, and it is what the sequence is for.

**The first two phases are CSS, on the elements themselves**, and the globe's phase is
drawn on its canvas. All three run on the page's own clock — the document timeline for
the fades, `requestAnimationFrame`'s timestamp for the motif, which share an origin — so
nothing hands a start time between layers, and a slow first paint shortens the sequence
rather than pushing its end past 1.4 seconds.

**Nothing blocks interaction at any point.** The corner regions are laid out and
hit-testable from the first frame; only their opacity animates. The sign-in control
answers a click half a second in whether or not it has finished appearing, and the
sequence carries on underneath — it does not pause, jump to the end, or cancel.

#### Per point

Each point is given, from a seeded generator so the sequence is identical on every load:

| Value  | Range                                           |
| ------ | ----------------------------------------------- |
| Drift  | `0.45 → 1.0` of `0.055 R`, at a uniform bearing |
| Delay  | `0 → 200ms` after `startMs`                     |
| Settle | `800 → 950ms`                                   |

**No value is derived from where the point sits on the sphere.** Not by distance from the
centre, not by latitude, not by anything geometric. A spatial pattern reads as a wipe or
a sweep, and the sphere has to resolve evenly across its whole face at once. The point
set's index order runs pole to pole, so deriving a delay from the index is the same
mistake wearing a different hat.

With `t` the point's own progress through its settle, `0` to `1`:

```
e       = 1 − (1 − t)³
position = projected + drift × R × (1 − e)

appear   = min(1, t / 0.12)
alpha   ×= appear × (0.15 + 0.85 × e)
radius   = (size/2 + 0.9 × (1 − e)) × √appear
colour   = white → class colour over t ∈ [0.55, 1], eased
```

**The drift is the whole measure.** At 1440 × 900 the spread is 22px against roughly 7px
between neighbouring land points, so a point starts about three neighbours out and the
coastlines are genuinely unreadable rather than merely soft. Their becoming readable is
the effect. Much beyond this and the sphere stops reading as a sphere, at which point the
page is assembling a globe out of dots again.

The drift is added to the position the point holds _this frame_, not to a frozen one, so
the grain turns with the sphere rather than sitting still on the glass while the globe
moves underneath it.

**Nothing overshoots.** A single ease-out, no bounce, no back, no elastic. A point that
travelled past its position and settled back would be a flourish, and this design has
none.

**Softness is carried by size and alpha, not by a blur.** An unresolved point is its
settled radius plus 0.9px, drawn faint — at a couple of pixels across, that is a soft
dot, and it costs a filled circle rather than a gradient. The excess melts away on the
same curve as the drift, so a point resolves to small and crisp exactly as it stops
moving and there is no step at the handover.

An intermediate version drew each point from a pre-rendered soft-dot sprite at four times
its settled size. Measured, that was fifteen thousand `drawImage` calls a frame and it
did not hold frame rate — 50–83ms a frame against 16.7ms for the settled globe. Do not
reach for it again.

**The colour is held.** A point wears the starfield's cool white, `rgb(226, 234, 246)`,
until 55% of its settle and only then crosses to its land green or ocean blue. The
threshold is measured on raw settle progress, not on `e`: on `e` it would arrive a
quarter of the way in, and the continents would be legible almost from the start.

Unresolved points are drawn as **filled circles**, not the squares a settled point is. A
square has an orientation and four corners, which is a lot of definition for something
meant to read as not yet in focus. The square is the shape a point earns by settling, and
handing it over on the frame the point stops moving is what makes resolving a change of
state rather than a change of shape.

A point that reaches `t = 1` rejoins the ordinary point pass that frame, highlight and
all. Once the last one has, the entrance is over: the extra pass is skipped, and idle
cost is what it was before any of this existed.

#### Resize

The drift is held in motif radii and scaled from the current radius every frame. A window
resized part way through the sequence therefore rescales the grain with it: the sequence
continues, nothing is stranded, and the final state is correct.

#### Reduced motion

There is no entrance at all. The starfield, the chrome and the fully resolved globe render
immediately, in their final state. Nothing fades, nothing moves, no sequence timer or
animation loop starts, and no per-point entrance field is built. This is a complete and
correct experience, not a reduced one.

### Idle rotation

The sphere rotates continuously about its vertical axis at **0.055 radians per second**.
There is no other idle animation.

### State values

|            | Spin (rad/s) | Contract | Dim  | Glow target           |
| ---------- | ------------ | -------- | ---- | --------------------- |
| Idle       | 0.055        | 1        | 1    | 0                     |
| Focused    | 0.055        | 1        | 1    | 0, with `dotGlow` → 1 |
| Processing | 0.19         | 0.93     | 1.06 | 1                     |
| Error      | 0.055        | 0.965    | 0.5  | 0                     |

**Contract** scales the radius. **Dim** scales opacity globally. **Glow** drives the
halo and point bloom. **dotGlow** drives point bloom only, and is suppressed while
processing.

### Easing rates

Every value above eases toward its target exponentially, at a rate expressed per second
and multiplied by the frame's delta time, clamped to 1. Rates differ by direction and by
state, and the differences carry the character of each transition.

| Value    | Rate                            |
| -------- | ------------------------------- |
| Spin     | 6 while processing, 3 otherwise |
| Contract | 30 on error, 6 otherwise        |
| Dim      | 8                               |
| Glow     | 5 rising, 2.6 falling           |
| dotGlow  | 6 rising, 3 falling             |
| Tilt     | 3.2                             |

The error contract rate of 30 is what makes the failure read as a flinch rather than a
fade. It is deliberately an order of magnitude faster than every other transition.

The error state holds for roughly **900ms** and then returns to idle on its own. It is
not cleared by the form.

### Processing halo

While processing, a radial gradient is painted behind the points, centred on the sphere,
running from `R × 0.15` to `R × 2.05`. It is solid ocean colour to 42% of that distance
and fades to transparent at the outer stop, drawn at `0.4 × glow` opacity.

### Frame timing

Delta time is clamped to a maximum of 0.05 seconds per frame. Without the clamp, a tab
returning from the background produces one enormous delta and every eased value snaps
instantly.

---

## Clear zone

A rectangle inside which point opacity is multiplied by **0.13**.

Its bounds are the sign-in panel's footprint expanded by **26px** on every side. The
edge is hard: there is no gradient falloff. At 13% opacity the boundary is not visible.

**The globe must not read this rectangle from the DOM.** The prototype looks up the
panel element by id and measures it, which couples the render loop to the page's markup
and to the panel's implementation. The zone is supplied to the module as four numbers by
whatever owns the panel. See _Module contract_.

When the panel is closed, the zone is null and no dimming is applied.

---

## Reduced motion

When the visitor has requested reduced motion:

- The globe paints a single static frame in its fully assembled state. No assemble
  animation.
- No rotation. No animation frame loop runs at all.
- State changes still apply their visual values — contract, dim, glow — but are painted
  immediately rather than eased.

The preference must be re-evaluated if it changes while the page is open, not read once
at start-up.

---

## Module contract

The globe is a plain TypeScript module in `src/lib/`. It contains no React, imports
nothing from `src/components/`, and reads nothing from the DOM other than the canvas it
is given.

Everything it needs to know arrives through this surface:

| Call           | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| Create         | Given a canvas element and options, generates geometry and starts |
| Set status     | `idle`, `loading`, or `error`                                     |
| Set focused    | Whether a form field currently has focus                          |
| Set clear zone | Four numbers, or null to clear it                                 |
| Resize         | Recompute dimensions and backing store                            |
| Destroy        | Cancel the loop, remove listeners, release buffers                |

A thin React component owns the canvas element, calls these in response to state
changes, and calls destroy on unmount. Nothing else in the application touches the
globe.

**State and drawing are separated inside the module.** Point positions, rotation,
projection and the eased state values live in one place; the canvas drawing instructions
live in another. This is what makes a future move to a graphics-card renderer a
contained change rather than a rebuild, and it is required even though no such move is
planned.

**Exactly one animation loop may exist at a time.** Creating the module a second time
without destroying the first produces two loops fighting over the same canvas, which
presents as stutter and a slow memory climb rather than an obvious error. Destroy must
be reliable.

**Nothing outside the module may re-render it.** Other elements on the page update on
their own schedules — the clock every second, the form on every keystroke — and none of
that may reach the globe.

---

## Do not carry over from the prototype

The prototype contains code that does nothing. Reproducing it wastes effort and creates
the impression of features that do not exist.

- An unused window-level mouse position tracker. The globe attaches no pointer listener
  of any kind now, so there is nothing for it to be a duplicate of — it was dead code in
  the prototype and it would be dead code here
- A `pulse` value that decays every frame and drives a draw pass whose point arrays are
  never populated
- Elliptical radii computed for the clear zone and never read
- A perspective focal length constant, declared and never used
- A frame counter that is declared and never incremented, referenced in the prototype's
  own notes as driving a throttle that does not exist

---

## Performance

Target 60 frames per second at 15,000 points on the slowest machine in the team.

The techniques that make this achievable, all of which are load-bearing:

- Positions held in typed arrays, allocated once at generation and never rebuilt
- Bucketed opacity, reducing per-frame draw calls from thousands to twenty-four
- Far-side culling, dropping half the hidden hemisphere
- Backing store capped at 1.5× device pixel ratio
- Per-frame arrays cleared by resetting length rather than reallocating

No per-point object allocation inside the draw loop. Garbage collection pauses are
visible at this frame rate.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Direct manipulation.** Dragging to rotate, zooming, momentum, and inertia are
  planned but not designed.
- **Markers.** Plotting case studies at real coordinates is planned. The projection maths
  above runs in reverse to convert a screen position back to a coordinate, so this is
  supported by the approach, but nothing about marker appearance or behaviour is decided.
- **Region focus.** Zooming to a country is planned and not designed.
- **Hit testing.** Nothing on the globe is clickable yet.
- **What 15,000 points cost on a phone.** Open, and narrower than it used to be. 15,000
  points costs 4–5ms of JavaScript per frame on the development machine, which leaves no
  headroom on a CPU three to five times slower — but that is an inference, not a
  measurement, and it has never been taken on real hardware. Measure frame time and
  battery on a mid-range Android, which is the risk case; an iPhone 13 Pro renders it
  comfortably and is not the test.

  **How the globe should look on a phone is no longer open.** The density that the
  unchanged point count produces in a smaller disc is decided and wanted — see _Density on
  a narrow window_, which also says what to reach for first if this measurement ever forces
  a change. Only the cost is in question here, not the appearance. A guessed reduction is
  a worse globe for a saving nobody has confirmed exists.

---

## Related files

| File                           | Covers                                           |
| ------------------------------ | ------------------------------------------------ |
| `docs/design/home.md`          | The stage: layers, margins, the globe's size cap |
| `docs/design/chrome.md`        | The corner clusters                              |
| `docs/design/sign-in-panel.md` | The panel, whose states drive this module        |
