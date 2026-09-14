# Sign-in panel — design specification

The sign-in form on the pQuadrant home page. Build against this file. If the code and
this file disagree, one of them is wrong; fix it rather than working around it.

Read `docs/design/home.md` first. It defines the stage, the panel's placement on it,
and the terms used here. The control that opens and closes this panel is specified in
`docs/design/chrome.md`.

---

## What the panel is

A single form: email, password, submit. It is the only interactive surface on the
page and the only route into the pQuadrant platform.

It reads as an instrument panel rather than a card. Square corners, a single hairline
border, no shadow, no rounded anything, no frosted glass or backdrop blur. It sits
directly over the motif with a translucent fill, so the globe remains faintly visible
through it.

**The panel's height never changes between states.** Every state it can enter fits
inside the same box. Nothing on the page moves when the form's contents change. This is
the single most important rule in this file and the reason for several of the layout
decisions below.

**It has two compositions**, the same parts in the same order laid out two ways:

| Composition   | When                                             | Outer size |
| ------------- | ------------------------------------------------ | ---------- |
| **Portrait**  | Every window that is not landscape               | 400 x 488  |
| **Landscape** | At least **640px** wide and under **500px** tall | 640 x 250  |

The landscape trigger is built from the two numbers the chrome already reflows on —
see `docs/design/chrome.md` — so it adds no breakpoint. It is the chrome's _short_
trigger with the _narrow_ one excluded: a window under 640px wide cannot hold two
columns, and gets the portrait composition however short it is.

**Rotating the device keeps the form.** Both compositions are one element laid out two
ways by CSS, not two panels, so what has been typed, the attempt count and any message
survive a change of orientation.

---

## Container

| Property        | Portrait                                   | Landscape                       |
| --------------- | ------------------------------------------ | ------------------------------- |
| Width           | 400px                                      | 640px                           |
| Padding         | 36px top, 32px left and right, 30px bottom | 20px top and bottom, 32px sides |
| Border          | 1px solid `#1E242F`                        | same                            |
| Border radius   | 0                                          | same                            |
| Background      | `rgba(8, 10, 15, 0.9)`                     | same                            |
| Backdrop filter | None                                       | same                            |
| Box shadow      | None                                       | same                            |

**Width on a narrow window.** Either width gives way to the window rather than holding:
the panel is its width or the window width less twice the narrow margin (24px),
whichever is smaller. At 320px the portrait panel is 272px; at 667px the landscape panel
is 619px. Everything inside is a column within the padding, so it narrows with the
container.

**The border is outside the budget.** The two compositions below add to **486px** and
**248px** between the borders; the 1px border above and below makes the outer boxes
**488px** and **250px**. An earlier draft quoted 486 as an outer height while budgeting
only padding and content, which puts the portrait footer 2px into its bottom padding.
The clear zone the motif dims is measured from the outer box — see `docs/design/globe.md`.

### How the height is held constant

**Every box in the panel has a height that no state can change,** and the panel is the
sum of them. That is what makes the height deterministic, and it is a stronger guarantee
than a stored constant: a constant is right at exactly one width, and this panel runs from
272px wide to 640px.

- Every line of type has an explicit line height, so its box cannot resolve differently
  between two browsers.
- Inputs, the submit button and the divider have explicit heights.
- The error slot reserves the **tallest message it can hold, at the current width**, in
  every state — see _Error slot_.
- The footer's height depends on whether its two links fit on one line, which is a
  function of the panel's width and never of its state — see _Footer links_.

So the height is the same in every state at a given window size. It is 488px at every
portrait width from about **355px** up, which covers every current phone. Below that the
error slot takes a third line and the panel is 504px; below about 343px the footer takes
a second line too and it is 524px, at 320. Landscape is 250px at every width it applies
at.

There is no `--spacing-panel-height` token. It held 572px, a figure that the composition
never produced, and no single value could be correct at every width.

