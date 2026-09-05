# Home page — design specification

The authoritative description of the pQuadrant home page. Build against this file.
If the code and this file disagree, one of them is wrong; fix it rather than working
around it.

This file specifies the **page shell**: the surface everything else sits on, and the
rules that govern how it responds to window size. Other surfaces on this page have
their own files, listed under _Related files_.

---

## What this page is

pQuadrant has one public page. It is not a marketing site — there are no other pages,
no navigation, no scrolling content. A visitor either signs in to the pQuadrant
platform or they do not.

The page reads as a control surface, not a document. It occupies the entire browser
window at all times, uses square corners and hairline borders throughout, and places
its content at the true corners and centre of the window. Nothing is contained in a
card, a wrapper, or a centred column of fixed width.

The page currently carries one interactive surface, the sign-in panel. It is built to
carry more later: the globe becomes directly manipulable, and a terminal-style
conversational surface is added. Nothing in the shell should assume the sign-in panel
is the only thing that will ever appear on it.

---

## Terms used in this file

**Stage** — the full-window surface. It is the page. There is no element around it and
nothing outside it.

**Chrome** — the small text elements pinned at the four corners of the stage: product
names, server identifier, sign-in controls, telemetry, and clock.

**Motif** — the rotating point-cloud globe that occupies the centre of the stage. It is
drawn on an HTML canvas.

**Panel** — the sign-in form, which appears centred over the motif when opened.

---

## Layout model

The stage fills the browser viewport exactly: 100% of the viewport width and height,
with no margin, no padding and no border on the page itself.

The stage does not scroll under normal conditions. There is no content below the fold
because there is no fold. The one exception is described under _Short windows_ below.

The stage has no maximum width. On a wide monitor the corner chrome spreads to the
actual window corners rather than being constrained to a centred column. This is
deliberate: a capped width would place the interface in a floating box with dead space
around it, which reads as a webpage rather than an instrument.

---

## Background layers

Seven layers compose the stage. Listed bottom to top. Every layer spans the full stage.

**1. Stage fill**

Flat colour `#020306`. The base surface. Nothing sits below it.

**This is the black point, not the background tone.** Almost nothing on the page should
be this dark — it is the floor that everything else is measured from, and the page's
depth is the distance between it and the light above it. It keeps the faintest cool
cast, blue a few levels above red, so the deepest shadow is not a neutral hole.

The reason it is not simply `#000` is that the layer above it has to fall to nothing
somewhere, and where it does, this is what is left. A pure black floor with a sparse
star field over it reads as dead rather than deep.

**2. Ambient light**

A radial gradient, 66% of the stage width by 62% of its height, centred at 50% / 44%,
with five stops:

| Position | Colour                        |
| -------- | ----------------------------- |
| 0%       | `rgba(226, 236, 250, 0.08)`   |
| 35%      | `rgba(226, 236, 250, 0.068)`  |
| 70%      | `rgba(226, 236, 250, 0.0272)` |
| 88%      | `rgba(226, 236, 250, 0.0072)` |
| 100%     | transparent                   |

This is the layer that gives the page a tonal range. The fill below it is near-black;
this is what puts light on it, and the variation between the two is what stops the
surface reading as a slab.

**Its ellipse is deliberately smaller than the stage.** The percentages are radii, not
extents — the same reading that applies to the vignette below — so at 66% of the width
the ellipse spans just over the frame horizontally and falls well short of the corners.
That is the point. A gradient large enough to cover every pixel lifts every pixel, which
reintroduces a uniform floor at a higher value and undoes the whole layer. The corners
have to fall genuinely outside it.

The stops matter as much as the size, in two separate ways. Holding near-peak out to 35%
before falling away is what lifts the middle of the picture without lifting the edges — a
plain ramp puts its half-value close to the centre and leaves most of the frame dim.

The last two stops are there for a different reason: to bring the ramp into the fill with
almost no slope left in it. A gradient still descending when it reaches zero leaves a Mach
band at its own boundary — no step in the values, but a visible edge, because the eye reads
the change in slope rather than the change in level. Measured along a diagonal to the
corner, the three-stop version broke slope by 0.88 levels at 85% of the ray; the tail above
halves that to 0.54, which is below anything visible. If these numbers are ever retuned,
measure the slope break rather than looking for a step.

