# Globe motif — design specification

The rotating point-cloud globe at the centre of the pQuadrant home page. Build against
this file. If the code and this file disagree, one of them is wrong; fix it rather than
working around it.

Read `docs/design/home.md` first. It defines the stage the globe sits on, its size cap,
and the layers above and below it.

This file is longer than the others and different in kind. The other surfaces can be
matched against a screenshot. This one cannot: nothing about an even distribution of
nine thousand points across a sphere is recoverable by looking at a picture of it. The
numbers and methods below are the specification.

---

## What it is

A sphere of small square points, rotating slowly, drawn on a single HTML canvas. Points
over land are one colour, points over ocean another. The continents are real Natural
Earth geometry, not decoration.

It is the visual centre of the page and it responds to what the visitor does: it
brightens when a field is focused, spins up while a sign-in is processing, flinches
when credentials are rejected, scatters where the cursor passes, and dims behind the
sign-in panel so the form stays readable.

**It is not part of the sign-in surface.** The globe outlives this page's current
purpose. It is planned to become directly manipulable, to carry markers at real
coordinates, and to support zooming to a region. Build it as a self-contained module
that knows nothing about React, forms, or authentication. See _Module contract_.

---

## Terms

**Point** — one of the ~9,000 dots. Drawn as an axis-aligned square, never a circle.

**Land point / ocean point** — a point whose position falls over land, or not.
Determined once at generation time and never recomputed.

**Depth** — how near the front of the sphere a point currently is, from 0 at the back to
1 at the front. Drives both size and opacity, and is what makes the sphere read as
three-dimensional.

**Clear zone** — a rectangle where points are dimmed so content on top stays legible.
Currently the sign-in panel's footprint.

**Assemble** — the opening animation: points fly in from scattered positions and settle
into the sphere.

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

are tested against a land bitmask, described below.

### Land and ocean balance

Land covers roughly 29% of the sphere, but the design wants **64% land points and 36%
ocean points**, so the continents read clearly instead of being lost in a uniform fuzz.

This is achieved by generating more candidate points than are needed and discarding most
of the ocean ones:

```
landTarget  = round(N × 0.64)
oceanTarget = N − landTarget
total       = ceil(landTarget / 0.29)
oceanStep   = max(1, round((total × 0.71) / oceanTarget))
```

Walking the candidates in order: every land point is kept until `landTarget` is
reached, and every `oceanStep`-th ocean point is kept until `oceanTarget` is reached.
Everything else is discarded.

The even distribution is preserved within each group because the discards are regular
rather than random.

`N` is **9,000**. This is a floor, not a ceiling. It may be tuned upward toward 15,000
while watching frame time on the slowest machine that has to run it.

### The land bitmask

Source geometry is Natural Earth 50m land, rendered into a **2048 × 1024**
equirectangular bitmask: the land polygons filled white on a black field, then reduced
to one bit per pixel with a threshold at a red channel value above 110.

Sampling a coordinate against the mask:

```
u = floor(((longitude + π) / 2π) × 2048)
v = floor(((π/2 − latitude) / π) × 1024)
```

both clamped to the mask bounds.

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
the result as a compact data file. Positions and the land flag are all that is needed at
runtime. No mapping library reaches the browser, there is no fetch, and the first
assemble is the only assemble.

The generation script is part of the codebase and re-runnable, so changing the point
count or the source geometry is a build step rather than a rewrite.

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
alpha = (0.17 + 0.83 × depth^1.6) × (0.35 + 0.65 × e) × dim
        × (1 + 0.5 × glow + 0.55 × dotGlow)
```

`e` is the assemble easing value, so points fade in as they arrive. `glow`, `dotGlow`
and `dim` come from the state table below.

Then, in order:

- Ocean points: `alpha × 0.95`
- Inside the clear zone: `alpha × 0.13`
- Disturbed by the cursor: `alpha × (1 + disturbance × 1.5)`, capped at 1
- Points with `alpha ≤ 0.02` are dropped entirely

### Colour and shape

|              | Colour    | Size multiplier |
| ------------ | --------- | --------------- |
| Land points  | `#5FD98F` | ×1.1            |
| Ocean points | `#4E9BFB` | ×0.85           |

Points are **axis-aligned squares**, drawn as rectangles. Not circles, not arcs. This is
both a visual decision and a performance one; the squareness is visible at close
inspection and is part of the look.

### Opacity bucketing

