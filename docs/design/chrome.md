# Page chrome — design specification

The four text clusters pinned at the corners of the home page stage. Build against this
file. If the code and this file disagree, one of them is wrong; fix it rather than
working around it.

Read `docs/design/home.md` first. It defines the stage these clusters sit on, the
margin rules, and the terms used here.

---

## What the chrome is for

The chrome frames the page the way instrument markings frame a display. It is
deliberately small, dim and dense. It is not marketing copy, and it should never be
scaled up to improve legibility. Its low prominence is the design.

**Prominence is not presence, and only one of them is low by design.** Prominence is how
much of the page a thing claims: its size, its weight, its place in the reading order.
That is what the rule above protects, and nothing in this file scales, moves or
recolours a string to make it easier to see. Presence is whether a thing reads as
sitting _on_ the page or behind it — and the chrome had none. It was the only element on
this page rendered as flat paint, while the stars, the motif's nearest points and the
submit button all emit light. That is why the corners receded even where their contrast
was high. The glow below raises presence and leaves prominence exactly where it was.

**How far that rule reaches.** It binds the ambient telemetry — `SERVER EG-CAI-1`,
`PQ-CORE 4.2.118`, `TLS 1.3 · AES-256-GCM` and the Cairo clock — permanently. Those
convey nothing the visitor needs and their dimness is the point.

It bound the two product names only for as long as they were plain text, on the reason
that the chrome is not navigation. They are controls now, that reason no longer
describes them, and the rule has released their size by its own terms.

**Released, they stay at 10px.** That is a decision rather than an omission, and it was
taken for three reasons. The cluster has exactly one type size, and scaling only these
two would introduce a second into a line of three items. Prominence was never the
problem the glow was brought in to solve — presence was, and it is solved. And the
rule's reason is being replaced by a control treatment rather than by permission to
grow: these two now announce themselves by answering a pointer, which is a stronger
claim to being actionable than a larger size would make, and it costs the composition
nothing. The treatment that carries it is in _Top-left cluster_ below.

The rule has never barred a larger **touch target**, which is not the same thing as
larger type. See _Narrow windows_ below.

Everything here is set in IBM Plex Mono. The mono typeface carries anything labelled,
metered or system-voiced, which on this page is all of the chrome. Wide letter-spacing
is applied throughout and is not optional — these strings were composed with it, and
they collapse into something generic without it.

---

## The glow

Every string in the chrome carries a soft halo of **its own colour**. This is what makes
the chrome read as lit rather than printed on the surface.

**A drop shadow is not the alternative, and would not work here.** A shadow is something
darker cast onto a lighter ground. The stage fill is the black point — see
`docs/design/home.md` — so there is nothing darker to cast onto it, and a drop shadow on
this page is invisible by construction. On a dark surface the equivalent tool is the
inverse: the element's own colour bleeding into the space around it.

Each halo is a **tight core plus a wide bleed**, not a single blur.

| Role   | Applies to                       | Colour    | Core        | Bleed        |
| ------ | -------------------------------- | --------- | ----------- | ------------ |
| `fg-0` | `SIGN IN`, and every hover state | `#EAEDF4` | 5px at 0.45 | 14px at 0.28 |
| `fg-1` | Product names, `p_Q`             | `#8B94A2` | 4px at 0.38 | 12px at 0.22 |
| `fg-2` | The toggle's label, panel open   | `#59626E` | 4px at 0.36 | 11px at 0.21 |
| `fg-3` | Telemetry, server line, clock    | `#414A56` | 3px at 0.34 | 10px at 0.20 |

The values are held as tokens in `globals.css`, `--text-shadow-glow-0` through
`--text-shadow-glow-3`, and never as literals in a component.

**The core is not a refinement of the bleed; without it there is no visible effect.**
This type is 10px, so its strokes are about a pixel across. Blur a one-pixel stroke over
a ten-pixel radius and its light spreads across roughly twenty pixels, so the peak
brightness falls by about that factor — a stop at 0.22 alpha arrives on screen as
roughly **one level**. That is measurable and invisible, and it is exactly what the
first attempt at this shipped: the halos were confirmed present by measurement, and
could be seen only by flipping between builds. The core concentrates the same light
rather than smearing it, and it is what carries the effect. The bleed alone is a number
in a report.

