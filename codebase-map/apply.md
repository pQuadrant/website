# Apply flow

Owns APPLY NOW, the panel it opens, and the screens inside it: the two-step application
form, opening an application again, the email code, and the screen that follows. The
forms check answers in the browser only: **nothing is sent or stored yet, and no code is
emailed**; the code screen accepts any six digits. Data decisions for applicants are
recorded in the platform repository's `docs/data-model.md`, not here.

## Where it lives

| Part                                                    | Location                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| APPLY NOW, backdrop, panel, focus on open and close     | `ApplyLauncher` in [src/components/apply/ApplyLauncher.tsx](../src/components/apply/ApplyLauncher.tsx)                   |
| Which screen shows, and moving between them             | `ApplyFlow` in [src/components/apply/ApplyFlow.tsx](../src/components/apply/ApplyFlow.tsx)                               |
| The application's steps, checking, messages, consent    | `ApplyForm` in [src/components/apply/ApplyForm.tsx](../src/components/apply/ApplyForm.tsx)                               |
| Opening an application again                            | `OpenApplicationForm` in [src/components/apply/OpenApplicationForm.tsx](../src/components/apply/OpenApplicationForm.tsx) |
| The email code screen                                   | `EmailCodeForm` in [src/components/apply/EmailCodeForm.tsx](../src/components/apply/EmailCodeForm.tsx)                   |
| The screen after the code: marketplace or custom        | `NextSteps` in [src/components/apply/NextSteps.tsx](../src/components/apply/NextSteps.tsx)                               |
| Every form's frame: title, line, actions row            | `ApplyStep`, `ApplyTitle` in [src/components/apply/](../src/components/apply/)                                           |
| One question: label, control, its message               | `ApplyField` in [src/components/apply/ApplyField.tsx](../src/components/apply/ApplyField.tsx)                            |
| A checkbox: consent or marketing, its message           | `ApplyCheckbox` in [src/components/apply/ApplyCheckbox.tsx](../src/components/apply/ApplyCheckbox.tsx)                   |
| Button and inline link styles                           | [src/components/apply/action-styles.ts](../src/components/apply/action-styles.ts)                                        |
| The questions, which are optional, length limits, rules | `APPLICATION_STEPS`, `MAX_LENGTH`, `answerProblem` in [src/lib/apply/application.ts](../src/lib/apply/application.ts)    |
| Tidying answers                                         | `tidyAnswer` in [src/lib/apply/application.ts](../src/lib/apply/application.ts)                                          |
| The code's length and rule                              | `CODE_LENGTH`, `codeProblem`, `tidyCode` in [src/lib/apply/email-code.ts](../src/lib/apply/email-code.ts)                |
| Where focus goes, on touch screens and otherwise        | `focusStart`, `focusProblem`, `usePendingFocus` in [src/lib/apply/focus.ts](../src/lib/apply/focus.ts)                   |
| Every word, including each field's messages             | `applyContent` in [src/content/apply.ts](../src/content/apply.ts), typed by `ApplyContent`                               |
| Panel, field, error and accent colours and glows        | The apply panel and primary action tokens in [globals.css](../src/app/globals.css)                                       |

`StageShell` owns whether the panel is open (`applyOpen`) and passes it through
`TopRightCluster` to `ApplyLauncher`, because three other parts of the stage react to
it (below).

## Behaviour

- **Opening and closing.** APPLY NOW toggles the panel. It also closes on a backdrop
  click, on Esc, and when the marketplace choice after the code is followed.
  Nothing navigates on open or close. The panel opens in 320ms
  (`cubic-bezier(0.2,0.7,0.2,1)`) and closes in 260ms (`cubic-bezier(0.4,0,1,1)`); the
  backdrop fades over 280ms. These are CSS transitions on `data-open`, so a click part
  way through reverses from wherever the panel is. Under reduced motion both are
  instant.
- **Screens.** `ApplyFlow` shows one screen at a time:

      apply ──SUBMIT──▶ code ──CONFIRM──▶ next
        │                ▲
        └─"Already applied?"─▶ open ──EMAIL ME A CODE─┘

  "Already applied? Open your application" sits beside CONTINUE on step one, where step
  two has BACK, so it adds no height. The open screen asks only for an email. BACK on
  the code screen returns to whichever screen asked for the code. The screen after the
  code thanks a new applicant by first name, or welcomes back a returning one; what a
  returning applicant should see there is not decided yet. **Wording:** opening an
  application again is never called signing in, because PLATFORM, beside it, is where
  customers sign in.

