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

Flat colour `#020306`. The base surface. Nothing sits below it.

**This is the black point, not the background tone.** Almost nothing on the page should
be this dark — it is the floor that everything else is measured from, and the page's
depth is the distance between it and the light above it. It keeps the faintest cool
cast, blue a few levels above red, so the deepest shadow is not a neutral hole.

The reason it is not simply `#000` is that the light above it has to fall to nothing
somewhere, and where it does, this is what is left. A pure black floor with a sparse
star field over it reads as dead rather than deep.

**There is no centre lift any more.** A faint cool wash used to sit behind the motif, on
the stated reasoning that the globe should not sit on dead black. That reasoning was
backwards. The motif is a transparent point cloud, so light behind it passes between its
points and lifts the gaps — and the gaps are what the continents are read against.
Measured, that layer alone cost the globe roughly three quarters of its local contrast:
44:1 between its bright points and the gaps without it, against 14:1 with it. The globe
sits on the black point deliberately, and that is what makes it read.

**2. Starfield canvas**

A `<canvas>` element filling the stage, carrying the **ambient light** and a field of
small static points. Both are specified separately — see _Related files_.

The ambient light is the layer that gives the page its tonal range: the fill below it is
the black point, and this is what puts light on it. It is on this canvas rather than in
a CSS gradient because it has to be positioned relative to the **motif radius**, and no
CSS gradient can be. A gradient's stops are relative to the stage, while the motif radius
is `min(width, height) × 0.44` capped at 396 — a different function of the window. The
two drift apart as the window changes, so a gradient tuned to clear the globe at one size
lands its ramp on the globe's rim at another, which reads as a halo welded to the sphere.
This was built as a CSS layer first and that is exactly what it did.

It sits below the vignette, so the stars fade toward the window edges along with
everything else.

The canvas must be marked as decorative for assistive technology, since it conveys no
information a screen reader can use.

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

Layers 1, 2, 4 and 5 must not intercept pointer events. Only the motif canvas and the
chrome and panel above it are interactive.

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
stage itself. Borders elsewhere on the page are 1px only.

**Glow is permitted, and only as emission.** A luminous element may bleed its own colour
into the space around it: the halo each chrome string carries, the ring on a focused
control, and the glow on the sign-in button while it is processing. That is the whole
list. The reasoning is that this ground is the black point, so a shadow — something
darker cast onto something lighter — has nothing to cast onto and is invisible here by
construction. Emission is the only form the effect can take on this page, and it must
always be the element's own colour, never a wash of some other one.

This narrows the prohibition; it does not lift it. Nothing above changes: no curvature,
no blur of the background, no frosted glass, no noise, no border radius. A glow that
produces a visible boundary, a ring or a plate around an element is a card by another
route and is prohibited with the rest of them.

---

## Margins

Chrome sits **64px** from the left, right and bottom window edges.

The top edge is not uniform. The two top clusters are aligned optically rather than to
a shared grid line, because they contain type at different sizes and one of them is a
bordered control: **62px** for the left cluster and **56px** for the right. Do not
normalise them to a single value.

The horizontal and bottom margins have three tiers, and **all three are driven by width
alone**. The top offsets do not tier with them, and the one value that changes does so
for a different reason entirely — see _The top-left offset in a tight window_ below:

| Window width     | Left / right / bottom |
| ---------------- | --------------------- |
| 1100px and wider | 64px                  |
| 640px to 1100px  | 40px                  |
| Below 640px      | 24px                  |

The top offsets are not on that table because they are not on that axis. The top-right
cluster holds **56px** at every size. The top-left cluster holds **62px** in a roomy
window and **34px** in a tight one, where tight means narrower than 640px _or_ shorter
than 500px — see the chrome specification.

**The margin tier does not follow the reflow, and this is the distinction to hold on
to.** Both used to be driven by the same 640px breakpoint, because until the short
trigger existed there was only one way for a window to be short of room. They are
different things. A margin tightens because the window has run out of _horizontal_ room.
A cluster reflows because it has run out of room in either direction. A phone in
landscape has 930px of width and 330px of height: it needs the reflow and it does not
need the tier, and at 932 x 330 the margins stay at 40px while every cluster stacks.