**Appearance transition.** When opened, the panel fades from 0 to full opacity over
700ms with an ease. It does not slide, scale, or move. Under reduced motion it appears
immediately with no fade.

Everything that arrives because the panel opened arrives on that same fade: the chrome
receding, and the motif dimming behind the panel. The dimming reaches 26px past the
panel's edge, so a backdrop that landed at once read as a darker panel appearing ahead of
this one — see _Clear zone_ in `docs/design/globe.md`.

**Closing.** When the panel closes, its contents are discarded. Reopening presents an
empty form. Do not preserve typed values, error states, or attempt counts across a
close.

---

## Portrait composition

Top to bottom, between the borders:

```
 36   padding-top
 31   wordmark line box
 12   header gap
 13   subhead line box
 28   gap
  1   divider
 28   gap
 13   EMAIL label
  9   label to input
 34   email input
 26   stack gap
 13   PASSWORD label
  9   label to input
 34   password input
 26   stack gap
 32   error slot, reserved in every state   (2 lines x 10px x 1.6)
 26   stack gap
 46   submit button
 26   stack gap
 13   footer row
 30   padding-bottom
───
486   + 2px border = 488
```

1. Header group
2. Divider rule, 28px below the header group
3. Field stack, starting 28px below the divider, a column with a **26px** gap between
   every item: email field, password field, error slot, submit button, footer links.

---

## Landscape composition

A phone on its side has very little height. **Measured on an iPhone 15 Pro, Safari
gives the page about 312px** with its address and tab bars showing, which is how it
opens; a larger phone gets about 350px and an iPhone SE less than 312. The portrait panel
is 488px and cannot be used there. **The row becomes a column pair, and each field
becomes a row.** Nothing is hidden and no type is scaled.

**It has to fit with room around it, not merely fit.** The first landscape composition
was 320px with no clearance, on the assumption of a 330px viewport. On the phone it met
the tab bar at the top and ran under the home indicator at the bottom, and the page
scrolled: the panel was wedged into the window rather than sitting in it. The panel now
keeps **24px** above and below — the page's one clearance number — so on the 312px
viewport it can be at most 264px tall. It is 250px.

Keeping the labels above their inputs cannot reach that. Two labelled 44px fields, the
error slot and the submit button are 210px before any gap or padding; with the inputs cut
to 34px and every gap tightened it is still about 268px. What gives is the two label
lines, which move beside their inputs.

The alternatives were a panel that scrolls inside itself, which puts a second scroll
inside a page that already scrolls on a short window; the two fields side by side, which
is shorter still but leaves each input about 150px wide, so most addresses scroll inside
the field; and refusing the orientation, which a web page cannot do.

```
┌────────────────┬─┬────────────────────────────────────┐
│ wordmark       │ │ EMAIL        name@company.com      │
│                │ │              ───────────────────── │
│ subhead        │ │ PASSWORD   ••••••••••••          │
│                │ │              ───────────────────── │
│                │ │ error slot                         │
│ FORGOT …       │ │                                    │
│ REQUEST …      │ │ [ SIGN IN                      → ] │
└────────────────┴─┴────────────────────────────────────┘
      176px      36 1 36  labels 16      the rest
```

**Left column, 176px.** The header group at the top, left-aligned, then the footer links
at the bottom, stacked. The subhead takes `line-height: 1.6` here, because
`AUTHENTICATED ACCESS ONLY` is about 190px and wraps to two lines inside 176px.

**Divider.** The horizontal rule becomes a vertical one: 1px wide, `#1E242F`, the full
height of the content box, 36px from each column.

**Right column, the form.** Email, password, error slot, submit, with a **14px** gap.

**Each field is one 44px row:** the label on the left, then **16px**, then the input,
label and value sharing a baseline. The label column is as wide as the wider of the two
labels, `PASSWORD`, so both inputs start on the same line; it is sized by the labels
rather than stated, so a change of copy keeps them aligned. The bottom rule runs under the
input only. The error slot and the submit button span the whole column.

