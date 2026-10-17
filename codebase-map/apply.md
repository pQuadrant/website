# Apply flow

Owns APPLY NOW, the panel it opens, the two-step application form and the screen that
follows it. The form checks answers in the browser only: **nothing is sent or stored
yet**, and the confirmation screen appears on the browser's checks alone. Data decisions
for applications are recorded in the platform repository's `docs/data-model.md`, not
here.

## Where it lives

| Part                                                    | Location                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| APPLY NOW, backdrop, panel, focus on open and close     | `ApplyLauncher` in [src/components/apply/ApplyLauncher.tsx](../src/components/apply/ApplyLauncher.tsx)                |
| Steps, checking, messages, consent, the screen after    | `ApplyForm` in [src/components/apply/ApplyForm.tsx](../src/components/apply/ApplyForm.tsx)                            |
| One question: label, control, its message               | `ApplyField` in [src/components/apply/ApplyField.tsx](../src/components/apply/ApplyField.tsx)                         |
| Primary and secondary button styles                     | [src/components/apply/action-styles.ts](../src/components/apply/action-styles.ts)                                     |
| The questions, which are optional, length limits, rules | `APPLICATION_STEPS`, `MAX_LENGTH`, `answerProblem` in [src/lib/apply/application.ts](../src/lib/apply/application.ts) |
| Every word, including each field's messages             | `applyContent` in [src/content/apply.ts](../src/content/apply.ts), typed by `ApplyContent`                            |
| Panel, field, error and accent colours and glows        | The apply panel and primary action tokens in [globals.css](../src/app/globals.css)                                    |

`StageShell` owns whether the panel is open (`applyOpen`) and passes it through
`TopRightCluster` to `ApplyLauncher`, because three other parts of the stage react to
it (below).

## Behaviour

- **Opening and closing.** APPLY NOW toggles the panel. It also closes on a backdrop
  click, on Esc, and when the marketplace choice on the confirmation screen is followed.
  Nothing navigates on open or close. The panel opens in 320ms
  (`cubic-bezier(0.2,0.7,0.2,1)`) and closes in 260ms (`cubic-bezier(0.4,0,1,1)`); the
  backdrop fades over 280ms. These are CSS transitions on `data-open`, so a click part
  way through reverses from wherever the panel is. Under reduced motion both are
  instant.
- **Kept progress.** The panel and form stay mounted while closed (invisible and
  `inert`), so answers and the current step survive closing and reopening, and route
  changes. A reload starts over. After a successful submit, reopening shows the
  confirmation screen again.
- **Checking.** Nothing is marked until the first press of CONTINUE or SUBMIT. Then each
  field with a problem gets a red border and its own message under it, tied with
  `aria-describedby`; focus moves to the first such field, and each message goes as
  soon as its field is put right. Changing step starts checking over. Phone is the one
  optional question and is checked only when filled. Length limits are `maxLength`, so
  they need no message.
- **Consent.** Step two ends with a required checkbox. Its "Privacy Policy" link opens
  `/privacy` in a new tab, so the form is not lost. **That page does not exist yet**;
  the link leads to the not-found page until it is built.
- **The confirmation screen** offers the marketplace (a link to `/marketplace` that
  also closes the panel) and a custom request. **The custom request button does
  nothing**: where it leads is not decided.
- **Focus.** Opening focuses the first control in the panel. Closing returns focus to
  APPLY NOW when it was in the panel or nowhere. While open, the dialog is
  `aria-modal` and everything outside the top-right corner is `inert`.

## Connections

- **Stacking.** The button, backdrop and panel all render inside the top-right corner
  region. The backdrop and panel are `fixed`, so they share the region's place above
  everything else on the stage, and the region's own box, which the globe measures,
  is unchanged by them ([motif radius](globe.md#motif-radius)). The PLATFORM link and
  APPLY NOW are `relative z-20` to stay above the backdrop (`z-0`) and panel (`z-10`).
  A transform, filter or `will-change` on that region would make it the panel's
  containing block and move the panel.
- **Type.** The corner's row is set in the chrome's mono label style; the panel resets
  to `font-sans tracking-normal`.
- **Esc.** One listener in `StageShell` closes the panel first and otherwise leaves the
  marketplace, so one press never does both ([navigation](routes.md#navigation-and-gestures)).
- **Inert stage.** `StageShell` wraps the top-left cluster and the route content in
  `contents` elements that become `inert` while the panel is open. They hold no box, so
  nothing moves.
- **Swipe up.** `HomeSwipe` listens on `window`, which `inert` does not reach, so it is
  switched off while the panel is open; otherwise a scroll through the form on a phone
  would open the marketplace.
- **Globe size.** APPLY NOW widens the top-right corner. At the sizes checked when it
  was added, the globe kept its size except on phones on their side (844 × 390: two
  pixels smaller).
- **Narrowest phones.** Below 380px wide (`narrowest:` in `globals.css`), the two
  top-right controls tighten their tracking, padding and gap so they clear the wordmark
  ([corner chrome](stage.md#corner-chrome)).

## Verification

Check open, close, an interrupted open and close, reopening with answers kept, each
step's messages and focus, Esc on both routes, a swipe through the open panel on a
phone, keyboard order, and reduced motion
([interactive states](../docs/verification.md#interactive-and-visual-states)). Check
the panel and the top-right corner at the [window sizes](../docs/verification.md#window-sizes),
including 379 and 380 wide. On short windows the panel scrolls inside itself; its
scrollbar is hidden. Behaviour with a phone's on-screen keyboard has to be checked on a
device.