It sits **below the starfield**, so the stars sit in front of the glow rather than being
washed by it.

**Why this layer exists at all.** The reference this page is measured against paints its
hero on `#000` with no background layer whatsoever: every non-black pixel there is light
emitted by the subject, a dense particle scene bright enough to generate the entire
tonal range on its own. Our motif is a dim point-cloud globe and our field is a few
hundred stars, so we cannot emit that range — we have to synthesise it. This layer is
that synthesis. It is not decoration, and deleting it does not return the page to a
neutral state; it returns it to a black rectangle with dots on it.

**3. Starfield canvas**

A `<canvas>` element filling the stage, carrying a field of small static points.
Specified separately — see _Related files_.

It sits above the ambient light and below the centre lift, so the cool wash passes over
the stars near the middle of the stage and slightly mutes them there, and below the
vignette, so they fade toward the window edges along with everything else.

The canvas must be marked as decorative for assistive technology, since it conveys no
information a screen reader can use.

**4. Centre lift**

A radial gradient, 46% of the stage width by 52% of its height, centred at 50% / 50%,
running from `rgba(232, 238, 248, 0.05)` at the centre to fully transparent at 72%.

This is a very faint cool wash that lifts the area behind the motif so the globe does
not sit on dead black. It is close to invisible in isolation and should stay that way;
if it reads as a distinct glow, it is too strong. The wash reaches the fill again
before its 72% stop, so the stop itself is not an edge anyone can trace.

**It is near-white, not blue.** A saturated blue wash at this scale reads as a coloured
gradient laid over the page rather than as light falling on it, and that is the single
strongest tell of a synthetic interface. The cool cast belongs in the stage fill, which
carries it at low saturation across the whole surface; this layer's job is only to stop
the motif sitting on dead black, and light does that without a hue.

**5. Motif canvas**

A single `<canvas>` element filling the stage. Specified separately — see _Related
files_.

Its height is the **large viewport height** — the viewport with any retractable browser
UI retracted — rather than the current viewport height. A mobile browser retracts its
address bar as the page scrolls, and a canvas sized to the current viewport is resized
by that, which re-measures the motif part way through a scroll. The large viewport is
the one height that does not move during the transition, and being the largest it covers
the stage in both positions.

Its width must be set explicitly rather than inferred from left and right offsets. A
canvas is a replaced element, so an `auto` width resolves to its intrinsic size — which
is the backing store, which is computed from the layout size. That is a loop, and it
settles on a width several hundred pixels wider than the window.

The canvas must be marked as decorative for assistive technology, since it conveys no
information a screen reader can use.

**6. Vignette**

A radial gradient, 118% of the stage width by 88% of its height, centred at 50% / 46%,
fully transparent until 52% and reaching `rgba(0, 0, 0, 0.38)` at 100%.

Note the centre sits slightly above the middle of the stage, which pushes more of the
falloff toward the bottom corners. It sits above the canvas, so it darkens the globe's
outer edge as well as the background. This is what keeps the corner chrome legible
against the motif.

**The two percentages are radii, not extents.** 118% of the stage width is an ellipse
radius wider than the stage itself, so on a 1920px window the gradient's horizontal
reach is 2266px while the furthest pixel is 960px away. The consequence is worth
knowing before either number is touched again: along the left and right edges at
mid-height the vignette contributes nothing at all, and it only engages approaching the
corners — most at the bottom two. That is the right shape for what it is for, since the
chrome it protects sits in the corners, but it means this layer is not a uniform edge
darkening and cannot be reasoned about as one.

The 0.38 replaces a 0.6 that was chosen against an empty stage. At 0.6 the corners were
painted down to below the stage fill's own value, which was defensible when they held
nothing but chrome text and is not now that there is a starfield in them.