**There is a ceiling on the core, and it is not a contrast figure.** What breaks first
is the glyph. Driven hard enough the core stops reading as light _around_ a letter and
starts thickening the letter, which is a heavier typeface reached by another route and
the one thing this treatment must not be — raising presence is not licence to raise
prominence. That becomes visible by about 0.95 on `fg-0`.

**The values above sit well below that ceiling deliberately.** The headroom is unspent
because the telemetry is ambient framing and is meant to stay recessive. A stronger core
lifts the quiet corners noticeably more than it lifts the loud one — the product names
gain about a tenth more, the clock and the version line nearly half again — which closes
the gap this file spends its first section arguing for. The chrome is lit just enough to
sit on the page, not brought up level with the one control on it.

**The proportionality is the point, not a detail of the tuning.** Alpha and radius scale
with each string's own luminance. A uniform halo would close the gap between the loudest
element and the quietest, flattening the page's single point of focus — the opposite of
what the glow is for. Scaled, `SIGN IN` gains the most presence, the telemetry stays
recessive, and the hierarchy described in this file survives intact.

`fg-2` is interpolated rather than picked. Its luminance, 97.0, sits about a third of
the way from `fg-3`'s 73.0 to `fg-1`'s 147.1, and its glow sits at the same fraction
between theirs. The ramp is a ramp, and a value on it is not a special case.

**The two dividers do not glow.** The product line's `/` and the top-right cluster's
hairline are marks that separate other things, and a halo on a divider makes it compete
with what it divides. Both stay flat paint. The `/` sits inside a glowing paragraph, so
it clears the inherited halo explicitly rather than by accident.

**What the glow costs.** A halo of a string's own colour necessarily raises the ground
immediately around its glyphs, so every string's contrast against its immediate surround
falls very slightly. There is no version of this technique where that cost is zero; it
can only be kept small. Measured at 1440 × 900 against the same page with the halos
switched off:

| Cluster                    | Before  | After   |
| -------------------------- | ------- | ------- |
| Product names              | 6.61:1  | 6.52:1  |
| Server line                | 2.26:1  | 2.26:1  |
| Core version and transport | 2.24:1  | 2.23:1  |
| City and clock             | 2.24:1  | 2.23:1  |
| `p_Q`                      | 6.63:1  | 6.60:1  |
| `SIGN IN`, on its own fill | 16.51:1 | 16.46:1 |

The largest loss is 0.09 of a contrast point, on a string with six to spare. The
telemetry — the weakest value on the page, and the one to watch if these numbers are
ever retuned — loses 0.010.

**This cost is nearly flat in the glow's strength, which is worth knowing before anyone
retunes it.** Tripling the core moved the telemetry by about a hundredth of a
contrast point. The halo brightens a thin ring immediately around each glyph and leaves
the rest of the surround alone, so the median ground barely moves however hard the core
is driven. Contrast is not the constraint on this treatment. The constraint is that the
glyphs must not thicken.

**No halo boundary.** The falloff reaches zero within about 4px of each string's box,
with no step and no slope break anywhere in the tail. A glow still descending when it
reaches its last stop leaves a visible edge even though no value steps, so this is
checked on a radial profile of the amplified difference, not by eye.

---

## Content

Every string below is display content and lives in `src/content/`, never typed into a
component.

Several of these strings are **static display values, not measured ones**. They do not
reflect live system state and nothing reads them at runtime. They are written as
constants because they describe the product's character, not its telemetry. Do not
wire them to real sources, and do not assume a service exists behind a name that
appears here.

The two product names are stored as separate values rather than one combined string,
because each is its own control. Both are `LabelledControl` values — a visible label and
an accessible name — since neither product name on its own says what its button does.

---

## Top-left cluster

Anchored at the margin from the left edge and **62px** from the top, falling to **34px**
below 640px so that this cluster and the top-right one share a centre line once this one
is two touch targets tall. The horizontal margin tiers with the window; the top offset
does not tier, and the one value that changes does so for that reason rather than for
room. Both tables are in `docs/design/home.md`.

One row. The server line that used to sit beneath it has moved to the bottom-right
cluster — see below.