Below 1100px the top-left and top-right clusters begin closing on each other and the
widest margin runs them together. Below 640px the clusters stack — see the chrome
specification — and 24px is what the stacked composition needs to clear 320px, the
narrowest window supported.

**Why the bottom tiers and the top does not.** This file once held the bottom margin at
64px at every width, on the ground that only the horizontal axis runs out of room. That
is true, and it is an argument about necessity rather than about composition: on a phone
it produced a stage framed 24px at its sides and 64px below, which is not the desktop
composition tightened but a different one. The telemetry hung off the bottom edge and
read as unresolved rather than as spacious. So the bottom tiers.

The top was then tiered with it, and that was wrong. It put the two top clusters at 22px
and 16px on a phone, which crams the only controls on the page into the corner and
against the browser's own chrome. **The two edges are not carrying the same thing.** The
top holds the identity and the controls — foreground, and the half a visitor aims at.
The bottom holds telemetry, which is ambient by design and reads better settled into the
frame's edge than floating off it.

The rule that survives both corrections: a margin expresses what sits inside it. Where
two edges carry the same class of content they hold the same inset and tier together;
where they carry different classes, the difference between them is the point. Left and
right carry the same thing as each other and always match.

**The top-left offset in a tight window.** 62px becomes 34px, and this is not the tiering
the paragraph above rules out. Tiering tightens a margin because the window has run out of
room, and it moves a cluster _toward_ the edge it is pinned to. This does neither. The
top-left cluster is 88px tall below the breakpoint — two 44px touch targets, one above
the other — where the top-right row is 44px. Held at 62px the taller block hangs 28px
below the shorter one and the top edge reads as two rows at two different heights rather
than as one.

So the two top clusters are centred on each other instead, and 34px is what that
produces rather than a value chosen for its own sake: the top-right row runs 56px to
100px, its centre line is 78px, and a block 88px tall centred there starts at 34px. The
whole of the change is the 28px of that arithmetic.

**The offset that governs is still the top-right cluster's 56px**, which does not move at
any width. The two top clusters hold one centre line and the left one is placed to meet
it, so if either cluster's height ever changes the number to re-derive is this one and
not that one. Nothing here licenses tightening the top edge: the controls are further
from the browser's own chrome than the 22px and 16px the correction above threw out, and
the visible type starts 48px down rather than 34px, because 17px of each 44px target is
the padding that makes it a target.

**The margins do not scale with the chrome.** Above 1024px wide the chrome grows with
the window — the rule is in the chrome specification — and these four margins do not
follow it. They keep their 64 / 40 / 24 tiers at every width.

That is a decision rather than an omission. **A margin describes the window's edge; it
does not describe the type sitting inside it.** The tiers above exist because a narrow
window has less room to give away, which is a fact about the window; the chrome's scale
exists because a 10px label claims a fifth as much of a 27-inch monitor as it does of a
phone, which is a fact about the type. Tying them together would mean the widest windows
got both the largest margin and the largest chrome, compounding in the same direction for
two unrelated reasons.

The top offsets are the exception, and they are not margins in this sense. **56px on the
top-right cluster holds at every size**; the top-left cluster's offset is derived from it
so that the two keep their optical relationship as the control height changes. Both
derivations are in the chrome specification.

**Safe areas.** The page declares `viewport-fit: cover`, so the stage reaches under a
notch, a dynamic island and a home indicator rather than being letterboxed inside them.
The margins above are then measured from the edge of the _usable_ display: the device's
safe-area inset is added to the margin, not substituted for it. The design's top offset
means that far clear of the island, not that far from a point underneath it. Both top
clusters take the same inset, so the centre line they share survives it. On a display
with no inset the addition is zero and nothing moves.