**This layer is now close to inert, and that is expected.** It darkens by a fraction of
what is under it, and what is under it in the corners is the near-black fill, so there
is almost nothing left to remove: sweeping it from 0.38 to 0 moves the page's luminance
distribution not at all. It mattered when the fill was a lifted tone and it would matter
again if the fill rose or the motif grew, which is why it is kept rather than deleted.
Do not read its presence as evidence that it is doing visible work today, and do not
reach for it as a lever — at this fill value it does not have the authority to be one.

**7. Auth bloom**

A radial gradient composited in screen blend mode, 42% of the stage width by 46% of its
height, centred at 50% / 50%, with three stops:

| Position | Colour                     |
| -------- | -------------------------- |
| 0%       | `rgba(49, 131, 245, 0.42)` |
| 46%      | `rgba(79, 209, 131, 0.16)` |
| 78%      | `rgba(49, 131, 245, 0)`    |

The layer is at zero opacity at rest and becomes visible only while a sign-in attempt
is being processed, transitioning over 520ms with an ease. The green midpoint is
deliberate: it echoes the land points in the motif, so the flash reads as the globe
lighting up rather than as an unrelated overlay.

This layer is suppressed entirely when the user has requested reduced motion.

**Pointer behaviour**

Layers 1, 2, 3, 4, 6 and 7 must not intercept pointer events. Only the motif canvas and
the chrome and panel above it are interactive.

**Colour scheme**

There is no light mode. The stage fill is the surface colour in every condition, and
the page does not respond to the operating system's colour scheme preference.

The document declares a dark colour scheme, so the parts of the page the browser draws
rather than the stylesheet — scrollbars, form controls, focus rings, and the background
the browser paints behind an autofilled field — are drawn dark. Autofill is the reason
this is not optional: the panel's fields must accept password managers, and a browser
filling them paints its own near-white background over the field, which no rule in the
stylesheet can override.

**Reach of the stage fill**

The stage fill must cover the document, not only the element that draws the other six
layers. Overscrolling past the top or bottom edge exposes the document's background, so
a fill applied to the stage element alone leaves a white band at the point of the
rubber-band. The same applies to the scrolling case described under _Short windows_.

**Prohibited on the stage**

No curvature, no displacement or SVG filters, no scanline texture, no noise or grain,
no backdrop blur, no frosted glass, no border radius anywhere, and no border on the
stage itself. Borders elsewhere on the page are 1px only. The only box shadow on the
entire page is the glow on the sign-in button while it is processing.

---

## Margins

Chrome sits **64px** from the left and right window edges, and **64px** from the bottom
edge.

The top edge is not uniform. The two top clusters are aligned optically rather than to
a shared grid line, because they contain type at different sizes and one of them is a
bordered control. Their exact offsets are given in the chrome specification. Do not
normalise them to a single value.

The horizontal margin has three tiers, and only the horizontal margin moves — the
bottom margin is **64px** at every width, because only the horizontal axis runs out of
room.

| Window width     | Horizontal margin |
| ---------------- | ----------------- |
| 1100px and wider | 64px              |
| 640px to 1100px  | 40px              |
| Below 640px      | 24px              |

Below 1100px the top-left and top-right clusters begin closing on each other and the
widest margin runs them together. Below 640px the clusters stack — see the chrome
specification — and 24px is what the stacked composition needs to clear 320px, the
narrowest window supported.

**Safe areas.** The page declares `viewport-fit: cover`, so the stage reaches under a
notch, a dynamic island and a home indicator rather than being letterboxed inside them.
The margins above are then measured from the edge of the _usable_ display: the device's
safe-area inset is added to the margin, not substituted for it. The design's 62px top
offset means 62px clear of the island, not 62px from a point underneath it. On a display
with no inset the addition is zero and nothing moves.

Only the chrome takes the insets. The motif spans the whole stage, insets included, and
the panel is centred far from any of them.

---

## Motif sizing

The motif's radius is:

```
radius = min(window width, window height) × 0.44
```

capped at a maximum of **396px**.

396px is the radius this formula produces at 1440 × 900, which is the size the design
was composed at. Without the cap the globe continues growing on large monitors and the
relationship between the globe, the panel and the corner chrome no longer matches the
design. Below that threshold the globe scales down with the window as the formula
describes.