**Product line**

Three items on a baseline-aligned horizontal row with a **14px** gap between each.

| Item        | Value           | Colour    |
| ----------- | --------------- | --------- |
| Product one | `CONSTELLATION` | `#8B94A2` |
| Separator   | `/`             | `#2B323D` |
| Product two | `NORTHSTAR`     | `#8B94A2` |

IBM Plex Mono, 10px, letter-spacing `0.2em`.

The separator is markedly dimmer than the names on either side. It is a divider, not a
character in a sentence. The three items align on their baselines, not their box
centres.

**Both product names are controls.** Each is a button that will open its product's
surface. Neither surface is designed, so neither button does anything yet: they are
rendered, styled and given their states, and their action is left unimplemented exactly
as `p_Q`'s is. Do not invent a destination for either, and do not add link markup or a
route.

| Property                    | Value                                       |
| --------------------------- | ------------------------------------------- |
| Type                        | IBM Plex Mono, 10px, letter-spacing `0.2em` |
| Colour                      | `#8B94A2`                                   |
| Glow                        | `fg-1`; `fg-0` on hover and active          |
| Hover colour                | `#EAEDF4`                                   |
| Active colour               | `#EAEDF4`                                   |
| Transition                  | 160ms ease on text colour and glow          |
| Focus                       | See _Focus_ under the top-right cluster     |
| Border, background, padding | None                                        |

**This is `p_Q`'s treatment, value for value, and that is the point.** The page has one
control language and this cluster does not get a second one three feet from the first.
It is also the only treatment that fits here: the sign-in toggle's bordered 34px box is
a control standing on its own in a button bar, and two of those in the top-left corner
would turn a line of type into a toolbar. `p_Q` is this file's existing answer to what a
control looks like when it sits inside a text row — it reads as a word until a pointer
reaches it — and these two inherit it rather than inventing a third thing.

**The resting appearance is therefore unchanged.** Nothing about this cluster moves,
recolours or resizes until a pointer arrives. That is deliberate and it is what keeps the
corner reading as a cluster of type rather than as a nav bar.

**The active state is not a duplicate of the hover state.** Tailwind emits every
`hover:` utility inside `@media (hover: hover)`, so on a touch device the hover rules
never apply, and a button carrying only a hover state acknowledges a tap with nothing at
all. This is the same reasoning that gives the two top-right controls theirs.

**Nothing else in the cluster becomes interactive.** The corner region is inert so that
clicks reach the motif beneath it. These two buttons opt back in; the separator does not.
See _Layering and pointer behaviour_.

**The separator still reads as a divider between two controls.** That it now divides two
controls rather than two words changes nothing about the mark, because neither control
carries a border, a fill or padding: the row is still three items of type sharing one
baseline, and the `/` still sits between two of them rather than between two boxes. Had
these become bordered boxes it would have had to go — a divider between two things that
already have edges of their own is a third edge. They did not, so it stays. It remains
decorative, remains the one mark in the chrome that does not emit, and is still dropped
below 640px where the names stack.

**Accessibility.** A button whose action is unimplemented still needs an accessible name
saying what it will do, and a product name on its own does not say it. Both are held in
`src/content/` as `LabelledControl` values, visible label and accessible name together.

---

## Top-right cluster

Anchored at the margin from the right edge and **56px** from the top. The 6px
difference from the left cluster's 62px is optical: the bordered control sits lower
inside its own box than bare type does. Do not normalise them. The horizontal margin
tiers with the window and the top offset does not; the table is in
`docs/design/home.md`.

A horizontal row **34px** tall, with items stretched to that full height and an **18px**
gap between each. Three items, left to right.

**1. Entry point button**

| Property                    | Value                                       |
| --------------------------- | ------------------------------------------- |
| Label                       | `p_Q`                                       |
| Type                        | IBM Plex Mono, 10px, letter-spacing `0.2em` |
| Colour                      | `#8B94A2`                                   |
| Glow                        | `fg-1`; `fg-0` on hover and active          |
| Hover colour                | `#EAEDF4`                                   |
| Active colour               | `#EAEDF4`                                   |
| Transition                  | 160ms ease on text colour and glow          |
| Focus                       | See _Focus_ below                           |
| Border, background, padding | None                                        |