Only the chrome takes the insets. The motif spans the whole stage, insets included, and
the panel is centred far from any of them.

---

## Motif sizing

The motif's radius is the **smallest of four terms**, with a floor:

```
visibleHeight = 2 x --stage-centre-y          (svh, not the canvas height)

factor   = min(window width, visibleHeight) x 0.44
cap      = 396
corners  = min over the four clusters of ( distance(centre, cluster's nearest point) - 24 )
edge     = visibleHeight / 2 - 24

radius   = max( 48, min(factor, cap, corners, edge) )
```

The centre the distances are measured from is (`width / 2`, `--stage-centre-y`) — the
same centre everything else on this stage draws on, see _Motif centring_ below.

**`visibleHeight` is the height the visitor can see, and it is not the canvas height.**
The canvases are `lvh` and stay `lvh`; that rule is right and is not what this is. `lvh`
is the viewport with the browser's retractable UI retracted, which is the tallest it ever
gets, so a radius taken from it sizes the globe for a window taller than the one it is
centred in and the sphere overhangs by half the difference at each end. In portrait that
is about 60px out of 844 and nobody sees it. In landscape the browser's chrome is a far
larger share of a far shorter viewport — around 100px out of 430 — and the sphere is cut
off at the top **and** the bottom.

Read it the way `src/lib/stage/centre.ts` does and double it. **Do not read
`window.innerHeight`.** That is the _visual_ viewport, which changes as a mobile
browser's toolbar slides, so the globe would be re-measured part way through a scroll and
visibly resize — the same failure the `lvh` canvas rule exists to prevent, arrived at from
a new direction.

**Only landscape moves.** In portrait and on a desktop the width is the smaller dimension
or the cap binds, so changing the height input changes nothing at all. Measured against
the previous rule, the radius is identical to the hundredth of a pixel at 1440 x 900,
1920 x 1080, 2560 x 1440, 1512 x 855, 768 x 1024, 430 x 932, 390 x 844, 360 x 640 and
320 x 568.

### Which term governs where

| Window                        | factor | cap | corners | edge  | radius | binds   |
| ----------------------------- | ------ | --- | ------- | ----- | ------ | ------- |
| 2560 x 1440                   | 634    | 396 | 1089    | 696   | 396    | cap     |
| 1920 x 1080                   | 475    | 396 | 724     | 516   | 396    | cap     |
| 1440 x 900                    | 396    | 396 | 486     | 426   | 396    | factor  |
| 768 x 1024, tablet portrait   | 338    | 396 | 431     | 488   | 338    | factor  |
| 390 x 844, phone portrait     | 172    | 396 | 283     | 398   | 172    | factor  |
| 320 x 568, narrowest          | 140.80 | 396 | 141.13  | 260   | 140.80 | factor  |
| 932 x 430, phone landscape    | 189    | 396 | 280     | 191   | 189    | factor  |
| 932 x 330, with the toolbar   | 145    | 396 | 261     | 141   | 141    | edge    |
| 844 x 390                     | 172    | 396 | 231     | 171   | 171    | edge    |
| 740 x 320                     | 141    | 396 | 169     | 136   | 136    | edge    |
| 667 x 375, iPhone SE sideways | 165    | 396 | 153     | 163.5 | 153    | corners |

**320 x 568 is the tightest point in the whole rule and it is where a regression will
show first.** The corner term misses binding there by **0.33px**. That is not slack that
was left; it is what the portrait composition already had — the globe at the narrowest
supported window sits 24.33px from the top-left cluster, and the corner term asks for 24.
If anything in the chrome ever grows at that size, this is the number that goes negative
and portrait stops being pixel-identical. Re-measure it rather than assuming it held.

### The corner term

Each cluster is a rectangle and the motif is a circle. The nearest point of the box to
the circle's centre gives the largest radius that clears it, and 24px is held back so the
sphere does not graze the type.

