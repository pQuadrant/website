# Starfield — design specification

The authoritative description of the starfield layer on the pQuadrant home page.
Build against this file. If the code and this file disagree, one of them is wrong; fix
it rather than working around it.

This file specifies **one background layer**: a field of small static points spread
across the whole stage, and how that field responds to the pointer. The stage itself,
its margins and its sizing rules are specified in `home.md`. The globe is specified in
`globe.md`. Read `home.md` first — the terms used here are defined there.

---

## What this layer is for

The stage is currently a flat black surface with a globe on it. Black with nothing in
it does not read as space; it reads as an unlit screen. The corners in particular look
dead, because there is nothing in them and the vignette is actively darkening them.

The starfield gives the surface depth. It establishes that the globe is sitting _in_
something rather than floating on a void, and it gives the outer thirds of the window
something to be.

It is a background. It carries no information, it is never interactive in the sense of
being clickable, and nothing on the page depends on it. If it failed to render the page
would still be entirely usable.

**What it is not.** It is not a particle system, not a screensaver, and not decoration
that draws the eye. A visitor should register it as texture and then stop noticing it.
If someone's attention goes to the stars rather than the globe or the sign-in control,
it is too strong.

---

## Position in the layer stack

This layer sits **directly above the stage fill** and carries two things: the ambient
light and the stars. They are on **two canvases, not one**, stacked in that order — see
_Rendering_ for why. The full stack, bottom to top:

| #   | Layer                    |
| --- | ------------------------ |
| 1   | Stage fill               |
| 2   | **Ambient light canvas** |
| 3   | **Star canvas**          |
| 4   | Motif canvas             |
| 5   | Vignette                 |
| 6   | Auth bloom               |

There is no centre lift. One used to sit between this canvas and the motif, a faint cool
wash on the reasoning that the globe should not sit on dead black. That reasoning was
backwards and it is worth knowing why, because it is the same mistake the ambient light
was built to avoid: the motif is a **transparent point cloud**, so anything luminous
behind it shows through the gaps between its points, and those gaps are what its
continents are read against. Measured, that layer alone took the globe from 44:1 between
its bright points and the gaps down to 14:1. The globe sits on the black point
deliberately.

Placing this canvas below the vignette means the stars fade toward the window edges along
with everything else. That is intentional — a starfield at uniform brightness edge to edge
looks like a wallpaper tile.

The canvas must not intercept pointer events, and must be marked decorative for
assistive technology. It conveys nothing a screen reader can use.

---

## The field

### How many stars

Star count scales with the area of the stage, so the field has the same visual density
on a laptop and on a large monitor:

```
count = round(stageWidth × stageHeight / 3000)
```

clamped to a minimum of **220** and a maximum of **900**.

**This is a count of stars that survive the falloff below, not of candidates offered to
it.** Candidates are drawn until the count is met. The distinction is the whole reason
the formula exists: the region the falloff empties is sized by the motif radius, not by
the stage, so the two readings are not a constant factor apart — they diverge with the
window's shape. Counting candidates instead would keep only 26% of them on a 768 × 1024
window against 75% on a 2560 × 1440 one, and the density the formula is meant to hold
steady would swing threefold between two supported windows.

At 1440 × 900 this produces 432 stars. At 2560 × 1440 the clamp holds the count at 900,
so a very large monitor is slightly sparser per square pixel than a laptop. This is
correct: at that size the viewer is usually further from the screen.

### Where they go

Positions are uniform random across the stage, then filtered by a **radial density
falloff** centred on the middle of the stage.

The globe is a transparent point cloud, not a solid object. Stars drawn behind it would
mix with its own green and blue points and read as noise inside the sphere. So the
field thins to nothing in the region the globe occupies.

Let `R` be the motif radius as computed in `home.md`, and `d` the distance of a
candidate star from the stage centre, expressed as a multiple of `R`. The probability
that a candidate is kept is:

| `d`         | Keep probability       |
| ----------- | ---------------------- |
| ≤ 1.00      | 0                      |
| 1.00 → 1.70 | smoothstep from 0 to 1 |
| ≥ 1.70      | 1                      |

Use a genuine smoothstep (`t² × (3 − 2t)`), not a linear ramp. A linear ramp leaves a
faintly visible ring where the density changes slope. The smoothstep does not.

Rejected candidates are discarded, not repositioned — the generator draws another one
rather than moving the one it rejected, which is what makes the count above a count of
survivors.

### How they look

Each surviving star is assigned a **magnitude** and a colour. Everything else about its
appearance is derived from the magnitude. There are no tiers and no size classes: a star
is one number, and the number decides how large it is, how bright it is, whether it
glows, and how much of its colour survives in the middle.

**Magnitude.** Drawn from a power distribution, not a uniform one:

```
m = u ** 2.8
```

where `u` is uniform 0–1 from the seeded generator. This puts roughly 44% of the field
below 0.1 and about 8% above 0.8. The lopsidedness is the point. An even spread of
brightnesses reads as speckle — a regular dusting of dots at one size — because a real
field is overwhelmingly made of points at the edge of visibility, with a few that carry
it.

**Additive compositing.** Every star is drawn with `globalCompositeOperation = 'lighter'`,
so light adds to what is under it rather than covering it. This is the difference
between a star that emits and a dot of paint sitting on the background, and it is why
two overlapping halos sum the way two real sources would. The canvas stays transparent,
so it still composes correctly over the stage fill.

The mode is set immediately before the stars are drawn and restored afterwards, never
once for the lifetime of the context. It is not this function's to leave modified, and a
mode left set outlives the frame that set it.

**Core.** A hard-edged filled circle. No gradient, no soft edge — the only softness
anywhere on a star is the halo around it.

| Property | Rule                              |
| -------- | --------------------------------- |
| Radius   | `0.35 + m × 1.35` px, so 0.35–1.7 |
| Alpha    | `0.30 + m ** 0.55 × 0.70`         |

**The sub-pixel rule.** Never draw a circle below **0.5px** radius. Anti-aliasing turns
a sub-pixel circle into a smudge, which is the exact artefact this model exists to
remove. Below the floor the radius is held at 0.5 and the shortfall is paid in alpha
instead, scaled by `(computed / 0.5) ** 2` — squared, because the light a disc carries
goes with its area. Brightness carries what size cannot.

This applies to roughly 47% of the field, so it is not an edge case; it is how the faint
majority is drawn. They must stay **sharp**. Faint does not mean blurry: a field of tiny
crisp points reads as real, and a field of dim soft ones reads as dust on the screen.

**Halo — only on the brightest.** A star at `m ≤ 0.80` gets **no halo at all**. Around
92% of the field is a bare core. This is the most important rule in this section: a halo
on every star is what makes a field read as a scattering of grey discs rather than as
points of light.

| Property   | Rule                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| Radius     | `coreRadius × (4 + m × 5)`, so 4×–9×                                   |
| Peak alpha | `((m − 0.80) / 0.20) × 0.16`                                           |
| Falloff    | Radial gradient, peak at centre to fully transparent at the outer edge |

The peak alpha is zero exactly on the threshold, so halos fade in rather than switching
on. There is no magnitude at which a star visibly acquires a glow, which is what stops
the glowing and bare populations reading as two populations.

**Bloom.** Stars above `m = 0.96` — around 1.5% of the field, a handful on screen —
extend instead to `coreRadius × 12` at a peak alpha of 0.20. These are the few that
carry the field's sense of depth.

Halos are drawn _inside the canvas_ as gradient fills. They are not a CSS `box-shadow`
and not a blur filter. `home.md` prohibits both of those on the stage and that
prohibition still stands.

**Colours.**

