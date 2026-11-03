# Apply flow

Owns APPLY NOW, the panel it opens, and the screens inside it: the two-step application
form, opening an application again, the email code, and the screen that follows. The
panel talks to the pQuadrant platform's API: the platform checks whether an email has
applied, sends and checks every code, stores the applicant, and keeps an application
open on the device with a cookie. Data decisions for applicants, and every rule the
platform enforces, are in the platform repository's `docs/data-model.md`; the API's
contract is under Apply endpoints in its `apps/api/README.md`.

## Where it lives

| Part                                                       | Location                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| APPLY NOW, backdrop, panel, focus, whether one is open     | `ApplyLauncher` in [src/components/apply/ApplyLauncher.tsx](../src/components/apply/ApplyLauncher.tsx)                             |
| Which screen shows, and every call to the platform         | `ApplyFlow` in [src/components/apply/ApplyFlow.tsx](../src/components/apply/ApplyFlow.tsx)                                         |
| The application's steps, checking, messages, consent       | `ApplyForm` in [src/components/apply/ApplyForm.tsx](../src/components/apply/ApplyForm.tsx)                                         |
| Opening an application again                               | `OpenApplicationForm` in [src/components/apply/OpenApplicationForm.tsx](../src/components/apply/OpenApplicationForm.tsx)           |
| The email code screen and "Send a new code"                | `EmailCodeForm` in [src/components/apply/EmailCodeForm.tsx](../src/components/apply/EmailCodeForm.tsx)                             |
| The screen after the code, and "Not you?"                  | `NextSteps` in [src/components/apply/NextSteps.tsx](../src/components/apply/NextSteps.tsx)                                         |
| Every form's frame: title, line, error line, actions row   | `ApplyStep`, `ApplyTitle` in [src/components/apply/](../src/components/apply/)                                                     |
| One question: label, control, its message                  | `ApplyField` in [src/components/apply/ApplyField.tsx](../src/components/apply/ApplyField.tsx)                                      |
| A checkbox: consent or marketing, its message              | `ApplyCheckbox` in [src/components/apply/ApplyCheckbox.tsx](../src/components/apply/ApplyCheckbox.tsx)                             |
| Button and inline link styles, the space before a link     | [src/components/apply/action-styles.ts](../src/components/apply/action-styles.ts)                                                  |
| The questions, which are optional, length limits, rules    | `APPLICATION_STEPS`, `MAX_LENGTH`, `answerProblem` in [src/lib/apply/application.ts](../src/lib/apply/application.ts)              |
| Tidying answers                                            | `tidyAnswer` in [src/lib/apply/application.ts](../src/lib/apply/application.ts)                                                    |
| The code's length and rule, and the wait for a new one     | `CODE_LENGTH`, `codeProblem`, `tidyCode`, `NEW_CODE_WAIT_SECONDS` in [src/lib/apply/email-code.ts](../src/lib/apply/email-code.ts) |
| Every call to the platform, and its address                | `PLATFORM_API_URL` and one function per call in [src/lib/apply/platform.ts](../src/lib/apply/platform.ts)                          |
| Cloudflare Turnstile: loading it, keeping a token ready    | `TURNSTILE_SITE_KEY`, `loadTurnstile`, `useTurnstile` in [src/lib/apply/turnstile.ts](../src/lib/apply/turnstile.ts)               |
| Which message a failed call shows                          | `describeFailure` in [src/lib/apply/failure.ts](../src/lib/apply/failure.ts)                                                       |
| Where focus goes, on touch screens and otherwise           | `focusStart`, `focusProblem`, `usePendingFocus` in [src/lib/apply/focus.ts](../src/lib/apply/focus.ts)                             |
| Every word, including each field's and each call's message | `applyContent` in [src/content/apply.ts](../src/content/apply.ts), typed by `ApplyContent`                                         |
| Panel, field, error and accent colours and glows           | The apply panel and primary action tokens in [globals.css](../src/app/globals.css)                                                 |

`StageShell` owns whether the panel is open (`applyOpen`) and passes it through
`TopRightCluster` to `ApplyLauncher`, because three other parts of the stage react to
it (below). `ApplyLauncher` owns whether an application is open on this device
(`applicant`), because the button's label and the panel's first screen both depend on
it.

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
  the code screen returns to whichever screen asked for the code. While an application
  is open on this device, the panel shows only the screen after the code. **Wording:**
  opening an application again is never called signing in, because PLATFORM, beside it,
  is where customers sign in.

- **Staying open.** On load, `ApplyLauncher` asks the platform whether this device has
  an application open (`currentApplication`). If it has, the button reads APPLICATION
  on a narrow or short window and YOUR APPLICATION where the chrome is a row, and the
  panel opens on "Welcome back, Sara". Until the answer arrives, and if none comes, it
  reads APPLY NOW. Confirming a code opens the application too, greeting a new
  applicant with "Application received". "Not you?" closes it on this device and
  empties the form. The platform keeps it open for 30 days after the last visit.