| Item        | Landscape    | Why it differs from portrait                      |
| ----------- | ------------ | ------------------------------------------------- |
| Field       | One 44px row | Two label lines are what does not fit             |
| Input       | 44px         | A landscape window is a touch window; 44px target |
| Input value | 16px         | Safari's focus zoom — see _Fields_                |
| Stack gap   | 14px         | 26px does not fit                                 |
| Error slot  | 32px         | Unchanged                                         |
| Submit      | 46px         | Unchanged; already clears 44px                    |

```
 20   padding-top
 44   EMAIL row
 14   gap
 44   PASSWORD row
 14   gap
 32   error slot, reserved
 14   gap
 46   submit
 20   padding-bottom
───
248   + 2px border = 250
```

At the narrowest landscape window, 640px, the input is about 197px wide; at 667px about
224px; at 852px about 245px.

The left column uses 31 + 12 + 32 at the top and 88 at the bottom of the same 208px, so
it never sets the height.

---

## Escape affordance

A text button whose label sits 14px from the right edge and 13px from the top of the
panel, outside the header group's layout. Same position in both compositions.

| Property                | Value                                       |
| ----------------------- | ------------------------------------------- |
| Label                   | `ESC`                                       |
| Type                    | IBM Plex Mono, 9px, letter-spacing `0.22em` |
| Colour                  | `#414A56`                                   |
| Hover and active colour | `#EAEDF4`                                   |
| Transition              | 160ms ease                                  |
| Border, background      | None                                        |
| Hit area                | 44 x 44px, in the panel's top-right corner  |

It closes the panel. Pressing the Escape key does the same thing; the label is a hint
about the key as much as it is a control.

**The hit area is 44px and the label does not move.** The button is a 44px square pinned
to the panel's corner and the label is placed inside it by padding, so the 9px type sits
exactly where it did. On a phone this is the control that closes the panel whenever the
chrome has receded, and a 9px target is not a control on a touch screen. The focus ring
is drawn around the label, not the square.

In the landscape composition the square reaches 23px into the right-hand end of the
`EMAIL` row. The field sits above it there, so a tap in that strip focuses the field rather than closing
the panel and discarding the form. The destructive action loses the tie.

It requires an accessible label of its own, since `ESC` alone does not describe the
action to a screen reader.

`#414A56` on the panel fill falls well below the AA contrast threshold. This is
accepted here because the action it performs is available other ways: the Escape key and
the toggle in the top-right chrome. Do not raise the value to "fix" the contrast. If the
accessibility position changes, it changes in this file first and the code follows.

---

## Header group

A vertical column, **12px** gap. Centred in portrait, left-aligned in landscape.

**Wordmark**

The drawn pQuadrant wordmark is 58 × 31px at 96% opacity, supplied as an SVG and written
directly into the component. **It has not been supplied.** Until it is, the identity is
typed: `pQuadrant` in IBM Plex Mono, 14px, letter-spacing `0.02em`, `#EAEDF4` at 96%
opacity, vertically centred in a **31px** box, exposed as an image named `pQuadrant`.

That is a stand-in and it is sized so the mark can replace it without anything moving:
the 31px box is the mark's height. Both the visible text and the accessible label are
user-facing text and live in `src/content/`.

The wordmark is deliberately small inside the panel. Restraint is the point. Do not
scale it up.

The `p_Q` label in the top-right chrome is typed characters in the mono typeface and is
not this asset. The two rendering differently is intended.

**Subhead**

| Value       | `AUTHENTICATED ACCESS ONLY`                  |
| ----------- | -------------------------------------------- |
| Type        | IBM Plex Mono, 10px, letter-spacing `0.16em` |
| Line height | 13px portrait; 1.6 landscape, where it wraps |
| Colour      | `#59626E`                                    |

---

## Divider