Text only. No border, no fill, no padding — it reads as a word, not a control, until
hovered.

**The active state is not a duplicate of the hover state**, for the same reason it is
not on the toggle: Tailwind emits every `hover:` utility inside `@media (hover: hover)`,
so on a touch device the hover rules never apply. Without an active state this button
acknowledged a tap with nothing at all, which it did for as long as it existed. It now
gets the same treatment the toggle has always had.

This label is typed characters in the mono typeface. It is **not** the pQuadrant
wordmark asset, and must not be replaced with it. The drawn wordmark appears only
inside the sign-in panel, at a much larger size. The two rendering differently is
intended.

This button currently does nothing. It is the entry point for a conversational surface
that is not yet designed. Render it, style it, give it its hover state, and leave its
action unimplemented. Do not invent behaviour for it.

**2. Divider**

A 1px wide vertical hairline in `#232B36`, spanning the full 34px height of the row.

**3. Sign-in toggle**

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Height        | 34px                                                   |
| Padding       | 0 16px                                                 |
| Border        | 1px solid `#59626E`                                    |
| Background    | White at 0.03 alpha                                    |
| Type          | IBM Plex Mono, 10px, letter-spacing `0.2em`            |
| Glow          | `fg-0` closed, `fg-2` open; `fg-0` on hover and active |
| Hover border  | `#4E9BFB`                                              |
| Hover colour  | `#EAEDF4`                                              |
| Active border | `#4E9BFB`                                              |
| Active colour | `#EAEDF4`                                              |
| Transition    | 160ms ease on border colour, text colour and glow      |
| Focus         | See _Focus_ below                                      |
| Border radius | 0                                                      |

**The border is `#59626E` because it is the first value on the ramp that clears 3:1.**
The button previously had no visible body: its border sat at `#262D3A`, which is 1.45:1
against the corner ground, so the only action on the page read as two floating words
rather than as a control. WCAG 1.4.11 asks 3:1 of the visual boundary of a UI component.
Walking the existing blue-grey ramp, `#525C6A` reaches only 2.97:1 and misses; `#59626E`
reaches 3.25:1 and is already a token, so no new colour entered the palette. Measured on
the rendered page it holds at **3.20:1 or better at 1440 × 900, 1920 × 1080 and
2560 × 1440**.

**The fill is capped at 0.03 alpha, and the cap is load-bearing rather than taste.**
With the panel open the toggle's own label is `#59626E` — an accepted contrast deviation
recorded below — and a fill underneath it lowers that number. Measured against the
ground actually under the button, luminance 9.0:

| Fill alpha | Body luminance | `#59626E` on it      |
| ---------- | -------------- | -------------------- |
| 0.03       | 17.0           | 3.05:1               |
| 0.04       | 19.0           | 3.00:1 — no headroom |
| 0.05       | 21.9           | 2.93:1 — fails       |
| 0.08       | 28.0           | 2.76:1 — fails       |

Raising the fill takes the open state below 3:1, and it will not be visible in a
screenshot. Above roughly 0.05 the button also stops reading as a lit control and starts
reading as a grey card, which `docs/design/home.md` rules out. If this value is ever
retuned, the open-state label is the number that breaks first.

The active state repeats the hover state's colours and is not redundant with it. Hover
styling must be confined to inputs that can hover, or it sticks to the last thing
tapped on a touch screen; confined, it never applies on a phone, and without an active
state this control would acknowledge a tap with nothing at all. The active state is what
gives the only action on the page a response on the device most visitors arrive on.

The label and resting colour depend on whether the panel is open:

| Panel state | Label     | Colour    |
| ----------- | --------- | --------- |
| Closed      | `SIGN IN` | `#EAEDF4` |
| Open        | `CLOSE`   | `#59626E` |

The colour drop when open is deliberate: with the panel on screen, the panel is the
subject and this control recedes.

`#59626E` on the stage background falls below the WCAG AA contrast threshold for text.
This is an accepted deviation for this control, on the basis that the panel it dismisses
carries its own labelled dismiss affordance and can also be closed with the Escape key,
so the action is not reachable only through this label. Do not raise the value to
"fix" the contrast. If the accessibility position changes, it changes here first and
the code follows.

