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

The starfield sits **directly above the stage fill and below the centre lift**. The
full stack, bottom to top, becomes:

| #   | Layer                |
| --- | -------------------- |
| 1   | Stage fill           |
| 2   | **Starfield canvas** |
| 3   | Centre lift          |
| 4   | Motif canvas         |
| 5   | Vignette             |
| 6   | Auth bloom           |

Placing it below the centre lift means the faint cool wash passes over the stars near
the middle of the stage and slightly mutes them there. This is intentional. It softens
the transition into the empty region around the globe.

Placing it below the vignette means the stars fade toward the window edges along with
everything else. Also intentional — a starfield at uniform brightness edge to edge
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

Each surviving star is assigned a tier, a colour and an opacity.

**Tiers.** Radii are in CSS pixels, before device-pixel-ratio scaling.

| Tier | Share | Core radius | Base opacity |
| ---- | ----- | ----------- | ------------ |
| Far  | 72%   | 0.5 – 0.9px | 0.15 – 0.35  |
| Mid  | 22%   | 0.9 – 1.4px | 0.35 – 0.60  |
| Near | 6%    | 1.4 – 2.2px | 0.60 – 0.85  |

Values within each range are randomised per star. The point of three tiers is parallax
without motion: a field of identical dots reads flat, a field with a clear size
hierarchy reads deep.

**Near-tier halo.** Near stars get a soft halo: a radial gradient from the star's
colour at full assigned opacity in the centre, to fully transparent at **3× the core
radius**. Far and mid stars are drawn as flat filled circles with no halo.

This halo is drawn _inside the canvas_ as a gradient fill. It is not a CSS `box-shadow`
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

Bias the warm and blue stars toward the **mid and near tiers**. A coloured star at 0.5px
and 0.2 opacity is indistinguishable from a white one, so spending the colour budget on
the far tier wastes it. A reasonable rule: far-tier stars are 92% cool white; mid and
near tiers carry most of the blue and amber.

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

## Rendering

The starfield is drawn on its own `<canvas>` element filling the stage. It does not
share the motif's canvas — the two have different lifecycles and different redraw
triggers, and combining them would couple the globe's animation loop to a layer that is
usually not animating at all.

**Device pixel ratio.** The canvas backing store is scaled by `window.devicePixelRatio`,
capped at **2**. Above 2 the extra pixels are not visible on a sub-pixel dot and the
memory cost is real. Without any scaling the stars render as fuzzy squares on a retina
display.

**At rest, nothing runs.** Once the field is drawn, there is no animation frame loop, no
timer and no listener doing per-frame work. Idle CPU cost is zero. This is a hard
requirement, not an optimisation — the page is expected to sit open on someone's second
monitor for hours.

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

Moving the pointer across the stage drags nearby stars along with it. When the pointer
moves away or stops, the displaced stars ease back to where they started. Moving fast
displaces more stars, further, and leaves a brief smear behind them.

The feeling to aim for is stirring a still liquid. Not a magnetic repulsion field, not
stars orbiting the cursor, and not a "trail of particles follows your mouse" effect.

### The model

Every star has a fixed **home position** — where the generator put it. It also has a
current position and a velocity. Home never changes until the field is regenerated.

Each frame, for every star currently in motion or within the influence radius:

1. **Drag.** If the star is within the influence radius of the pointer, add a fraction
   of the pointer's velocity to the star's velocity, scaled by how close it is.
2. **Spring.** Add a pull back toward the home position, proportional to how far the
   star has strayed from it.
3. **Damping.** Multiply the velocity by a damping factor so it decays.
4. **Integrate.** Add velocity to position.
5. **Clamp.** If the star is further than the maximum displacement from home, pull it
   back to that distance.

Starting values:

| Parameter        | Value                  | What it does                                         |
| ---------------- | ---------------------- | ---------------------------------------------------- |
| Influence radius | 260px                  | How far from the pointer stars are affected          |
| Distance falloff | `(1 − dist / radius)²` | Squared, so the effect concentrates near the pointer |
| Drag strength    | 0.22                   | Fraction of pointer velocity transferred to a star   |
| Spring stiffness | 0.035                  | How hard a star is pulled home                       |
| Damping          | 0.86                   | Per-frame velocity decay                             |
| Max displacement | 40px                   | Ceiling on how far a violent flick can throw a star  |

These are a starting point and are expected to be tuned by eye. Keep them as named
constants in one object.

The max displacement clamp matters. Without it, a fast diagonal flick across the whole
window throws stars hundreds of pixels and the field visibly tears apart.

**Pointer velocity** is the difference between the current and previous pointer
positions, smoothed across a few frames. Raw frame-to-frame deltas are noisy and produce
a jittery drag.

### The smear

Fast pointer movement leaves a short trail behind each displaced star.

This is achieved by **not fully clearing the canvas each frame**. Instead of
`clearRect`, erase a fraction of the existing alpha each frame:

```
ctx.globalCompositeOperation = 'destination-out';
ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
ctx.fillRect(0, 0, width, height);
ctx.globalCompositeOperation = 'source-over';
// then draw stars
```

`destination-out` is used rather than painting a translucent black rectangle because the
canvas must stay transparent — the stage fill below it has to show through. Painting
black would make this canvas opaque and would need to be kept in sync with the stage
fill colour forever.

0.35 gives a trail of roughly three frames. Higher fades faster and smears less.

### Stopping

When the pointer has not moved for a moment **and** every star has settled within 0.1px
of its home position with near-zero velocity, do a final full `clearRect`, redraw the
field once at rest, and **cancel the animation frame loop entirely**.

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

**The globe.** `globe.md` specifies its own cursor behaviour. Both layers respond to the
same pointer, and they must not fight: the globe's response should remain the dominant
one near the centre of the stage. The density falloff helps here — there are no stars
in the globe's region — but the influence radius reaches 260px beyond the pointer, so a
pointer just outside the globe will be doing both things at once. Check this on screen
before closing ticket 3.

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

| Check                    | What to look for                                                    |
| ------------------------ | ------------------------------------------------------------------- |
| Load at 1440 × 900       | Stars across the whole window, thinning to nothing behind the globe |
| Look at the falloff edge | No visible ring or hard boundary where density changes              |
| Reload twice             | Identical field both times                                          |
| Retina display           | Stars are crisp dots, not fuzzy squares                             |
| Idle for 30 seconds      | No animation frames running, CPU at zero                            |
| Slow pointer sweep       | Stars lean and return; no jitter                                    |
| Fast diagonal flick      | Visible smear, no stars thrown off course, field recovers           |
| Reduced motion on        | Field renders, nothing moves, no loop starts                        |
| Resize slowly            | Field regenerates, no stretched or oval stars, no empty gap         |
| Click chrome and sign-in | Canvas does not block any pointer target                            |

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