A 1px rule in `#1E242F`. Horizontal and the full inner width in portrait, 28px below the
header group. Vertical and the full inner height in landscape, between the columns.

---

## Fields

Both fields share the same structure: a label above an input, **9px** apart — or, in
landscape, a label beside its input, 16px apart, on one 44px row.

**The label and the input are one target.** The label wraps the input, so the whole block
— 56px in portrait, the full 44px row in landscape — focuses the field. This is what gives the 34px
portrait input a hit area above 44px without the input growing.

**Label**

IBM Plex Mono, 10px, letter-spacing `0.2em`, line height 13px.

| State      | Colour     |
| ---------- | ---------- |
| Resting    | `#8B94A2`  |
| Focused    | `#A8C4F0`  |
| Transition | 180ms ease |

The label is always visible. It is never a floating label and never collapses into the
input.

**Input**

| Property    | Value                                                           |
| ----------- | --------------------------------------------------------------- |
| Width       | Full inner width                                                |
| Height      | 34px portrait, 44px landscape                                   |
| Padding     | 0                                                               |
| Border      | None, except a 1px bottom rule                                  |
| Background  | Transparent                                                     |
| Text colour | `#EAEDF4`                                                       |
| Text size   | 14px, IBM Plex Sans — 16px on a coarse pointer and in landscape |
| Transition  | 180ms ease on the bottom rule colour                            |

Bottom rule colour by state:

| State                            | Colour    |
| -------------------------------- | --------- |
| Resting                          | `#262D3A` |
| Focused                          | `#A8C4F0` |
| After a failed attempt           | `#EAEDF4` |
| Named by a missing-field message | `#EAEDF4` |

Focus wins over the other two: a flagged field that takes focus shows the focused rule.

The failed-attempt colour applies to **both** fields, not only the one at fault. The
form does not identify which credential was wrong. The missing-field colour applies to
the named field only — there is no secret to keep about which field is empty.

**Field-specific values**

|                             | Email              | Password                     |
| --------------------------- | ------------------ | ---------------------------- |
| Label                       | `EMAIL`            | `PASSWORD`                   |
| Input type                  | Email              | Password                     |
| Placeholder                 | `name@company.com` | Twelve bullet characters `•` |
| Letter-spacing on the value | `-0.01em`          | `0.06em`                     |
| Spellcheck                  | Off                | Off                          |
| Autocapitalise, autocorrect | Off                | —                            |
| Autocomplete                | Username           | Current password             |
| Keyboard return key         | Next               | Go                           |

**16px on a coarse pointer is not a style preference.** Safari on iOS zooms the page
whenever a field below 16px takes focus. It scales the whole document, pushes the
composition off centre, and the visitor cannot undo it. The two ways out are a 16px field
or disabling pinch zoom, and disabling pinch zoom is not on the table: it takes zoom away
from everyone, including the people who need it, to protect two pixels of type. Landscape
is 16px regardless of pointer because it is a touch composition.

**Placeholder colour** is `#3F474C`. This is below the AA contrast threshold and is
accepted, because both fields carry a permanently visible label and the placeholder
conveys only an example of the expected format.

**Autocomplete must be enabled.** Disabling it on a sign-in form breaks password
managers, which is a real obstacle for the exact users this page exists to serve.
Enabling it means a filled field is styled by the browser: the background painted behind
an autofilled value follows the document's dark colour scheme, which
`docs/design/home.md` requires. The autofilled text is held at `#EAEDF4`. Check both
fields with a saved credential, not only empty.

**The password placeholder is a placeholder, not a value.** The field must be empty
on render, and nothing else may suggest it has content: no filled underline state, no
active label colour.

---

## Error slot

**The slot is always present in the layout, in every state, including the first
render,** and it always reserves the height of the tallest message it can show. This is
what holds the panel's height constant.

