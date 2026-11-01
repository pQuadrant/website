# Content

Owns where the site's words live and what changing them affects. The rule that copy
stays out of components is in [conventions](../docs/conventions.md#content).

## Where copy lives

| Copy                                                      | Location                                                                                                                                          | Consumed by                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Wordmark, HOME / MARKETPLACE                              | `chromeContent.topLeft` in [src/content/chrome.ts](../src/content/chrome.ts)                                                                      | `TopLeftCluster`                         |
| Platform link label and URL (`https://app.pquadrant.com`) | `chromeContent.topRight` in `chrome.ts`                                                                                                           | `TopRightCluster`                        |
| Tagline (`lead`, `emphasis`), BROWSE AI SYSTEMS           | `homeContent.tagline`, `homeContent.browse` in [src/content/home.ts](../src/content/home.ts)                                                      | `Tagline`, `BrowseHint`                  |
| Marketplace heading, line and catalogue                   | `marketplaceContent` in [src/content/marketplace.ts](../src/content/marketplace.ts)                                                               | `MarketplaceHeading`, `MarketplacePanel` |
| APPLY NOW and every screen of the apply panel             | `applyContent` in [src/content/apply.ts](../src/content/apply.ts)                                                                                 | `ApplyLauncher` and the apply screens    |
| Privacy policy                                            | `privacyContent` in [src/content/privacy.ts](../src/content/privacy.ts)                                                                           | `PrivacyPolicy`                          |
| Types for the above                                       | [src/content/types.ts](../src/content/types.ts): `ChromeContent`, `HomeContent`, `MarketplaceContent`, `ApplyContent`, `PrivacyContent` and parts |                                          |
| Page title and description                                | `metadata` in [src/app/layout.tsx](../src/app/layout.tsx)                                                                                         | Browser, search engines                  |
| App name and description                                  | [src/app/manifest.ts](../src/app/manifest.ts)                                                                                                     | Installed web app                        |

- The site description is written twice, in `layout.tsx` and `manifest.ts`, outside
  `src/content/`. Change both.
- Glyphs that are presentation (`↓`, `/`) sit in components, marked `aria-hidden`.
- `StageShell` passes each component its copy as props; no component imports a content
  file.
- `home.ts` notes that the tagline wording is not final.

## Wording effects

Changing the words changes layout and motion, not only text:

- **Tagline length moves the globe.** The tagline wrapper is a chrome corner, and on
  most windows it is what limits the globe's size
  ([motif radius](globe.md#motif-radius)). Longer or wider copy can make the globe
  smaller, on desktop windows too. That is a visible change; report it with the copy
  change rather than letting it pass as a text edit.
- **Tagline timing scales with word count.** Each word animates on its own delay, and
  the emphasis starts after `FIRST_WORD_MS + words × STAGGER_MS + EMPHASIS_HOLD_MS`
  ([entrance timeline](stage.md#page-entrance-timeline)). The split into `lead` and
  `emphasis` is a copy decision; the emphasis is brighter, later and underlined.
- **Stars re-clear around new text** automatically when it carries `data-star-clear`
  ([text clearance](starfield.md#text-clearance)).
- **Chrome label width** changes the top corner boxes, which also feed the globe's size,
  and below 380px wide the gap between the wordmark and the two top-right controls
  (15px at 320px with APPLY NOW, 10px with APPLICATION). YOUR APPLICATION overlaps the
  wordmark on an upright phone, so it is used only where the chrome is a row
  ([apply flow](apply.md#connections)).
- **Apply form copy** changes the panel's height. Each step is meant to fit an upright
  phone without scrolling, with messages on one line in a half column; check the phone
  heights in [fitting a phone](apply.md#connections) after a wording change. That
  includes the messages for the platform's answers (`errors`, `emailApplied`,
  `open.notApplied`, the code's refusals), which are keyed by the platform's refusal
  codes in `describeFailure` and the forms.

**Verify** a wording change at the [window sizes](../docs/verification.md#window-sizes)
for wrapping and globe size, and replay the entrance.

## Marketplace copy and platform data

The catalogue is placeholder, live on production: rows `Popular`, `Automations`,
`Agents`, `Artificial Employees`, `More`, `Even more`; cards labelled `System 1` to `8`;
a search field with placeholder `Search (focus test)` that does nothing. The heading
`AI Systems` and line `Pick the job you need done.` are in the same file, which marks
all of its copy as not final.

**Intended, not implemented: platform-supplied marketplace data.** The website is meant
to receive selected marketplace information from the platform (a separate repository),
such as AI system versions, so visitors can evaluate offerings. Today there is no fetch
or data contract for it; all marketplace content is static in this repository. The only
calls the site makes to the platform are the apply panel's, through
[src/lib/apply/platform.ts](../src/lib/apply/platform.ts) ([apply flow](apply.md#connections)),
which marketplace data could share the address and error handling of. Planning that integration has to settle, and record here: the
authoritative source, producer and consumer, the interface contract, failure and
loading behaviour, how a change on either side affects the other, and the
[public-data boundary](../AGENTS.md#public-repository-and-published-data), and whether
routes kept in the client cache indefinitely
([route structure](routes.md#route-structure)) would show stale data. Nothing here
authorizes building it.

## Privacy policy

`/privacy` renders `privacyContent` through `PrivacyPolicy`
([src/components/privacy/PrivacyPolicy.tsx](../src/components/privacy/PrivacyPolicy.tsx)).
**Design constraint:** it is linked only from the apply form's consent checkbox and
appears in no navigation or footer; the reason is the product owner's decision, recorded
beside `privacyContent`. Its wordmark matches the stage's in position, size and
tracking, and leads home. The contact address is linked wherever it appears.

The reading column hangs off the left margin. From 1100px wide (`stage:`), a contents
list, `PrivacyContents`
([src/components/privacy/PrivacyContents.tsx](../src/components/privacy/PrivacyContents.tsx)),
sits sticky against the right margin and lights the section being read: the last one
whose heading has passed the top fifth of the window. The final window-height of
scrolling is shared out equally between the sections that have not reached that line
by then, so the short closing sections each take a turn, and an entry chosen from the
list stays lit until the visitor scrolls. It listens to scroll at most once a frame. Section ids come from
the headings (`sectionId` in `PrivacyPolicy`), so renaming a heading changes its link.

**The policy describes what the site does, so it must change with it.** When a change
adds booking, analytics, advertising or any other cookie, or gives data to a new service
provider, update the matching sections, and `updated` and `version` together, in the
same change. `version` is sent with each application as the policy the applicant agreed
to ([apply flow](apply.md#connections)). It names Cloudflare for bot protection,
describes the cookie that keeps an application open, and says the country is worked out
from the IP address, crediting DB-IP with a link, which DB-IP's licence requires (a
block with a link, rendered by `PrivacyPolicy`). It states that application data is
stored with AWS in Stockholm, which matches the platform's live database (eu-north-1).
It has not been reviewed by a lawyer.

**Design constraint:** the Cookies section's wording is the product owner's, kept as
written, including "You can change your choice at any time in Cookie settings" ahead of
the cookie banner, which is planned and not built. **Open:** "we do not use it for
advertising" under How we use it will need revisiting when advertising cookies arrive
with the banner.