**The argument for this shape is that it is inert almost everywhere.** It is not a tuned
number and it introduces no breakpoint: on nearly every desktop and portrait window it
sits far above the factor and the cap and can have no effect. A breakpoint with a tuned
factor would have to be tuned per size and would put a visible jump in the globe as a
window crossed it.

**It is no longer inert on every desktop window, and that changed when the chrome gained
a scale.** Above 1024px wide the chrome grows with the window — see the Scale section of
`docs/design/chrome.md` — which moves its inner corners toward the centre of the stage.
In a narrow band of window shapes, around **1100px to 1180px wide at roughly a 1.7
aspect**, this term now binds where it previously did not, and the motif is **at most
7.9px smaller**, about 2.8%, at 1120 x 650. Outside that band nothing changes: the sweep
that found it also confirmed the radius is untouched from 1024px through 2600px at four
aspect ratios.

**That is the two rules working rather than fighting.** If the chrome grows, either the
motif yields a little or the two touch; this term exists to settle exactly that, and it
settles it against the motif on purpose. Both terms are continuous in width, so the motif
shrinks and recovers smoothly across the band rather than stepping at an edge. If the
chrome's scale is ever raised, this is the figure to re-measure.

It measures the chrome where the chrome actually is, through a `data-chrome-corner`
marker on the four corner regions, rather than recomputing the margins in script. The
margins and offsets live in CSS and there must not be a second copy of them. The corner
regions animate opacity only and are laid out from the first frame, so measuring them
before the entrance finishes is safe.

### The edge term, and what it is actually for

It is **not** what stops the sphere being clipped. Once the factor reads the visible
height the sphere cannot clip: `0.44 x height` is always less than `half the height`,
whichever dimension is the smaller. Fixing the input is the whole of that fix.

What the factor leaves is a band of `0.06 x visibleHeight` between the sphere and the top
and bottom of what the visitor sees — 20px at 330px tall, 12px at 200px tall, and
shrinking as the window does. The edge term is what makes that band a **stated 24px at
every size** instead of a proportion that quietly runs out. It is the same 24px the
corner term holds back, so there is one clearance number on this page and not two.

### The floor

48px. It exists so that a window squashed to a couple of hundred pixels — dragged there
on a desktop, or a landscape phone with a keyboard open — cannot produce a radius of zero
or a negative one. It binds below **144px** of visible height, which is below the point
at which the four clusters meet each other and the composition stops being defined
anyway. It is a guard against arithmetic, not a design value.

### The cap

396px is the radius the factor produces at 1440 x 900, the size the design was composed
at, and that is still true of the factor above because the factor is unchanged in every
window where the cap is in play. Without the cap the globe keeps growing on large
monitors and the relationship between the globe, the panel and the corner chrome no
longer matches the design.

---

## Motif centring

Everything the stage centres — the motif, the starfield's density falloff, the
starfield's ambient light, and the panel — centres on **half the small viewport
height**:

```
centre = 50svh
```

Not half the canvas. The canvases are `lvh` tall and that does not change (see
_Background layers_), but `lvh` is the viewport with the browser's retractable UI
**retracted**, which is the tallest it ever gets. Taking the centre from the same number
puts the motif at `lvh / 2` while the visitor can only see about `svh`, so the globe
sits below the middle of the visible area by roughly half the height of the browser
chrome. On an iPhone that is tens of pixels and plainly visible.

**The canvas size and the drawing centre are two different questions.** The `lvh`
sizing rule answers the first and is still correct. This rule answers the second.

**Why `svh` and not a compromise.** `svh` is exactly right while the toolbar is showing
and slightly high once it retracts. On this page the retracted state is close to
unreachable: with the panel closed the page does not scroll at any window size — see
_Window size behaviour_ — and with no scroll the toolbar does not retract. The only
route to it is the one scrolling case, a panel open on a window too short to hold it.
A midpoint of `svh` and `lvh` hedges against a state this page barely has, at the cost
of being a little wrong in the state it is always in.

**The accepted cost:** with the toolbar retracted, the motif sits high of centre by half
the toolbar's height. That is the trade, and it is the right way round.