- **Kept progress.** The panel and its screens stay mounted while closed (invisible and
  `inert`), and the application and open screens stay mounted, `hidden`, while another
  screen shows, so answers and the current step survive moving between screens, closing
  and reopening, and route changes. The code screen is mounted only while shown, so it
  starts empty each time. A reload starts over. Applying and "Not you?" empty the form
  (`formKey` in `ApplyFlow`).
- **Tidying.** When focus leaves a field, and for the whole step when it is
  submitted, `tidyAnswer` cleans the answer: spacing collapsed, email lowercased, and a
  name, company or role typed all in one case capitalised (with acronyms such as CEO
  and FZ-LLC kept in capitals). Mixed case is kept as typed. The code screen shows the
  tidied email and the screen after it the tidied first name. A code keeps only its
  digits, so a pasted "123 456" fits (`tidyCode`). The platform tidies again with the
  same rules (below).
- **Checking.** Nothing is marked until a form's button is first pressed (CONTINUE,
  SUBMIT, EMAIL ME A CODE, CONFIRM). Then each field with a problem gets a red border
  and its own message under it, tied with `aria-describedby`; focus moves to the first
  such field (see focus, below), and each message goes as soon as its field is put
  right. Changing step starts checking over. Phone is the one optional question and is
  checked only when filled. Length limits are `maxLength`, so they need no message.