**It reserves by laying that message out.** The two-line invalid-credentials message is
rendered into the slot invisibly, hidden from assistive technology, and the live message
sits over it in the same cell. The slot is therefore exactly as tall as the tallest
message at the current width, in every state:

- **32px** — two lines at 10px × 1.6 — at every width where line two fits, which is
  every portrait window from about 355px up and every landscape window.
- **48px** below that. `ATTEMPT 5 OF 5 · SESSION LOGGED` with its border and padding is
  about 236px, and a 350px window leaves the panel 236px inside its padding, so the line
  wraps. A fixed 32px slot overflows into the submit button there the first time the
  message appears, which is exactly the movement this slot exists to prevent.

This replaces a fixed 32px. It needs no breakpoint and no measured copy width, and it
stays right if the copy changes.

Empty, the slot produces a larger gap between the password field and the submit button
than between the other items in the stack. That is intended and reads as a deliberate
pause before the commit action. Do not remove the reserve to close the gap.

When a message is showing:

| Property        | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Left border     | 1px solid `#EAEDF4`                                           |
| Padding left    | 12px                                                          |
| Type            | IBM Plex Mono, 10px, letter-spacing `0.12em`, line-height 1.6 |
| Line one colour | `#EAEDF4`                                                     |
| Line two colour | `#8B94A2`                                                     |

**Invalid credentials**

Line one: `CREDENTIALS NOT RECOGNISED`

Line two: `ATTEMPT {n} OF 5 · SESSION LOGGED`

The separator is a middle dot `·` (U+00B7).

**The counter is one-based and counts attempts already made.** After the first failed
attempt it reads `ATTEMPT 1 OF 5`. It does not read past the limit: what happens after
the fifth failure belongs to the backend, which is not decided.

**This copy asserts two behaviours that must actually exist.** It tells the visitor that
attempts are limited to five and that the session is being logged. If the backend does
not enforce a limit after five failed attempts and does not record the attempt, this
copy is false and must be changed rather than shipped. See _Submission_ below for why it
cannot appear in production today.

**Missing field**

Submitting with a field empty does not reach the backend and must not look like the
credentials error. One line only, no second line, no attempt counted:

| Empty field | Message                  |
| ----------- | ------------------------ |
| Email       | `ENTER AN EMAIL ADDRESS` |
| Password    | `ENTER YOUR PASSWORD`    |

Email is checked first. The named field's bottom rule turns `#EAEDF4` and it takes focus;
the other field stays resting. An email containing only spaces counts as empty; a
password does not, since a space is a character a password can contain.

**No red.** Every message is monochrome by design. There is no error colour anywhere in
this design and none is to be introduced.

**Announcement.** The slot is a polite live region, present from the first render, so a
message is announced without the visitor having to move focus to find it. The flagged
fields are marked invalid and described by it.

**Clearing.** The message clears as soon as either field is edited.

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
| Overflow      | Clipped                                                        |
| Transition    | 180ms ease on border and text colour, 320ms ease on shadow     |

**By state**

| State      | Label            | Glyph | Border    | Text      |
| ---------- | ---------------- | ----- | --------- | --------- |
| Resting    | `SIGN IN`        | `→`   | `#262D3A` | `#EAEDF4` |
| Processing | `AUTHENTICATING` | `◍`   | `#262D3A` | `#C7D8F5` |
| Granted    | `ACCESS GRANTED` | `✓`   | `#A8C4F0` | `#A8C4F0` |

**Hover and active** (resting state only): border and text both become `#A8C4F0`. The
active state is not a duplicate: hover rules never apply on a touch screen.

**Processing glow.** While processing, the button carries
`0 0 34px rgba(49, 131, 245, 0.45)` outside and `inset 0 0 22px rgba(49, 131, 245, 0.16)`
inside. This is the only box shadow on the entire page.

**Scan line.** While processing, a 1px line spans 38% of the button's width along its
bottom edge, in `#3183F5`, travelling left to right across the button on a 1100ms linear
loop. The button clips it at each edge. Under reduced motion it holds still at the left
end; the processing state is still distinguishable through the label, glyph and glow.

