# Sign-in panel — design specification

The sign-in form on the pQuadrant home page. Build against this file. If the code and
this file disagree, one of them is wrong; fix it rather than working around it.

Read `docs/design/home.md` first. It defines the stage, the panel's placement on it,
and the terms used here. The control that opens and closes this panel is specified in
`docs/design/chrome.md`.

---

## What the panel is

A single form: email, passphrase, submit. It is the only interactive surface on the
page and the only route into the pQuadrant platform.

It reads as an instrument panel rather than a card. Square corners, a single hairline
border, no shadow, no rounded anything, no frosted glass or backdrop blur. It sits
directly over the motif with a translucent fill, so the globe remains faintly visible
through it.

**The panel has one fixed height that never changes.** Every state it can enter fits
inside that height. Nothing on the page moves when the form's contents change. This is
the single most important rule in this file and the reason for several of the layout
decisions below.

---

## Container

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| Width           | 400px                                      |
| Padding         | 36px top, 32px left and right, 30px bottom |
| Border          | 1px solid `#1E242F`                        |
| Border radius   | 0                                          |
| Background      | `rgba(8, 10, 15, 0.9)`                     |
| Backdrop filter | None                                       |
| Box shadow      | None                                       |

Placement on the stage is specified in `docs/design/home.md`.

**Height.** Fixed, and equal to the height the panel occupies in its tallest state,
which is the state with an error message showing. Because the error slot is always
reserved (see _Error slot_ below), every state produces the same height, so this value
is deterministic rather than arbitrary. Compute it from the composition rules in this
file and hold it as a constant; do not let the container size to its contents.

**Appearance transition.** When opened, the panel fades from 0 to full opacity over
700ms with an ease. It does not slide, scale, or move. Under reduced motion it appears
immediately with no fade.

**Closing.** When the panel closes, its contents are discarded. Reopening presents an
empty form. Do not preserve typed values, error states, or attempt counts across a
close.

---

## Composition

Top to bottom inside the padding:

1. Header group
2. Divider rule, 28px below the header group
3. Field stack, starting 28px below the divider

The field stack is a vertical column with a **26px** gap between every item. Its items,
in order:

1. Email field
2. Passphrase field
3. Error slot
4. Submit button
5. Footer links

---

## Escape affordance

A text button anchored 14px from the right edge and 13px from the top of the panel,
outside the header group's centred layout.

| Property                    | Value                                       |
| --------------------------- | ------------------------------------------- |
| Label                       | `ESC`                                       |
| Type                        | IBM Plex Mono, 9px, letter-spacing `0.22em` |
| Colour                      | `#414A56`                                   |
| Hover colour                | `#EAEDF4`                                   |
| Transition                  | 160ms ease                                  |
| Border, background, padding | None                                        |

It closes the panel. Pressing the Escape key does the same thing; the label is a hint
about the key as much as it is a control.

It requires an accessible label of its own, since `ESC` alone does not describe the
action to a screen reader.

`#414A56` on the panel fill falls well below the AA contrast threshold. This is
accepted here because the action it performs is available three other ways: the Escape
key, the toggle in the top-right chrome, and browser-native dismissal of the focus
trap. Do not raise the value to "fix" the contrast. If the accessibility position
changes, it changes in this file first and the code follows.

---

## Header group

A centred vertical column, **12px** gap.

**Wordmark**

The drawn pQuadrant wordmark, 58 × 31px, at 96% opacity.

Supplied as an SVG and written directly into the component rather than loaded as an
image file. It needs an accessible label reading `pQuadrant`, and that label is
user-facing text, so it lives in `src/content/` like any other string.

The wordmark is deliberately small inside a 400px panel. Restraint is the point. Do not
scale it up.

Note that the `p_Q` label in the top-right chrome is typed characters in the mono
typeface, not this asset. The two rendering differently is intended.

**Subhead**

| Value  | `AUTHENTICATED ACCESS ONLY`                  |
| ------ | -------------------------------------------- |
| Type   | IBM Plex Mono, 10px, letter-spacing `0.16em` |
| Colour | `#59626E`                                    |

---

## Divider

A 1px horizontal rule in `#1E242F`, spanning the full inner width of the panel, 28px
below the header group.

---

## Fields

Both fields share the same structure: a label above an input, **9px** apart.

**Label**

IBM Plex Mono, 10px, letter-spacing `0.2em`.