- **Already applied.** When focus leaves the email field with a usable address, the
  platform is asked whether it has applied, and again on CONTINUE, which does not go on
  while it has. An address that has applied gets "This email has already applied. Open
  your application" under the field, from the moment the answer arrives; the link takes
  the address to the open screen. CONTINUE pressed while that check is still answering
  waits for its answer rather than asking again (`ApplyForm`'s `checkEmail`). A failed
  check on leaving the field is not shown; CONTINUE asks again and shows it. On the
  open screen, an address that has never
  applied is told so under the field, and no code is sent.
- **Calls to the platform.** While one is answering, the form's main button reads ONE
  MOMENT… and a second press does nothing. A failed call shows one line above the
  actions (`describeFailure`): no connection, the bot check failing, too many requests
  from this connection (with the minutes to wait), an email that could not be sent, or
  anything else as a problem on our side. The step stays where it was.
- **Bot check.** The email check and every code request carry a fresh Cloudflare
  Turnstile token; the platform refuses them without one. Cloudflare's script loads the
  first time the panel opens, not before. Getting a token takes Cloudflare one to two
  seconds, much longer than the platform takes to answer, so `useTurnstile` gets one
  ready whenever focus is in the panel (`prepare`, from `ApplyFlow`'s `onFocus`):
  opening the panel, each field and each new screen. A call takes the ready token, or
  waits for the one on its way. A token works once and for five minutes; a used or
  expired one is replaced on the next focus, not on a timer, so a panel left open does
  not keep running the check. Its widget is invisible almost always; when Cloudflare
  wants an interaction, its box appears at the bottom of the panel, usually just after
  the panel opens, with the form's own gap above it (`shown`, read from the box's
  holder's height). A check that cannot complete is reported as the bot check failing.
- **Consent.** Step two ends with two checkboxes. The first, agreeing to the Privacy
  Policy, is required; its "Privacy Policy" link opens `/privacy` in a new tab, so the
  form is not lost ([privacy policy](content.md#privacy-policy)). The second asks for
  marketing emails. It is optional and starts unticked, because consent to marketing
  has to be given rather than assumed; the policy's Marketing section says the same.
  Both go with the application, with the policy's `version`.
- **The code screen** asks for six digits, on a numeric keypad on phones, and lets the
  phone offer the code from the email (`autocomplete="one-time-code"`). CONFIRM sends
  the application with the code, or opens the application. A wrong, expired or used-up
  code, or five wrong tries, is shown under the field. "Send a new code" is replaced by
  a countdown until the platform allows a new one (60 seconds after the last, or as long
  as the platform says), and says when too many codes have been asked for in the hour.
- **The screen after the code** offers the marketplace (a link to `/marketplace` that
  also closes the panel) and a custom request, and "Not you?" under them. **The custom
  request button does nothing**: where it leads is not decided.
- **Focus.** [src/lib/apply/focus.ts](../src/lib/apply/focus.ts) decides where it
  goes. With a mouse or keyboard, opening and each new step or screen focus the first
  field, and a failed check, including one the platform reports, focuses the first
  field with a problem. **Design constraint:** on a touch screen the form never opens
  the keyboard or a list's picker by itself, because it covers the step before it is
  read; focus goes to the panel's title (`data-step-title`) instead, stays put after a
  failed check, and a `role="status"` line announces how many answers need attention
  (`content.problems`). The reason is in `focus.ts`. A failed call's line is a
  `role="alert"`. Closing returns focus to APPLY NOW when it was in the panel or
  nowhere. While open, the dialog is `aria-modal` and everything outside the top-right
  corner is `inert`.

## Connections

- **The platform's API.** [src/lib/apply/platform.ts](../src/lib/apply/platform.ts) is
  the only place the website calls it. Its paths, request fields and refusal codes are
  the platform's contract (`apps/api/README.md`, Apply endpoints, in the platform
  repository); renaming a code there breaks a message here. The platform allows calls
  only from `https://pquadrant.com`, `https://www.pquadrant.com` and
  `http://localhost:3000` (`config.api.allowedOrigins` in its `infra/lib/config.ts`), so
  the site served from any other address, including the LAN server, cannot apply.
  The platform lets browsers keep its answer to the check made before each POST or
  DELETE for 10 minutes (`CORS_PREFLIGHT_SECONDS` in its `apps/api/src/main.ts`), which
  spares each call a round trip.
- **Turnstile's hostnames.** The widget's hostnames in the Cloudflare dashboard and the
  platform's `config.api.turnstileHostnames` are both `pquadrant.com`,
  `www.pquadrant.com` and `localhost`; a new hostname for the site needs adding to both.
- **The cookie.** It belongs to `api.pquadrant.com` and is `SameSite=Lax`, so it is
  stored and sent only while the site is served from `pquadrant.com`, the same site.
  From `localhost` everything works except remembering the applicant after a reload.
  Serving the website or the API from another registrable domain would stop it.
- **Rules kept in step by hand.** `answerProblem`, `tidyAnswer`, `MAX_LENGTH` and the
  company sizes are repeated in the platform's `apps/api/src/apply/answers.ts`, and the
  email rule in its `email-address.ts`; the platform's copy is the one that counts.
  `NEW_CODE_WAIT_SECONDS` is the platform's 60-second wait. Change them together.
- **Privacy Policy.** The policy's `version` is sent with each application, so changing
  the policy means changing `updated` and `version` together. The policy names
  Cloudflare, the cookie that keeps an application open, and the country worked out
  from the IP address with DB-IP's credit, which its licence requires
  ([privacy policy](content.md#privacy-policy)).
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
  pixels smaller). The open-application label is wider, but arrives after the globe has
  measured the corner, and the globe measures again only on a resize; the top-right
  corner is not the nearest corner at the sizes in the globe map, so the radius rarely
  depends on it.
- **Stars.** The button carries `data-star-clear`, so the starfield keeps stars off its
  label and regenerates when the label's size changes
  ([text clearance](starfield.md#text-clearance)). On a visit with an application open,
  the label changes shortly after load, and the stars are placed again once.
- **Fitting a phone.** The form keeps two columns at every width and tightens its
  spacing on phones, and again under 600px tall (`cramped:` in `globals.css`), so each
  step fits an upright phone's visible height without the panel scrolling, with every
  message shown: checked at 430 × 740, 412 × 780, 390 × 664, 375 × 629, 360 × 580 and
  375 × 553, including the already-applied line under the email in place of its
  message. Messages are kept to one line in a half column for this reason. For the
  same reason the checkbox lines are 36px tall on a phone and 28px under 600px tall,
  short of the 44px touch height the other controls keep. The open and code screens
  are shorter than either step. The panel still scrolls inside itself, scrollbar
  hidden, where nothing could fit: the 320px iPhone SE (320 × 460 visible) and phones
  on their side. The automate box is three lines tall, two under 600px tall, and
  scrolls inside itself.
- **Narrowest phones.** Below 380px wide (`narrowest:` in `globals.css`), the two
  top-right controls tighten their tracking, padding and gap so they clear the wordmark
  ([corner chrome](stage.md#corner-chrome)). The APPLICATION label tightens further
  there; YOUR APPLICATION would overlap the wordmark on an upright phone, which is why
  it is kept to row windows.

## Verification

Check open, close, an interrupted open and close, reopening with answers kept, each
step's messages and focus, Esc on both routes, a swipe through the open panel on a
phone, keyboard order, and reduced motion
([interactive states](../docs/verification.md#interactive-and-visual-states)). Check
the panel and the top-right corner at the [window sizes](../docs/verification.md#window-sizes),
including 379 and 380 wide, with both APPLY NOW and the open-application label, and at
the phone heights listed under fitting a phone, with every message shown.

The calls to the platform need a real browser: Cloudflare does not give headless Chrome
a Turnstile token. Walk the flow against the live API from `localhost:3000` or the
published site: an email that has not applied, then has; a wrong code then the right
one; "Send a new code" during and after the wait; opening an application; "Not you?";
and a failed call, by going offline. Remembering the applicant after a reload can only
be checked on `pquadrant.com`. Behaviour with a phone's on-screen keyboard has to be
checked on a device.
