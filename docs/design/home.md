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

Five layers compose the stage. Listed bottom to top. Every layer spans the full stage.

**1. Stage fill**

Flat colour `#080A0F`. The base surface. Nothing sits below it.

**2. Centre lift**

A radial gradient, 46% of the stage width by 52% of its height, centred at 50% / 50%,
running from `rgba(168, 196, 240, 0.055)` at the centre to fully transparent at 72%.

This is a very faint cool wash that lifts the area behind the motif so the globe does
not sit on dead black. It is close to invisible in isolation and should stay that way;
if it reads as a distinct glow, it is too strong.

**3. Motif canvas**

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

**4. Vignette**

A radial gradient, 118% of the stage width by 88% of its height, centred at 50% / 46%,
fully transparent until 40% and reaching `rgba(0, 0, 0, 0.6)` at 100%.

Note the centre sits slightly above the middle of the stage, which pushes more of the
falloff toward the bottom corners. It sits above the canvas, so it darkens the globe's
outer edge as well as the background. This is what keeps the corner chrome legible
against the motif.

**5. Auth bloom**

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

Layers 1, 2, 4 and 5 must not intercept pointer events. Only the canvas and the chrome
and panel above it are interactive.

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

The stage fill must cover the document, not only the element that draws the other four
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
