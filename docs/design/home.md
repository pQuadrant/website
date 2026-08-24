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

Below **1100px** of window width the horizontal margin reduces to **40px**. Below that
width the top-left and top-right chrome clusters begin closing on each other, and the
wider margin runs them together.

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

It must never come closer than **64px** to the top or bottom edge of the window.

The panel has a fixed height that does not change between its states, so its position
is stable and nothing on the page moves when its contents change. The panel's own
specification covers this — see _Related files_.

---

## Window size behaviour

**Short windows.** When the window height falls below **700px**, the stage stops
centring its content and allows the page to scroll normally. The motif remains fixed
behind the scrolling content.

700px is the panel's height plus its 64px clearance above and below. Above this
threshold everything fits and is centred. Below it, scrolling is correct behaviour and
clipping is not: content must never be silently cut off.

**Wide windows.** No maximum width. Chrome remains pinned to the window corners at the
margins described above. The motif is capped as described above, so on very wide
windows the globe holds its size while the corners spread further apart.

**Verify at these window sizes:**

| Size                        | Why                                                       |
| --------------------------- | --------------------------------------------------------- |
| 1512 × 855                  | 14-inch MacBook Pro, the primary development machine      |
| 1440 × 900                  | The size the design was composed at                       |
| 1920 × 1080                 | Common external monitor                                   |
| 2560 × 1440                 | Confirms the motif cap holds and the composition survives |
| Any window under 700px tall | Confirms the page scrolls rather than clipping            |

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Any window narrower than 1024px.** Mobile and tablet layouts are not designed. No
  responsive behaviour below this width has been decided.
- **Print styles, offline state, and error pages.**

---

## Related files

| File                           | Covers                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| `docs/design/chrome.md`        | The chrome: the four corner clusters, content and type       |
| `docs/design/globe.md`         | The motif: geometry, projection, colour, motion, interaction |
| `docs/design/sign-in-panel.md` | The sign-in panel: structure, states, form behaviour         |
