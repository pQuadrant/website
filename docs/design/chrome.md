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

It binds the two product names only for as long as they are plain text. The rule's
reason is that the chrome is not navigation; the product names are going to become
buttons that open a product surface, and on the day they do, the reason no longer
describes them and the rule stops governing their size. Their type is decided on that
ticket, in this file, before the code changes. Until then they are 10px like everything
else here.

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

| Role   | Applies to                       | Colour    | Glow             |
| ------ | -------------------------------- | --------- | ---------------- |
| `fg-0` | `SIGN IN`, and every hover state | `#EAEDF4` | 0.28 alpha, 12px |
| `fg-1` | Product names, `p_Q`             | `#8B94A2` | 0.22 alpha, 10px |
| `fg-2` | The toggle's label, panel open   | `#59626E` | 0.21 alpha, 9px  |
| `fg-3` | Telemetry, server line, clock    | `#414A56` | 0.20 alpha, 8px  |

The values are held as tokens in `globals.css`, `--text-shadow-glow-0` through
`--text-shadow-glow-3`, and never as literals in a component.

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
| Product names              | 6.58:1  | 6.54:1  |
| Server line                | 2.24:1  | 2.24:1  |
| Core version and transport | 2.24:1  | 2.23:1  |
| City and clock             | 2.24:1  | 2.23:1  |
| `p_Q`                      | 6.61:1  | 6.61:1  |
| `SIGN IN`, on its own fill | 16.23:1 | 16.11:1 |

The largest loss is 0.12 of a contrast point, on the string with sixteen of them to
spare. The telemetry — the weakest value on the page, and the one to watch if these
numbers are ever retuned — loses 0.012.

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

The two product names are stored as separate values rather than one combined string.
They become independently clickable later.

---

## Top-left cluster

Anchored **64px** from the left edge, **62px** from the top.

A vertical stack, **7px** gap between the two rows.

**Row 1 — product line**

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

**Row 2 — server line**

| Value             | Colour    |
| ----------------- | --------- |
| `SERVER EG-CAI-1` | `#414A56` |

IBM Plex Mono, 10px, letter-spacing `0.16em`.

Static display value. The identifier does not correspond to infrastructure and nothing
resolves it.

---

## Top-right cluster

Anchored **64px** from the right edge, **56px** from the top.

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

Both controls in this cluster carry a visible focus indicator: a 1px ring in `#EAEDF4`
with a 16px halo of the same colour at 0.3 alpha, held as `--shadow-glow-focus`.

It is built from this file's glow rather than the browser's default outline, so the page
keeps one visual language, and the default outline is suppressed where it applies. The
ring carries the boundary and the halo carries the emission; neither on its own is both
crisp enough to locate and of a piece with the rest of the chrome.

It is a `focus-visible` treatment, so it appears for a keyboard and not on a click or a
tap, and it is deliberately outside the 160ms transition — a focus indicator that fades
in is a focus indicator that is briefly not there.

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

Anchored **64px** from the right edge, **64px** from the bottom.

| Value                                                                         | Example          |
| ----------------------------------------------------------------------------- | ---------------- |
| City name, then the current time in Cairo, 24-hour, zero-padded to two digits | `CAIRO 16:50:21` |

IBM Plex Mono, 10px, letter-spacing `0.14em`, colour `#414A56`.

**This is the only live value in the chrome.** It updates once per second.

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

| Cluster      | Above 640px                      | Below 640px                     |
| ------------ | -------------------------------- | ------------------------------- |
| Top-left     | Product line as a row, 14px gaps | Product names stacked, 7px gaps |
| Top-right    | Row, 34px tall, 18px gap         | Row, 44px tall, 10px gap        |
| Bottom-left  | Row, 40px gap                    | Stacked, 7px gap                |
| Bottom-right | One line                         | Unchanged — already one line    |

The stacked gap is **7px** throughout, which is the gap the top-left cluster already
uses between its two rows. Stacking does not introduce a second vertical rhythm.

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

The height belongs to the row, not to the controls. The top-right row is 34px above the
breakpoint and 44px below it, and both children stretch to fill it, so neither carries a
height or padding of its own. A control that sizes itself is a control that can disagree
with the one beside it.

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

The two bottom clusters and the top-left cluster are non-interactive and must not
intercept pointer events over the canvas beneath them. Only the two buttons in the
top-right cluster are interactive.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **The action behind the `p_Q` button.** The conversational surface it opens is not
  designed.
- **Making the product names clickable.** They are plain text for now. Do not add link
  markup, routes, or hover states in anticipation.
- **The type size of the product names once they become buttons.** Decided on that
  ticket, in this file, before the code changes. See _What the chrome is for_.

---

## Related files

| File                           | Covers                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| `docs/design/home.md`          | The stage: layers, margins, sizing rules, window behaviour |
| `docs/design/globe.md`         | The motif                                                  |
| `docs/design/sign-in-panel.md` | The sign-in panel                                          |