**Submission**

The form submits on click and on Enter in the password field. **Enter in the email
field submits too, except when the password is still empty,** where it moves focus to
the password instead and shows nothing. That is the "Next" key on a phone keyboard, and
answering it with `ENTER YOUR PASSWORD` would scold a visitor for doing what the
keyboard told them to.

**The button is disabled while processing and after access is granted,** and repeated
submissions must not queue. It is disabled to assistive technology and stays focusable,
rather than taking the `disabled` attribute: a disabled element drops keyboard focus to
the document, and a screen reader loses its place at the exact moment the state it is
waiting for arrives. Fields are read-only in the same states.

**No backend exists.** The form takes its authentication as a function supplied by
whatever renders it. Until a backend is decided nothing is supplied, and a complete form
passes the missing-field checks and then does nothing. The processing, granted and
invalid-credentials states are built and reachable only through that function.

A preview stand-in exists so the states can be reviewed. It lives in one file marked for
deletion, is switched on only by `NEXT_PUBLIC_SIGN_IN_PREVIEW=1`, and is never enabled in
a deployment: it asserts a logged session and an attempt limit that do not exist.

---

## Footer links

Two buttons, pushed to opposite ends of the inner width in portrait and stacked at the
bottom of the left column in landscape.

IBM Plex Mono, 10px, letter-spacing `0.14em`, line height 13px.

| Position | Label             | Colour    |
| -------- | ----------------- | --------- |
| First    | `FORGOT PASSWORD` | `#8B94A2` |
| Second   | `REQUEST ACCESS`  | `#59626E` |

Hover and active: `#EAEDF4` with the `fg-0` halo, 160ms ease. Neither label carries a
glyph: an arrow after `REQUEST ACCESS` promised a destination the button does not have.

Both destinations are undecided and neither button does anything yet. See _Not yet
specified_.

**Portrait on a narrow window: the second link wraps.** The two labels are about 215px
together. Inside a 272px panel there are 206px, so at 320px they do not fit at all. The
row wraps once the labels cannot sit at least 14px apart — the chrome's own product-line
gap — and the second link drops to its own line, 7px below, still at the right-hand end.
This happens below about 343px of window, so no current phone other than a 320px one
sees it. It is decided by whether the labels fit, not by a breakpoint.

**Hit areas.** Each link is 13px of type and each has a 44px hit area built from invisible
padding, which moves nothing:

- The first link's reaches 25px up, stopping 1px short of the submit button, and 6px down.
- The second link's reaches 1px up and 30px down, to the inside of the bottom border.

On one line those two areas sit side by side. Wrapped, they tile exactly at the 7px gap
between the lines — the first ends where the second begins — so there is no strip where
a tap lands on neither and no strip where it lands on both. The same two rules hold in
both arrangements, which is why they are asymmetric.

In landscape the links are stacked 44px rows with the label vertically centred, tiling
with no gap, the same construction as the top-left chrome cluster in a tight window.

Every button in the panel carries the chrome's focus indicator on `:focus-visible` — a
1px `#EAEDF4` ring with a 16px halo — outside every transition. The panel does not scale
with the window, so its copy of the indicator is fixed at those values rather than scaled
by the chrome's unit.

---

## States

The panel resolves into these states. Every one of them occupies the same height.

**Closed.** Not rendered. The toggle in the top-right chrome reads `SIGN IN`.

**Default.** Empty fields, resting colours, empty error slot.

**Field focused.** The focused field's label and bottom rule turn accent. The motif
brightens; that behaviour is specified in `docs/design/globe.md`.

**Missing field.** Blocked locally: one-line message, named field's rule `#EAEDF4` and
focused, nothing sent, no attempt counted, no change to the motif.

**Processing.** Button shows its processing label, glyph, glow and scan line. Fields are
read-only. The motif spins up and the auth bloom layer on the stage becomes visible.