**It must not track the viewport live.** The visual viewport changes as the toolbar
moves, and a centre read from it slides the globe mid-scroll. That is the same
re-measure the `lvh` sizing rule exists to prevent, arrived at from the other direction.
For a given window the centre is a fixed number.

**One definition, not four.** The centre is declared once, as a registered custom
property in `globals.css`, and every layer reads that one resolved value — the three
canvas layers in script, and the panel region as `calc(centre x 2)` for its own height,
so that its middle is the same number rather than a second way of saying it. It was
previously derived independently in three places — the motif, the density falloff and
the ambient light — plus a fourth height for the panel, which centred on `dvh` while the
canvases centred on `lvh`. Those disagreed on a phone, so the panel was not concentric
with the globe and the clear zone sat off-centre over it.

The starfield's ambient light and density falloff are anchored to the motif radius so
they track the globe at every window size. If the globe's centre moves and theirs does
not, the ambient hole no longer sits over the sphere and its ramp lands on the rim as a
halo. They move together or the rule is broken.

Not part of this: `pointer-response.ts` scales the drag's impulse and speed ceilings by
half the stage height. That is a magnitude, not a position, and it is not a fourth copy
of this rule.

On desktop `svh`, `lvh` and `dvh` are the same number and nothing about this is visible.

---

## Panel placement

The panel is **400px** wide, centred horizontally and vertically on the stage, on the
height given in _Motif centring_ — so the panel and the motif are concentric.

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
apply always. It once also kept the corner chrome in place, because the chrome was positioned in the
document while the motif was fixed, so any scroll slid the frame across the instrument.
That is no longer a reason: the chrome is pinned to the window too — see _Touch edges_
below — and a scroll now moves the panel alone. The rule above stands on its own
argument.

**Touch edges.** A touch screen lets a visitor drag the page past its own end whether or
not there is anything there — iOS rubber-bands indefinitely on a page with no scrollable
content at all. **Rubber-banding is not scrolling**, and having nothing below the fold
does not prevent it.

The chrome used to be positioned in the document while the canvases were fixed, so a
bounce moved the chrome and not the motif, and the corner telemetry travelled across the
middle of the globe.

**Everything except the panel is now pinned to the window.** The four corner clusters are
fixed, as the two canvases already were. Nothing moves relative to anything else, so the
gesture has nothing left to break: a bounce drags the document behind a composition that
stays where it is, and what it exposes is the stage fill, which is the colour already
under everything.

The gesture itself is left alone. Pull-to-refresh keeps working, and so does the elastic
bounce on a trackpad — they are the platform's, they are what a visitor expects of a
page, and there is no longer any reason to take them away.

Do not answer this by moving the canvases with the pull so the whole scene travels
together, and do not un-fix them so the composition scrolls as one. The first fights the
platform gesture and cannot track it smoothly enough — the bounce does not emit events at
frame rate, so the canvases lag — and it puts per-frame transform work on two full-screen
canvases at the page's busiest moment. The second breaks the scrolling case below: the
motif has to stay behind the panel while the panel scrolls, which is the whole reason the
canvases are fixed.

**What the chrome does while the page scrolls.** It stays pinned. The chrome is the
frame of the instrument and it belongs to the window, not to the document; the panel is
the content, and the content is what moves. This is the same rule the motif already
follows, and applying it to the chrome is what makes the page consistent: before, a
scroll slid the frame across the instrument, which this file cited as a reason the page
must not scroll. The frame no longer slides, so that is no longer a reason.

The accepted consequence is that on a window short enough to scroll, the chrome sits over
the panel for the whole of the scroll rather than travelling out of the way. It already
overlapped it at the top of the scroll, so this is more of an existing condition rather
than a new one, and the corner regions take no pointer events, so nothing in the form
becomes unreachable. **Whether the chrome should recede while the panel is open is a
question for the panel's own specification**, not for this file, and it is not decided
here.

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