| Share | Colour               | Notes                                           |
| ----- | -------------------- | ----------------------------------------------- |
| 78%   | `rgb(226, 234, 246)` | Cool white. The default star.                   |
| 14%   | `rgb(120, 168, 240)` | Blue. Relates to the auth bloom blue `#3183F5`. |
| 8%    | `rgb(240, 196, 148)` | Warm amber.                                     |

The amber is deliberately the odd one out. It stops the field reading as a single
monochrome dust and gives it the sense of being made of different objects at different
distances. It is also the only warm colour anywhere on the page, which is why it is
held to 8%.

Colour does not depend on magnitude. It does not need to, because of the rule below.

**Bright cores desaturate toward white.** Blend the star's colour toward pure white by
`m ** 2`, and use the blended colour for the core while the halo keeps the star's full
colour. Only the brightest cores go white-hot, and the tint stays in the glow around
them. This is how a bright point actually renders — the centre saturates and the colour
survives at the edges — and it is a large part of why the reference reads as
photographic rather than drawn.

The faint majority keeps its full colour. Those are the stars carrying the palette.

**Under review.** The amber share and the exact amber value are provisional and expected
to be adjusted once the field is on screen. Keep the ratio and the colour as named
constants so they can be changed in one place.

### Determinism

The field is generated from a **seeded pseudo-random generator with a fixed seed**, not
from `Math.random()`.

Two reasons. Review: a reviewer comparing a screenshot against the design needs the
same field every time. And resize: the field is regenerated when the window changes
size, and with an unseeded generator every resize would scatter a completely different
sky, which is distracting to watch.

`mulberry32` is sufficient. Any small deterministic PRNG is fine. Do not use a
cryptographic one.

---

## Ambient light

This canvas carries one thing besides the stars: the ambient glow that gives the whole
page its tonal range. The stage fill beneath it is a black point, near enough to nothing;
this is what puts light on it.

It is painted first, before any star, so the stars sit in front of it rather than being
washed by it.

**It is dark through the motif and brightens outward.** That is the opposite of where a
glow instinctively belongs, and the reason is the motif itself: the globe is a transparent
point cloud, so light behind it passes between its points and lifts the gaps. The gaps are
what its continents are read against, so lighting them destroys the thing they are for.
Measured, a lit centre costs the globe most of its local contrast. The light goes around
the motif, not behind it.

| Property   | Rule                                                               |
| ---------- | ------------------------------------------------------------------ |
| Inner edge | Nothing at all inside **1.35 × the motif radius**                  |
| Ramp       | Smoothstep, from the inner edge to the stage's far corner          |
| Peak alpha | **0.038**, reached only at the corner                              |
| Colour     | `rgb(226, 236, 250)` — near-white, the same cool cast as the field |

**Everything here is in multiples of the motif radius, which is why it is on this canvas
at all.** A CSS gradient's stops are relative to the stage; the motif radius is
`min(width, height) × 0.44` capped at 396. The two are different functions of the window,
so they drift apart as it changes — a gradient tuned to clear the globe at one size puts
its ramp on the globe's rim at another, which reads as a halo welded to the sphere. This
layer was built in CSS first and did exactly that. Anchored to the motif instead, the
relationship holds at every size by construction, the same way the density falloff does.

The two numbers trade against each other and against one thing: how much the corner
stars stand out. Lower the peak or push the inner edge out and the corner background
darkens, so the stars in it read harder; the cost is that the page as a whole gets
darker, and past a point the corners stop being part of the composition at all. At the
values above the corner background sits a little under the reference's, and the stars
there stand about sixteen times clear of it.

**The ramp is monotonic.** It only ever brightens from the inner edge outward, never
turning over. A glow that peaked somewhere in the middle of the stage would put a visible
ring on the page at whichever window size moved that peak inside the frame.

The gradient is sampled into twelve stops rather than left to the browser's linear
interpolation between two, so the smoothstep leaves the inner edge and arrives at the
corner with no slope in it. A ramp still moving when it lands shows an edge at its own
boundary, which on a surface this dark is visible even though no value steps.