**Granted.** Button shows its granted label, glyph and accent colours. The motif returns
to idle. What follows is undecided; see _Not yet specified_.

**Invalid credentials.** Error slot filled. Both field bottom rules turn `#EAEDF4`. The
motif performs a single dim and contract, and clears itself — the form never clears it.
The counter increments.

**Closing while processing** abandons the attempt: its result is ignored when it
arrives, and the motif returns to idle. Closing inside the motif's error flinch leaves
the flinch to finish on its own.

---

## Keyboard, focus and the on-screen keyboard

**Opening moves focus into the panel — to the panel itself, not to a field**, on every
device. It is announced as the `Sign in` dialog. The visitor's first click or tap on a
field, or their first Tab, goes into the form.

Two reasons, and either would be enough:

- **A focused field lights the motif.** Focus is one of the globe's states — see
  `docs/design/globe.md` — and lit on arrival, the bright dots around the panel made the
  dimmed clear zone behind it stand out as a dark rectangle landing ahead of the panel
  while the panel was still fading in. The motif now brightens when the visitor chooses a
  field, which is what the state is for.
- **On a phone a focused field raises the keyboard** over half the panel while it is still
  fading in — or, on iOS, where focus from script does not always raise the keyboard,
  leaves a field lit as focused with no keyboard, which reads as broken.

An earlier version focused the email field on a fine pointer, to save a desktop visitor
one click. It is not worth either cost.

**Focus is contained within the panel while it is open.** Tab and Shift+Tab cycle through
its controls and never reach the chrome or the page behind it. If focus has left the
panel — a click on the globe sends it to the document — the next Tab brings it back.

**Escape closes the panel** from anywhere while it is open, not only from inside it.

**Closing returns focus to the toggle** in the top-right chrome. Focus must never be left
on an element that has been removed. If the chrome had receded, it is visible again by the
time focus arrives.

**Clicking outside the panel does not close it.** The only way out is a control or the
key. A stray tap on the globe must not discard a half-typed form.

Every interactive element in the panel has a visible focus indicator. The inputs
communicate focus through two simultaneous colour cues, the label and the bottom rule,
which is sufficient. The buttons carry the ring described under _Footer links_.

**The on-screen keyboard.** The panel does not change when a keyboard opens. The
composition is chosen from the layout viewport, which a keyboard does not resize, so
focusing a field never swaps portrait for landscape underneath the visitor. The browser
keeps the focused field in view by panning, and the panel does not fight it: no script
scrolls the page, and nothing is re-centred on the visual viewport, which would move the
form on every keyboard animation frame. The keyboard's return key walks the form — Next
on the email field, Go on the password.

---

## The chrome while the panel is open

The corner chrome recedes whenever the open panel would come within **24px** of any
corner cluster. It fades out over the panel's own 700ms as the panel fades in, stops
taking pointer events and leaves the accessibility tree; it fades back when the panel
closes. Under reduced motion both are immediate.

**It is measured, not keyed to a breakpoint,** using the corner regions the motif already
measures. The panel's reach is taken over the whole of the page's scroll: on a window
short enough to scroll, the panel travels past fixed chrome, so it counts as meeting the
chrome if it would at any scroll position. The answer is therefore a property of the
window's size — it does not flicker as the page scrolls.

**Where it recedes and where it does not**, from the rule:

| Window                                   | Chrome  | Why                                                        |
| ---------------------------------------- | ------- | ---------------------------------------------------------- |
| 1440 x 900, 1920 x 1080                  | Stays   | Clusters are far outside the panel                         |
| 1133 x 744, 768 x 1024                   | Stays   | Nearest cluster clears the panel                           |
| 390 x 844, 430 x 932                     | Stays   | Top clusters end 56px above the panel                      |
| 375 x 667, 360 x 640, 320 x 568          | Recedes | `CLOSE` would sit on top of the panel's `ESC`              |
| 852 x 312 to 932 x 430, landscape phones | Recedes | The panel's top edge comes within 24px of the top clusters |
| 1060 x 480, the tallest landscape phone  | Stays   | A 250px panel clears every corner                          |
| About 800 x 600                          | Recedes | The product names run over the top of the panel            |