**Short windows, which is landscape.** Below **500px tall** the page does the same thing,
for the same reason, and it is the same reflow rather than a second one. A phone on its
side is not narrow — an iPhone 15 Pro Max in landscape is about 930px wide, well clear of
the 640px trigger — it is short, with roughly 330px of height once Safari's toolbar is
showing. Served the desktop composition it puts every cluster on one long row and the
bottom-left cluster, the widest thing in any corner at 306px, reaches far enough toward
the centre to run into the motif. Measured before this rule existed: 11px of clearance at
932 x 430 and a 12px **overlap** at 844 x 390.

**The margin tier does not come with it.** See _Margins_ above. The reflow crosses over;
the 24px tier does not, because a landscape phone has horizontal room to spare.

**320px is the narrowest window supported**, and below that the composition is not
defined and is not verified. There is no matching floor on height, because height is not
the axis that runs out first: what a very short window does is stack clusters that are
already stacked. The two top clusters and the two bottom ones meet at about **190px** of
height, which is far below any viewport a browser reports on real hardware, and it is not
a supported size so much as the point at which the composition stops being defined.

There is no tablet composition. Between 640px and 1100px the page uses the desktop
composition at the 40px margin, and that is all a tablet gets. **Two _width_ breakpoints
exist and a third should not be added:** the page has one composition and one reflow of
it, not a ladder of device sizes.

**The 500px height trigger is not that third breakpoint, and the next person to read the
rule above will need telling why.** That rule is about accumulating device tiers along
one axis — phone, then large phone, then small tablet, then tablet — and it is about
width. This adds no tier and no composition. It is the first breakpoint on the _other_
axis, and it fires the one reflow that already exists rather than introducing a second
one. After it, the page still has one composition and one reflow of it. What changed is
that there are now two ways to run out of room instead of one, which was always true of
the page and was only ever expressed about width.

**Where 500px comes from** is derived in the chrome specification, from the tallest phone
in landscape (480px) and the shortest tablet in landscape (744px). Both bounds were
measured rather than assumed, and the phone bound is the tight one.

**Verify at these window sizes:**

| Size                        | Why                                                         |
| --------------------------- | ----------------------------------------------------------- |
| 320 × 568                   | The narrowest window supported; the tightest gutter         |
| 360 × 640                   | Common small Android                                        |
| 390 × 844                   | Common iPhone, the size the mobile problem was found at     |
| 430 × 932                   | Large iPhone                                                |
| 768 × 1024                  | Tablet portrait, on the desktop composition                 |
| 932 × 430                   | Phone in landscape, browser chrome hidden                   |
| 932 × 330                   | The same phone with Safari's toolbar showing — the real one |
| 896 × 414                   | Phone in landscape, the tightest clearance measured         |
| 844 × 390                   | Phone in landscape: short and wide at once                  |
| 1060 × 480                  | Tallest phone in landscape; just inside the 500px trigger   |
| 1133 × 744                  | iPad mini in landscape; must NOT take the tight composition |
| 1512 × 855                  | 14-inch MacBook Pro, the primary development machine        |
| 1440 × 900                  | The size the design was composed at                         |
| 1920 × 1080                 | Common external monitor                                     |
| 2560 × 1440                 | Confirms the motif cap holds and the composition survives   |
| Any window under 700px tall | Confirms the page scrolls rather than clipping              |

Verify with a coarse pointer as well as a fine one. They are different compositions and
different behaviour, not the same page at two sizes.

**A phone's landscape viewport is shorter than its screen.** The rows above are browser
viewports, not device dimensions: the browser's own chrome takes a slice off the top, so
a 932 x 430 screen reports about 330px to the page while the toolbar is showing and about
430px once it retracts. Both states have to be checked, and an emulator reproduces
neither — it will pass while the bug is still there.

At every size, the check is that no two chrome clusters overlap, that no cluster touches
the motif, **and** that every string is still on screen. A string that has gone missing is
a failure, not a pass — the rule is that nothing is hidden.

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