| State      | Colour     |
| ---------- | ---------- |
| Resting    | `#8B94A2`  |
| Focused    | `#A8C4F0`  |
| Transition | 180ms ease |

The label is always visible. It is never a floating label and never collapses into the
input.

**Input**

| Property    | Value                                |
| ----------- | ------------------------------------ |
| Width       | Full inner width                     |
| Height      | 34px                                 |
| Padding     | 0                                    |
| Border      | None, except a 1px bottom rule       |
| Background  | Transparent                          |
| Text colour | `#EAEDF4`                            |
| Text size   | 14px, IBM Plex Sans                  |
| Transition  | 180ms ease on the bottom rule colour |

Bottom rule colour by state:

| State                  | Colour    |
| ---------------------- | --------- |
| Resting                | `#262D3A` |
| Focused                | `#A8C4F0` |
| After a failed attempt | `#EAEDF4` |

The failed-attempt colour applies to **both** fields, not only the one at fault. The
form does not identify which credential was wrong.

**Field-specific values**

|                             | Email              | Passphrase                   |
| --------------------------- | ------------------ | ---------------------------- |
| Input type                  | Email              | Password                     |
| Placeholder                 | `name@company.com` | Twelve bullet characters `•` |
| Letter-spacing on the value | `-0.01em`          | `0.06em`                     |
| Spellcheck                  | Off                | Off                          |
| Autocomplete                | Username           | Current password             |

**Placeholder colour** is `#3F474C`. This is below the AA contrast threshold and is
accepted, because both fields carry a permanently visible label and the placeholder
conveys only an example of the expected format. No information exists only in the
placeholder.

**Autocomplete must be enabled.** The prototype disables it on both fields. That is a
deviation, not a design decision to carry over: disabling autocomplete on a sign-in
form breaks password managers, which is a real obstacle for the exact users this page
exists to serve, and it is invisible in a screenshot.

**The passphrase placeholder is a placeholder, not a value.** The field must be empty
on render. Bullet characters as placeholder text make an empty field look filled, so it
is especially important that nothing else suggests the field has content: no filled
underline state, no active label colour.

---

## Error slot

**The slot is always present in the layout, in every state, including the first
render.** It occupies its full height whether or not a message is showing. This is what
holds the panel's height constant.

The slot's height is two lines of text at 10px with a line-height of 1.6.

Empty, it produces a larger gap between the passphrase field and the submit button than
between the other items in the stack. That is intended and reads as a deliberate pause
before the commit action. Do not remove the reserve to close the gap.

When a message is showing:

| Property        | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Left border     | 1px solid `#EAEDF4`                                           |
| Padding left    | 12px                                                          |
| Type            | IBM Plex Mono, 10px, letter-spacing `0.12em`, line-height 1.6 |
| Line one colour | `#EAEDF4`                                                     |
| Line two colour | `#8B94A2`                                                     |

**Content**

Line one: `CREDENTIALS NOT RECOGNISED`

Line two: `ATTEMPT {n} OF 5 · SESSION LOGGED`

The separator is a middle dot `·` (U+00B7).

**The counter is one-based and counts attempts already made.** After the first failed
attempt it reads `ATTEMPT 1 OF 5`. The prototype increments before rendering and shows
`ATTEMPT 2 OF 5` on the first failure; that is a bug and must not be reproduced.

**This copy asserts two behaviours that must actually exist.** It tells the visitor that
attempts are limited to five and that the session is being logged. If the backend does
not enforce a limit after five failed attempts and does not record the attempt, this
copy is false and must be changed rather than shipped. A public sign-in page attracts
automated credential stuffing, so the rate limit is worth having independently of the
copy.

**No red.** The invalid-credentials state is monochrome by design. There is no error
colour anywhere in this design and none is to be introduced.

**Announcement.** The message must be announced to assistive technology when it
appears, without the user having to move focus to find it.

**Clearing.** The message clears as soon as either field is edited. It does not persist
while the user is correcting their input.

---

## Submit button

| Property      | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| Width         | Full inner width                                               |
| Height        | 46px                                                           |
| Padding       | 0 16px                                                         |
| Border        | 1px solid, colour by state                                     |
| Border radius | 0                                                              |
| Background    | Transparent                                                    |
| Type          | IBM Plex Mono, 11px, letter-spacing `0.22em`                   |
| Layout        | Label on the left, glyph on the right, both vertically centred |
| Glyph opacity | 55%                                                            |
| Transition    | 180ms ease on border and text colour, 320ms ease on shadow     |