---

## Panel placement

The panel is **400px** wide, centred horizontally and vertically on the stage.

Where 400px plus its clearance does not fit, the panel narrows to the window rather than
holding 400px: its width is 400px or the window width less twice the narrow margin,
whichever is smaller. At 320px the panel is 272px. It must never be allowed to shrink
into its own clearance and sit edge to edge, which is what a fixed width on a flexible
element does when the window is narrower than the width.

It must never come closer than **64px** to the top or bottom edge of the window.

The panel has a fixed height that does not change between its states, so its position
is stable and nothing on the page moves when its contents change. The panel's own
specification covers this — see _Related files_.

---

## Window size behaviour

**Short windows.** The stage is at least the height of the window, and taller only when
something on it does not fit. In practice that means one case: the panel is open on a
window too short to hold it and its clearance. Then the page scrolls, which is correct
behaviour — clipping is not, and content must never be silently cut off. The motif
remains fixed behind the scrolling content.

**With the panel closed the page does not scroll at any window size.** There is no
content below the fold on this page, so a scroll with nothing on screen that needs it is
revealing empty room reserved for something that is not there. This matters most on a
phone, where every window is shorter than the panel and the reservation would otherwise
apply always. It is also what keeps the corner chrome in place: the chrome is positioned
in the document and the motif is fixed, so any scroll slides the frame across the
instrument.

**The clearance is the padding.** The stage does not compute a minimum height from the
panel's height. It reserves 64px above and below its content and lets the content decide
the rest, so the panel keeps its clearance without the stage needing to know how tall the
panel is. A stated minimum said the same thing a second time and the two could disagree —
and would, the moment the panel's height changed.

**Wide windows.** No maximum width. Chrome remains pinned to the window corners at the
margins described above. The motif is capped as described above, so on very wide
windows the globe holds its size while the corners spread further apart.

**Narrow windows.** Below **640px** the page keeps its composition and changes the
direction most of the chrome runs in. Nothing is hidden, no type is scaled, and all four
corners stay corners. The full rule, including which cluster stays a row, is in the
chrome specification; the stage's part of it is the 24px margin tier and the panel width
above.

**320px is the narrowest window supported.** Below that the composition is not defined
and is not verified.

There is no tablet composition. Between 640px and 1100px the page uses the desktop
composition at the 40px margin, and that is all a tablet gets. Two breakpoints exist and
a third should not be added: the page has one composition and one reflow of it, not a
ladder of device sizes.

**Verify at these window sizes:**

| Size                        | Why                                                       |
| --------------------------- | --------------------------------------------------------- |
| 320 × 568                   | The narrowest window supported; the tightest gutter       |
| 360 × 640                   | Common small Android                                      |
| 390 × 844                   | Common iPhone, the size the mobile problem was found at   |
| 430 × 932                   | Large iPhone                                              |
| 768 × 1024                  | Tablet portrait, on the desktop composition               |
| 844 × 390                   | Phone in landscape: short and wide at once                |
| 1512 × 855                  | 14-inch MacBook Pro, the primary development machine      |
| 1440 × 900                  | The size the design was composed at                       |
| 1920 × 1080                 | Common external monitor                                   |
| 2560 × 1440                 | Confirms the motif cap holds and the composition survives |
| Any window under 700px tall | Confirms the page scrolls rather than clipping            |

Verify with a coarse pointer as well as a fine one. They are different compositions and
different behaviour, not the same page at two sizes.

At every width, the check is that no two chrome clusters overlap **and** that every
string is still on screen. A string that has gone missing is a failure, not a pass — the
rule is that nothing is hidden.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Any window narrower than 320px.** The composition is not defined below the narrowest
  supported window and is not verified there.
- **Print styles, offline state, and error pages.**

---

## Related files

| File                           | Covers                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| `docs/design/chrome.md`        | The chrome: the four corner clusters, content and type       |
| `docs/design/globe.md`         | The motif: geometry, projection, colour, motion, interaction |
| `docs/design/sign-in-panel.md` | The sign-in panel: structure, states, form behaviour         |