Canvas cannot vary opacity within a single fill, and changing it per point would mean
9,000 separate draw calls.

Instead, opacity is quantised into **10 buckets**. Every point is assigned to the bucket
matching its computed alpha, each bucket is drawn as one path containing all its
rectangles, and the whole path is filled once at that bucket's opacity, which is
`(bucketIndex + 0.5) / 10`.

This reduces roughly 9,000 draw calls to 20: ten land buckets and ten ocean buckets. The
ocean pass applies an additional ×1.15 to the bucket opacity.

Ten buckets is enough that the banding is invisible at these point sizes. Do not reduce
the count to save work.

### Bloom

While `glow` or `dotGlow` is above 0.05, points are drawn with a shadow blur of
`12 × max(glow, dotGlow)`, coloured to match the pass: land colour for the land pass,
ocean colour for the ocean pass.

### Device pixel ratio

The canvas backing store is capped at **1.5×** the layout size, even on displays with a
higher ratio. At these point sizes the difference is not visible, and the cost of a full
3× or 4× buffer is not worth paying for a field of 1-pixel squares.

---

## Motion and states

The globe has one continuous behaviour and three states layered on top of it.

### Assemble

On first render, points begin at random positions in a cube spanning `[−2.7, 2.7]` on
each axis, each scaled by a per-point jitter factor of `0.55 + random × 0.45`, and
travel to their sphere positions over **1500ms**.

Easing is `1 − (1 − t)³`. Position at any moment is a linear blend between the scattered
and final positions using the eased value.

Rotation is also damped during assembly by a factor of `0.6 + 0.4 × e`, so the sphere
spins up as it forms rather than tumbling while scattered.

The assemble runs exactly once, on first render. It does not replay on resize, on state
change, or when the panel opens.

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

| Value            | Rate                            |
| ---------------- | ------------------------------- |
| Spin             | 6 while processing, 3 otherwise |
| Contract         | 30 on error, 6 otherwise        |
| Dim              | 8                               |
| Glow             | 5 rising, 2.6 falling           |
| dotGlow          | 6 rising, 3 falling             |
| Cursor influence | 7 rising, 3.4 falling           |
| Tilt             | 3.2                             |

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

## Cursor interaction

Where the pointer passes over the canvas, nearby points are pushed away and brightened.

```
scatterRadius = max(70, min(width, height) × 0.13)
```

For each point within that radius of the pointer, at distance `d`:

```
falloff = (1 − d / scatterRadius)^1.7 × influence
push    = falloff × scatterRadius × 0.34
angle   = jitter × 6.283 + elapsed × 0.0016 + index × 0.7

screenX += (dx / d) × push + cos(angle) × falloff × 9
screenY += (dy / d) × push + sin(angle) × falloff × 9
```

`jitter` is the same per-point value used in the assemble. The rotary term adds a slow
individual drift so the disturbed region shimmers rather than moving as a rigid blob.

Displaced points are also brightened: `alpha × (1 + falloff × 1.5)`.

**Influence** eases between 0 and 1. It targets 0 when the pointer is inside the clear
zone, and 0 when the pointer leaves the canvas entirely. The globe does not react to the
cursor while the visitor is filling in the form.

The scatter is suppressed entirely under reduced motion, and no pointer listener is
attached in that case.

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
- No cursor scatter, and no pointer listener is attached.
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

- An unused window-level mouse position tracker, separate from the working scatter input
- A `pulse` value that decays every frame and drives a draw pass whose point arrays are
  never populated
- Elliptical radii computed for the clear zone and never read
- A perspective focal length constant, declared and never used
- A frame counter that is declared and never incremented, referenced in the prototype's
  own notes as driving a throttle that does not exist

---

## Performance

Target 60 frames per second at 9,000 points on the slowest machine in the team.

The techniques that make this achievable, all of which are load-bearing:

- Positions held in typed arrays, allocated once at generation and never rebuilt
- Bucketed opacity, reducing per-frame draw calls from thousands to twenty
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
- **Any window narrower than 1024px.** No mobile behaviour has been decided, including
  whether the point count is reduced.

---

## Related files

| File                           | Covers                                           |
| ------------------------------ | ------------------------------------------------ |
| `docs/design/home.md`          | The stage: layers, margins, the globe's size cap |
| `docs/design/chrome.md`        | The corner clusters                              |
| `docs/design/sign-in-panel.md` | The panel, whose states drive this module        |