**By state**

| State      | Label            | Glyph | Border    | Text      |
| ---------- | ---------------- | ----- | --------- | --------- |
| Resting    | `SIGN IN`        | `→`   | `#262D3A` | `#EAEDF4` |
| Processing | `AUTHENTICATING` | `◍`   | `#262D3A` | `#C7D8F5` |
| Granted    | `ACCESS GRANTED` | `✓`   | `#A8C4F0` | `#A8C4F0` |

**Hover** (resting state only): border and text both become `#A8C4F0`.

**Processing glow.** While processing, the button carries
`0 0 34px rgba(49, 131, 245, 0.45)` outside and `inset 0 0 22px rgba(49, 131, 245, 0.16)`
inside. This is the only box shadow on the entire page.

**Scan line.** While processing, a 1px line spans 38% of the button's width along its
bottom edge, in `#3183F5`, travelling across the button on a 1100ms linear loop. The
button clips its overflow so the line disappears at each edge.

Under reduced motion the scan line is not animated. The processing state is still
distinguishable through the label, glyph and glow.

**Submission**

The form submits on click and on Enter pressed in either field. The prototype has no
form semantics and does not respond to Enter; that is a defect, not a design choice.

The button is disabled while processing, and repeated submissions must not queue.

**Empty fields.** Submitting with either field empty does not reach the backend and
does not produce the credentials error. Prevent submission and indicate which field is
missing. The prototype sends empty values and reports them as invalid credentials after
a delay, which is misleading.

---

## Footer links

Two items on a row, pushed to opposite ends of the panel's inner width.

IBM Plex Mono, 10px, letter-spacing `0.14em`.

| Position | Label               | Colour    |
| -------- | ------------------- | --------- |
| Left     | `FORGOT PASSPHRASE` | `#8B94A2` |
| Right    | `REQUEST ACCESS →`  | `#59626E` |

Both destinations are undecided. See _Not yet specified_.

---

## States

The panel resolves into five states. Every one of them occupies the same height.

**Closed.** Not rendered. The toggle in the top-right chrome reads `SIGN IN`.

**Default.** Empty fields, resting colours, empty error slot.

**Field focused.** The focused field's label and bottom rule turn accent. The motif
brightens; that behaviour is specified in `docs/design/globe.md`.

**Processing.** Button shows its processing label, glyph, glow and scan line. Fields are
not editable. The motif spins up and the auth bloom layer on the stage becomes visible.

**Granted.** Button shows its granted label, glyph and accent colours. What follows is
undecided; see _Not yet specified_.

**Invalid credentials.** Error slot filled. Both field bottom rules turn `#EAEDF4`. The
motif performs a single dim and contract. The counter increments.

---

## Keyboard and focus

Opening the panel moves focus into it, to the email field.

Focus is contained within the panel while it is open. Tab does not reach the chrome or
the page behind it.

Escape closes the panel from anywhere within it.

Closing returns focus to the toggle button in the top-right chrome. Focus must never be
left on an element that has been removed.

Every interactive element in the panel has a visible focus indicator. The prototype
removes the default outline from the inputs and communicates focus only through the
label and bottom rule colour; that is sufficient for the inputs, which have two
simultaneous colour cues. It is not sufficient for the buttons, which need a visible
indicator of their own.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Where a successful sign-in goes.** The granted state currently terminates. No
  destination, redirect, or session handling has been decided.
- **Where `REQUEST ACCESS` points.** It must not ship as a link to nowhere.
- **Where `FORGOT PASSPHRASE` points.** The recovery flow is not designed.
- **The authentication backend.** No provider, endpoint, session mechanism, or error
  taxonomy has been decided. The prototype's hardcoded credential and fixed delay are
  scaffolding and must not be carried over in any form.
- **Rate limiting and attempt logging.** Required by the error copy, not yet
  implemented. See _Error slot_.
- **Any window narrower than 1024px.** No panel behaviour has been decided for mobile
  or tablet.

---

## Related files

| File                    | Covers                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `docs/design/home.md`   | The stage: layers, margins, sizing rules, window behaviour       |
| `docs/design/chrome.md` | The corner clusters, including the control that opens this panel |
| `docs/design/globe.md`  | The motif, including how it responds to this panel's states      |