- **Kept progress.** The panel and its screens stay mounted while closed (invisible and
  `inert`), and the application and open screens stay mounted, `hidden`, while another
  screen shows, so answers and the current step survive moving between screens, closing
  and reopening, and route changes. The code screen is mounted only while shown, so it
  starts empty each time. A reload starts over. Once past the code, reopening shows the
  screen after it again.
- **Tidying.** When focus leaves a field, and for the whole step when it is
  submitted, `tidyAnswer` cleans the answer: spacing collapsed, email lowercased, and a
  name, company or role typed all in one case capitalised (with acronyms such as CEO
  and FZ-LLC kept in capitals). Mixed case is kept as typed. The code screen shows the
  tidied email and the screen after it the tidied first name. A code keeps only its
  digits, so a pasted "123 456" fits (`tidyCode`).
- **Checking.** Nothing is marked until a form's button is first pressed (CONTINUE,
  SUBMIT, EMAIL ME A CODE, CONFIRM). Then each
  field with a problem gets a red border and its own message under it, tied with
  `aria-describedby`; focus moves to the first such field (see focus, below), and each
  message goes as soon as its field is put right. Changing step starts checking over. Phone is the one
  optional question and is checked only when filled. Length limits are `maxLength`, so
  they need no message.
- **Consent.** Step two ends with two checkboxes. The first, agreeing to the Privacy
  Policy, is required; its "Privacy Policy" link opens `/privacy` in a new tab, so the
  form is not lost ([privacy policy](content.md#privacy-policy)). The second asks for
  marketing emails. It is optional and starts unticked, because consent to marketing
  has to be given rather than assumed; the policy's Marketing section says the same.
- **The code screen** asks for six digits, on a numeric keypad on phones, and lets the
  phone offer the code from the email (`autocomplete="one-time-code"`). "Send a new
  code" only shows that one is on its way. **Not built yet:** telling someone, after
  the code, that their email has already applied; it waits for real codes (the
  platform's `docs/data-model.md` records why it comes after the code).
- **The screen after the code** offers the marketplace (a link to `/marketplace` that
  also closes the panel) and a custom request. **The custom request button does
  nothing**: where it leads is not decided.
- **Focus.** [src/lib/apply/focus.ts](../src/lib/apply/focus.ts) decides where it
  goes. With a mouse or keyboard, opening and each new step or screen focus the first
  field, and
  a failed check focuses the first field with a problem. **Design constraint:** on a
  touch screen the form never opens the keyboard or a list's picker by itself, because
  it covers the step before it is read; focus goes to the panel's title
  (`data-step-title`) instead, stays put after a failed check, and a `role="status"`
  line announces how many answers need attention (`content.problems`). The reason is
  in `focus.ts`. Closing returns focus to APPLY NOW when it was in the panel or
  nowhere. While open, the dialog is `aria-modal` and everything outside the top-right
  corner is `inert`.

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
- **Fitting a phone.** The form keeps two columns at every width and tightens its
  spacing on phones, and again under 600px tall (`cramped:` in `globals.css`), so each
  step fits an upright phone's visible height without the panel scrolling, with every
  message shown: checked at 430 × 740, 412 × 780, 390 × 664, 375 × 629, 360 × 580 and
  375 × 553. Messages are kept to one line in a half column for this reason. For the
  same reason the checkbox lines are 36px tall on a phone and 28px under 600px tall,
  short of the 44px touch height the other controls keep. The open and code screens
  are shorter than either step. The panel
  still scrolls inside itself, scrollbar hidden, where nothing could fit: the 320px
  iPhone SE (320 × 460 visible) and phones on their side. The automate box is three
  lines tall, two under 600px tall, and scrolls inside itself.
- **Narrowest phones.** Below 380px wide (`narrowest:` in `globals.css`), the two
  top-right controls tighten their tracking, padding and gap so they clear the wordmark
  ([corner chrome](stage.md#corner-chrome)).

## Verification

Check open, close, an interrupted open and close, reopening with answers kept, each
step's messages and focus, Esc on both routes, a swipe through the open panel on a
phone, keyboard order, and reduced motion
([interactive states](../docs/verification.md#interactive-and-visual-states)). Check
the panel and the top-right corner at the [window sizes](../docs/verification.md#window-sizes),
including 379 and 380 wide, and at the phone heights listed under fitting a phone,
with every message shown. Behaviour with a phone's on-screen keyboard has to be checked on a
device.