**Accessibility**

The toggle controls the panel's visibility and must expose that relationship to
assistive technology, including whether the panel is currently open.

When the panel opens, keyboard focus moves into it. When it closes, focus returns to
this button. Focus must never be left on an element that has been removed.

**Focus**

Every control in the chrome carries the same visible focus indicator — the two in this
cluster and the two product names in the top-left one: a 1px ring in `#EAEDF4` with a
16px halo of the same colour at 0.3 alpha, held as `--shadow-glow-focus`.

It is built from this file's glow rather than the browser's default outline, so the page
keeps one visual language, and the default outline is suppressed where it applies. The
ring carries the boundary and the halo carries the emission; neither on its own is both
crisp enough to locate and of a piece with the rest of the chrome.

It is a `focus-visible` treatment, so it appears for a keyboard and not on a click or a
tap, and it is deliberately outside the 160ms transition — a focus indicator that fades
in is a focus indicator that is briefly not there.

The ring is the only boundary any of these four controls draws besides the toggle's
border. Measured on the rendered page it lands at full `#EAEDF4` and holds at
**17.0:1 or better against the corner ground at 1440 x 900, 2560 x 1440 and 320 x 568** —
the 3:1 that WCAG 1.4.11 asks of a focus indicator is never in question here, and the
figure is recorded so that a future retune of the glow has a baseline to compare against.

---

## Bottom-left cluster

Anchored **64px** from the left edge, **64px** from the bottom.

Two items on a horizontal row with a **40px** gap between them.

| Item         | Value                   |
| ------------ | ----------------------- |
| Core version | `PQ-CORE 4.2.118`       |
| Transport    | `TLS 1.3 · AES-256-GCM` |

IBM Plex Mono, 10px, letter-spacing `0.14em`, colour `#414A56`.

Both are static display values.

`PQ-CORE 4.2.118` names no service that exists and the version number is not derived
from anything. Do not connect it to `package.json`, a build variable, or any other
source.

`TLS 1.3 · AES-256-GCM` describes the transport encryption the site is in fact served
over, but the string is written rather than measured. Do not attempt to read the live
connection to populate it.

The separator between the cipher terms is a middle dot `·` (U+00B7), not a hyphen or a
period.

`#414A56` on the stage background is well below the AA contrast threshold. This is
accepted for this cluster: it is ambient framing that conveys no information the
visitor needs, and no action depends on reading it. This exception applies to
non-interactive telemetry only and does not extend to controls or form content.

---

## Bottom-right cluster

Anchored at the margin from the right edge and the same margin from the bottom. Both
tier with the window; the table is in `docs/design/home.md`.

Two items, laid out exactly as the bottom-left cluster is: a horizontal row with a
**40px** gap above the breakpoint, a column with a **7px** gap below it. The two ends of
the bottom edge carry the same class of information and are arranged the same way, so
the edge reads as one line of telemetry rather than as two arrangements that happen to
share a colour.

Right-aligned. Stacked against the right margin, a ragged right edge would leave the
shorter line floating off the frame.

| Item        | Value                                              | Example           |
| ----------- | -------------------------------------------------- | ----------------- |
| Server line | Static identifier                                  | `SERVER EG-CAI-1` |
| Clock       | City, then the time in Cairo, 24-hour, zero-padded | `CAIRO 16:50:21`  |

IBM Plex Mono, 10px, letter-spacing `0.14em`, colour `#414A56`.

**The server line was in the top-left cluster.** It is a static display value: the
identifier does not correspond to infrastructure and nothing resolves it. It already
wore `#414A56` — telemetry's colour, and the colour of every other value along this
edge — while sitting beneath product names at `#8B94A2`. That cluster was carrying two
classes of information at once, and this one is where its class already lives. Moving it
also leaves the top edge holding only the identity and the controls.

Its letter-spacing comes with the move, from `0.16em` to the `0.14em` the rest of this
cluster uses. Two adjacent lines of the same size and colour at different tracking read
as a mistake rather than as a distinction.

**The clock is the only live value in the chrome.** It updates once per second.