---

## Rendering

The starfield is drawn on its own `<canvas>` elements filling the stage. It does not
share the motif's canvas — the two have different lifecycles and different redraw
triggers, and combining them would couple the globe's animation loop to a layer that is
usually not animating at all.

**Two canvases: the ambient light below, the stars above.** They are split on exactly the
same reasoning, one level down. The stars move under the pointer and the ambient light
never moves at all, so sharing a canvas would mean the frame loop erasing and repainting
the whole background sixty times a second in order to move the points in front of it —
work spent on something that cannot change, and a background exposed to every rounding
error in the redraw. Built that way first, and what it produced was a faint shimmer over
the entire stage whenever the cursor moved: the dark space appearing to move with the
stars, which is the one thing this layer must not do. Kept apart, the background is drawn
once per size and is then incapable of moving, which is verifiable rather than tuned — at
1440 x 900, zero pixels of it change across a full sweep of the pointer.

The cost of the split is that the stars now composite over the ambient light through the
browser rather than being added to it inside one canvas. Where a star core is opaque it
replaces the light beneath instead of summing with it, which at the ambient's peak alpha
of 0.038 is at most a 3.5% difference on the very brightest cores and nothing at all on
the faint majority. Stars still sum with each other, which is the part that matters.

**Device pixel ratio.** The canvas backing store is scaled by `window.devicePixelRatio`,
capped at **2**. Above 2 the extra pixels are not visible on a sub-pixel dot and the
memory cost is real. Without any scaling the stars render as fuzzy squares on a retina
display.

**Compositing.** See _How they look_: the field is drawn additively, and the composite
mode is set per drawing stage rather than once on the context.

**At rest, nothing runs.** Once the field has been drawn and the pointer response has
settled, there is no animation frame loop, no timer and no listener doing per-frame work.
Idle CPU cost is zero. This is a hard requirement, not an optimisation — the page is
expected to sit open on someone's second monitor for hours.

**Resize.** On window resize, wait for the resize to settle (debounce, ~150ms), then
recompute the count, regenerate the field from the seed, and redraw. Do not stretch or
scale the existing canvas content — a scaled starfield has visibly oval stars.

The field jumping to a new arrangement on resize is acceptable and expected. Do not
attempt to animate between the old field and the new one.

---

## Pointer response

At rest the field is completely still. There is no twinkle, no drift, no ambient
animation of any kind. Motion happens only in response to the pointer.

### The behaviour

The cursor brushes past a star, the star gives a little in the direction the cursor was
travelling, and then over the next several seconds it drifts back to exactly where it
was. The effect is small, local and sharp: a few points of light nudged as the cursor
passes them, not a region of sky disturbed.

Three things it is not, each of which it has been at some point and each of which was
wrong on screen:

- **Stars orbiting or chasing the cursor.** It is not a pointer-follower.
- **Stars shoved out of the cursor's way.** A generous displacement reads as a repulsion
  field ploughing through the sky. The push is deliberately small enough that a star stays
  recognisably where it belongs.
- **Stars trailing smears behind them.** See _Why there is no smear_ below.

### The model

Every star has a fixed **home position** — where the generator put it. It also has a
current position and a velocity. Home never changes until the field is regenerated.

Each frame, for every star currently displaced or within the influence radius:

1. **Drag.** If the star is within the influence radius of the pointer, add a fraction
   of the pointer's velocity to the star's velocity, scaled by how close it is.
2. **Damping.** Multiply the velocity by a damping factor so it decays. This is what ends
   the nudge: a few frames after the cursor has passed, the star has stopped travelling.
3. **Integrate.** Add velocity to position.
4. **Return.** Move the position itself a small fraction of the way toward home.
5. **Clamp.** If the star is further than the maximum displacement from home, pull it
   back to that distance.

