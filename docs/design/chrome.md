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
| Hover colour                | `#EAEDF4`                                   |
| Transition                  | 160ms ease                                  |
| Border, background, padding | None                                        |

Text only. No border, no fill, no padding — it reads as a word, not a control, until
hovered.

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

| Property      | Value                                       |
| ------------- | ------------------------------------------- |
| Height        | 34px                                        |
| Padding       | 0 16px                                      |
| Border        | 1px solid `#262D3A`                         |
| Background    | Transparent                                 |
| Type          | IBM Plex Mono, 10px, letter-spacing `0.2em` |
| Hover border  | `#4E9BFB`                                   |
| Hover colour  | `#EAEDF4`                                   |
| Active border | `#4E9BFB`                                   |
| Active colour | `#EAEDF4`                                   |
| Transition    | 160ms ease on border colour and text colour |
| Border radius | 0                                           |

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

Nothing in the chrome animates except the 160ms hover transitions, which are colour
changes only and involve no movement.

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