**Timezone.** The time is Cairo local time, resolved through the `Africa/Cairo` zone
rather than a fixed offset. Egypt observes daylight saving time, so its offset from UTC
changes twice a year. A hardcoded offset will be wrong for roughly half the year.

**Rendering isolation.** This is the only element on the page that changes every
second. It must be isolated so that its updates do not cause the rest of the page to
re-render. The motif runs its own continuous animation and the panel holds form state;
neither should be touched by the clock ticking. This constraint is structural — how it
is achieved is an implementation decision, but a clock that re-renders the page is not
an acceptable outcome.

**Server rendering.** The clock has no correct value at build time. It must not render
a server-generated time that then jumps when the page becomes interactive, and it must
not produce a hydration mismatch. Rendering the row with no time until the first client
tick is acceptable, provided the row does not change width when the time appears.

**Width stability.** The time is zero-padded so the string holds a constant character
count. The cluster is anchored to the right edge, so any width change would visibly
shift it. Padding is not cosmetic here.

**Drift and background tabs.** A simple one-second interval drifts, and browsers
throttle timers in background tabs, so a tab left open and returned to will show a
stale time if the display is only advanced by counting ticks. Read the actual current
time on each update rather than incrementing a stored value.

---

## Narrow windows

Below **640px** the clusters carrying more than two items become vertical columns. The
top-right cluster is the exception and stays a row at every width.

**Nothing is hidden and no type is scaled.** Every string in this file is on screen at
every supported width, at 10px, in the corner it belongs to. If a narrow window is ever
made to fit by dropping a string or shrinking type, that is the wrong fix — the lever is
the direction a cluster runs in.

| Cluster      | Above 640px                      | Below 640px                   |
| ------------ | -------------------------------- | ----------------------------- |
| Top-left     | Product line as a row, 14px gaps | Two 44px rows stacked, no gap |
| Top-right    | Row, 34px tall, 18px gap         | Row, 44px tall, 10px gap      |
| Bottom-left  | Row, 40px gap                    | Stacked, 7px gap              |
| Bottom-right | Row, 40px gap                    | Stacked, 7px gap              |

The stacked gap is **7px** for the two bottom clusters, and that is the chrome's one
stacked rhythm. Stacking does not introduce a second.

**The top-left cluster is the exception and the gap between its targets is zero.** That
is not a second rhythm but the absence of one: the two 44px hit areas tile directly, and
a gap on top of them would open a strip between two adjacent targets where a tap lands on
neither. What separates the two names is set by where each label sits inside its own
target — see _The labels bracket the toggle_ below — not by a gap between the targets.

**Why the top-right cluster stays a row.** It is the only cluster holding two controls
rather than lines of telemetry, and two controls fit beside each other at 320px where
three lines of text do not. Keeping them together also keeps every control on the page
in one place instead of running them down the corner: the entry point is a button too,
and it will do something once the surface behind it exists. At 320px the row leaves a
23px gutter between the two top clusters.

Its gap tightens from 18px to 10px below the breakpoint, for the same reason the stage
margin tightens: there is less room. Nothing else about it changes, and its divider
stays.

**The product line's separator is dropped.** The `/` divides two items sitting side by
side. Stacked, they are not side by side, and a divider between two things one above the
other is a different mark making a different claim. It is drawn in the component and
marked as decorative, so nothing in `src/content/` changes when it goes.

The top-right cluster's hairline divider is **not** dropped, because that cluster is
still a row and the items it divides are still beside each other.

**Touch targets.** Below the breakpoint every interactive element in the chrome has a hit
area at least **44px** tall. The label stays 10px: this is padding, not scale, and it is
the distinction the low-prominence rule turns on.

In the top-right cluster the height belongs to the row, not to the controls. That row is
34px above the breakpoint and 44px below it, and both children stretch to fill it, so
neither carries a height or padding of its own. A control that sizes itself is a control
that can disagree with the one beside it.

**In the top-left cluster there is no shared row to hold it, so each button carries its
own 44px.** Stacked, the two are not beside each other and have nothing to disagree
with. The height applies below the breakpoint only; above it each button is the height
of its own type, exactly as it was when it was a span. Each is also only as wide as its
own label — `CONSTELLATION` and `NORTHSTAR` are both far wider than 44px, so no width
has to be added, and keeping each target to its word leaves the rest of the corner
reaching the motif.