**Steps 2 and 4 are different kinds of thing, and that is the whole character of the
effect.** The nudge is a velocity that decays; the return is a rate applied to the
position. A rate cannot overshoot at any strength — a star closes a percentage of the
remaining gap each frame, so it moves quickly when it is far from home, slows as it
arrives, and stops.

The obvious alternative is a spring: a pull toward home added to the velocity, which is
what this specification asked for originally. Do not go back to it. A spring accelerates
a star homeward, so it arrives carrying speed, sails past, and comes back — every sweep
of the cursor leaves the field wobbling like jelly for a second afterwards. It was built
that way first and that is exactly how it read.

Values:

| Parameter        | Value                  | What it does                                          |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| Influence radius | 175px                  | How far from the pointer stars are affected           |
| Distance falloff | `(1 − dist / radius)²` | Squared, so the effect concentrates near the pointer  |
| Drag strength    | 0.21                   | Fraction of pointer velocity transferred to a star    |
| Damping          | 0.88                   | Per-frame decay of that nudge                         |
| Return rate      | 0.012                  | Share of the remaining distance home closed per frame |
| Max displacement | 18px                   | Ceiling on how far any movement can throw a star      |

Tuned by eye on screen at 1440 x 900, and held as named constants in one object. The
influence radius and the maximum displacement are the two that decide whether this reads
as a cursor or as a force field; the return rate decides how long the field takes to
forget. At 0.012 a fully displaced star is halfway home in about a second and all the way
in around eight, which is the intended slow settle rather than a snap back.

The max displacement clamp is not optional. Without it a fast diagonal flick across the
whole window throws stars hundreds of pixels and the field visibly tears apart. Measured
at 1440 x 900 under the most violent pointer movement available, no star exceeds the
ceiling: the furthest any star is drawn from its home is 18.00px.

**Pointer velocity** is the difference between the current and previous pointer
positions, smoothed across roughly three frames as an exponential average. Raw
frame-to-frame deltas are noisy and produce a jittery, twitchy drag.

### Why there is no smear

This specification previously called for one: a trail behind each displaced star,
achieved by erasing a fraction of the canvas's alpha each frame with `destination-out`
rather than clearing it, so what a star left behind decayed over the following frames.

**It was built, and it is wrong here.** A partial erase does not leave the star behind —
it leaves the entire previous frame behind, at 65% strength, and on a field of small
points over near-black what that reads as is a haze settling over the space whenever the
cursor moves. It looks like a blur on the background rather than like motion.

Every frame therefore clears its canvas completely and repaints the field. A frame during
the drag and a frame at rest are the same call with the stars in different places, which
also makes two of the acceptance criteria true by construction rather than by cleanup:
there is never any residue to remove, and the settled field is pixel-identical to the
field before the pointer touched it. Measured, after a heavy disturbance: zero pixels
differ.

A star is a point of light. It stays one.

### Stopping

When the pointer has not moved for a moment **and** every star has settled within 0.1px
of its home position with near-zero velocity, snap every star to its home, redraw the
field once at rest, and **cancel the animation frame loop entirely**.

The snap matters: within 0.1px is close enough to stop animating and not close enough to
leave on screen. Snapping makes the final positions the generator's own numbers rather
than floats that arrived near them, which is what "every star returns to exactly where it
started" means.

Because the return is a slow drift, the loop goes on running for several seconds after
the cursor has stopped — around eight at 60fps after a full-strength displacement. That is
the cost of the settle being slow, it is bounded, and it ends in a cancelled loop rather
than an idling one.

Restart it on the next pointer movement over the stage.

The loop must not idle. A running-but-doing-nothing loop is the most likely way this
layer ends up costing battery, and it will not show up in review because the page looks
identical either way.

### When there is no pointer response

The field is static, and no animation loop is ever started, when any of these hold:

- The user has requested reduced motion (`prefers-reduced-motion: reduce`).
- The device has no hover-capable pointer (`(hover: none)`) — phones and tablets.
- The pointer has left the window.