**Why receding rather than living with the overlap.** The previous position, in
`docs/design/home.md`, accepted that the chrome sits over the panel on a short window,
on the grounds that the corner regions take no pointer events. That no longer holds: the
chrome has four controls that do, and one of them lands on `ESC`. In landscape the
bottom-left telemetry draws over `REQUEST ACCESS`. A modal form with a focus trap already
makes the chrome unreachable by keyboard; receding makes it unreachable by eye and finger
too, but only where it would otherwise be in the way.

**This is not hiding to make a window fit.** The chrome is still on screen at every size
while the panel is closed. What recedes is the frame around a dialog while the dialog is
the subject — the same reasoning that dims the toggle's label to `#59626E` when the chrome
stays.

---

## Reduced motion

The panel appears immediately with no fade, and the chrome recedes and returns
immediately. The scan line holds still. The auth bloom is suppressed. The 160ms and 180ms
colour transitions continue: they are changes of colour with no movement.

---

## Not yet specified

Do not invent behaviour for any of the following. Stop and ask.

- **Where a successful sign-in goes.** The granted state currently terminates. No
  destination, redirect, or session handling has been decided.
- **Where `REQUEST ACCESS` points.** It must not ship as a link to nowhere.
- **Where `FORGOT PASSWORD` points.** The recovery flow is not designed.
- **The authentication backend.** No provider, endpoint, session mechanism, or error
  taxonomy has been decided. The preview stand-in is scaffolding and must be deleted, not
  adapted, when it is.
- **Rate limiting and attempt logging.** Required by the error copy, not yet
  implemented. See _Error slot_.
- **The drawn wordmark.** The typed stand-in holds its place. See _Header group_.
- **The browser's back gesture.** It does not close the panel; closing on back would
  mean adding a history entry for a dialog, which is a decision about the page's
  navigation model.

---

## Verify

In every state, at every size, the panel's height must not change by a pixel.

| Window                     | Expect                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1440 x 900                 | Portrait 400 x 488, concentric with the globe, chrome stays                                                        |
| 1512 x 855                 | Same                                                                                                               |
| 1133 x 744                 | Portrait — must **not** take landscape                                                                             |
| 390 x 844                  | Portrait 342 wide, 488 tall, chrome stays                                                                          |
| 375 x 667                  | Portrait 327 wide, 488 tall; footer on one row; chrome recedes                                                     |
| 360 x 640                  | Portrait 312 wide, 488 tall; chrome recedes                                                                        |
| 320 x 568                  | Portrait 272 wide, 524 tall; footer wraps; slot 48; page scrolls; chrome recedes                                   |
| 852 x 312                  | iPhone 15 Pro, Safari bars showing: landscape 640 x 250, at least 24px clear above and below, page does not scroll |
| 932 x 330                  | Landscape 640 x 250, page does not scroll, chrome recedes                                                          |
| 896 x 414                  | Landscape                                                                                                          |
| 844 x 390                  | Landscape                                                                                                          |
| 667 x 375                  | Landscape at 619 wide                                                                                              |
| Landscape under 298px tall | Page scrolls rather than clipping; 250 + 24 + 24 no longer fits                                                    |

Verify with a coarse pointer as well as a fine one, and on a real phone for the keyboard
and for autofill.

---

## Related files

| File                    | Covers                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `docs/design/home.md`   | The stage: layers, margins, sizing rules, window behaviour       |
| `docs/design/chrome.md` | The corner clusters, including the control that opens this panel |
| `docs/design/globe.md`  | The motif, including how it responds to this panel's states      |