**The two top clusters are centred on each other below the breakpoint.** This one is
88px tall and the top-right row is 44px, so anchoring both at a fixed offset from the top
leaves the taller one hanging 28px below the shorter one, and the top edge reads as two
rows at two different heights rather than as one. The offset that produces the centring
is in `docs/design/home.md`, derived there from the top-right cluster's 56px rather than
chosen; that cluster does not move.

**The labels bracket the toggle.** `CONSTELLATION`'s label begins on the sign-in toggle's
top edge and `NORTHSTAR`'s ends on its bottom edge, so the two names span exactly the
44px the toggle spans. That is what makes the top edge read as one band rather than as a
short row and a tall one: every element along it starts and ends together.

**The label is not centred in its target, and that is what lets both rules hold at
once.** Centred, a 44px target puts its label in the middle of itself, and two of them
stacked put the two labels 44px apart — far enough that the pair stops reading as a pair,
which is the composition this replaces. So the target keeps its 44px and the label moves
inside it: `CONSTELLATION`'s sits at the bottom of its box and `NORTHSTAR`'s at the top,
each 7px from that edge, which is the chrome's stacked rhythm doing the only job left for
it here. The labels end up 44px apart at their outer edges and 14px apart at their
facing ones.

The targets still tile at the shared centre line, so neither loses a pixel and they do
not overlap. Each one's slack runs outward, away from the other control, which is the
direction a mis-aimed tap goes anyway.

**None of this shrinks a target, and nothing here licenses shrinking one.** The
44px rule is not negotiable against composition: when the two disagreed, what moved was
the label's position inside its target, not the size of the target. If a future change
makes the two names sit closer still, the thing that has to give is the type's position
or the cluster's height, never the 44px.

**The composition that produces at 320 x 568.** Measured: the cluster is 88px tall, two
44px targets, pinned 34px from the top, so it ends 122px into a 568px window. The
bottom-left cluster starts at 507px, so the two clear each other by 385px — the height
the touch targets add is spent on empty corner. The visible type runs 56px to 100px,
matching the toggle's box to the pixel. Nothing changes horizontally: each button is the
width of the word that was there before it, the cluster still ends 128px from the left
edge, and the gutter to the top-right cluster is unchanged at 33px.

**Anchoring** is unchanged — all four clusters stay pinned to the four true corners at
every width. The margins they are pinned at, and the safe-area insets added to them, are
in `docs/design/home.md`.

---

## Reduced motion

Nothing in the chrome animates except the 160ms hover transitions, which are changes of
colour and glow only and involve no movement.

The glow is a static treatment. It starts no loop, timer or listener, and it is
unaffected by a reduced-motion preference.

The clock continues updating under reduced motion. It is information, not animation.

---

## Layering and pointer behaviour

All four clusters sit above the motif canvas and above the vignette layer, so they
remain legible against the globe.

The corner regions are non-interactive and must not intercept pointer events over the
canvas beneath them. Every interactive element opts back in for itself and nothing else
does. There are four of them: the two product names, the entry point and the sign-in
toggle. The two bottom clusters are entirely inert, and so is everything in the top-left
cluster that is not one of its two buttons, the separator included.

That is what keeps the motif reachable. A click in the top-left corner that is not on a
product name still lands on the canvas beneath, and the points there still scatter.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **The action behind the `p_Q` button.** The conversational surface it opens is not
  designed.
- **The destinations behind the two product names.** Both are buttons and both are
  inert. Neither Constellation nor Northstar has a designed surface, nothing is routed
  anywhere, and the page ships three controls that do nothing knowingly — the surfaces
  are close behind.
- **An accessible name for `p_Q`.** The other three controls have one. This one cannot,
  because an accessible name has to say what a button does and `p_Q`'s action is the
  entry above. A screen reader reads its visible label instead, which is poor, and the
  fix arrives with the surface rather than ahead of it.

---

## Related files

| File                           | Covers                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| `docs/design/home.md`          | The stage: layers, margins, sizing rules, window behaviour |
| `docs/design/globe.md`         | The motif                                                  |
| `docs/design/sign-in-panel.md` | The sign-in panel                                          |