A static starfield is a complete, correct experience. Nothing is missing without the
drag.

---

## Interaction with other surfaces

**The globe.** `globe.md` specifies its own cursor behaviour, and both layers respond to
the same pointer, so they must not fight: the globe's response has to stay the dominant
one near the centre of the stage.

**Checked, and it does.** At 1440 x 900 the globe scatters points within 117px of the
cursor, pushes them up to about 40px, and brightens them by up to 2.5x as it does. The
starfield reaches 175px, moves a star at most 18px, and changes no star's brightness at
all. Where the two overlap — the ring just outside the disc, since the density falloff
leaves no stars inside it — the globe moves its points more than twice as far, on a far
denser population, and is the only one of the two that lights up. There is no competition
to resolve.

The overlap is also smaller than it was: the influence radius came down from 260px to
175px during tuning, for reasons that had nothing to do with the globe.

**The sign-in panel.** When the panel is open, the pointer is over a form. The starfield
continues to respond normally in the area outside the panel. Do not suppress it, but do
check that dragging stars behind an open panel does not read as a bug.

**The auth bloom.** The bloom is composited in screen blend mode above everything. It
will brighten the stars underneath it during a sign-in attempt. This is fine and needs
no special handling.

---

## Narrow windows

Nothing in this file is width-conditional. The count formula is driven by stage area and
the density falloff by the motif radius, and `home.md` defines both at every supported
width, so the field composes itself correctly from 2560px down to 320px with no separate
rule and no second breakpoint.

Two consequences are worth stating rather than discovering. On a narrow window the motif
radius is a large fraction of the stage, so most of the stage is inside the falloff and
the field is mostly the outer band — that is correct, not a bug. And the minimum count of
220 does the work at small sizes: at 320 × 568 the area formula asks for 61 and the clamp
raises it to 220, which is the number of stars that actually land.

Touch devices get the static field, which is the whole of this ticket's field anyway.

---

## Verification

The window sizes from `home.md` apply here unchanged. In addition:

| Check                      | What to look for                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Load at 1440 × 900         | Stars across the whole window, thinning to nothing behind the globe                                   |
| Look at the falloff edge   | No visible ring or hard boundary where density changes                                                |
| Reload twice               | Identical field both times                                                                            |
| Retina display             | Stars are crisp dots, not fuzzy squares                                                               |
| Idle for 30 seconds        | No animation frames running, CPU at zero                                                              |
| Slow pointer sweep         | Stars give where the cursor passes and drift back; no jitter, no wobble as they arrive                |
| Fast diagonal flick        | No star thrown far, no trail or haze behind them, field recovers to its exact arrangement             |
| Background during a sweep  | The dark space does not move at all. Anything shimmering on it is a bug, not an effect                |
| Reduced motion on          | Field renders, nothing moves, no loop starts                                                          |
| Resize slowly              | Field regenerates, no stretched or oval stars, no empty gap                                           |
| Click chrome and sign-in   | Canvas does not block any pointer target                                                              |
| Ambient, globe rim outward | Brightness rises monotonically to the corner. Any rise-then-fall is a halo welded to the sphere       |
| Ambient, amplified         | Multiply the background layers by nine and look: a smooth field, no ring, no band                     |
| Globe local contrast       | Bright points against the gaps between them, measured inside the disc. Tens to one, not single digits |

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Touch interaction.** Touch devices get the static field. No tap or swipe response
  has been designed.
- **Any relationship between the starfield and application state.** The field does not
  react to sign-in success or failure, does not change over time of day, and does not
  encode anything.

---

## Related files

| File                           | Covers                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| `docs/design/home.md`          | The stage: layout model, layers, margins, window behaviour   |
| `docs/design/globe.md`         | The motif: geometry, projection, colour, motion, interaction |
| `docs/design/sign-in-panel.md` | The sign-in panel: structure, states, form behaviour         |
