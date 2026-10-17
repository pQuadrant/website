# Content

Owns where the site's words live and what changing them affects. The rule that copy
stays out of components is in [conventions](../docs/conventions.md#content).

## Where copy lives

| Copy                                                       | Location                                                                                                          | Consumed by                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Platform link label and URL (`https://app.pquadrant.com`)  | `homeContent.chrome.topRight` in [src/content/home.ts](../src/content/home.ts)                                    | `TopRightCluster`, via `StageShell`                                   |
| Tagline (`lead`, `emphasis`)                               | `homeContent.tagline` in `home.ts`                                                                                | `Tagline`, via `StageShell`                                           |
| Types for the above                                        | [src/content/types.ts](../src/content/types.ts): `HomeContent`, `ChromeContent`, `TaglineContent`, `ExternalLink` |                                                                       |
| Wordmark, HOME / MARKETPLACE, BROWSE AI SYSTEMS, catalogue | `spikeContent` in [src/spike/content.ts](../src/spike/content.ts), untyped `as const`                             | `SpikeTopBar`, `BrowseHint`, `MarketplaceHeading`, `MarketplacePanel` |
| Page title and description                                 | `metadata` in [src/app/layout.tsx](../src/app/layout.tsx)                                                         | Browser, search engines                                               |
| App name and description                                   | [src/app/manifest.ts](../src/app/manifest.ts)                                                                     | Installed web app                                                     |

- The site description is written twice, in `layout.tsx` and `manifest.ts`, outside
  `src/content/`. Change both.
- Glyphs that are presentation (`↓`, `/`) sit in components, marked `aria-hidden`.
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
  and at 320px wide the gap between the two top clusters.
- The tagline's `sr-only` copy is the full sentence; the animated words are hidden from
  assistive technology. Both come from the same strings.

**Verify** a wording change at the [window sizes](../docs/verification.md#window-sizes)
for wrapping and globe size, and replay the entrance.

## Marketplace copy and platform data

The catalogue is placeholder, live on production: rows `Popular`, `Automations`,
`Agents`, `Artificial Employees`, `More`, `Even more`; cards labelled `System 1` to `8`;
a search field with placeholder `Search (focus test)` that does nothing. The heading
`AI Systems` and line `Pick the job you need done.` are also in `spikeContent`.

**Intended, not implemented: platform-supplied marketplace data.** The website is meant
to receive selected marketplace information from the platform (a separate repository),
such as AI system versions, so visitors can evaluate offerings. Today there is no fetch,
API client, environment variable or data contract; all marketplace content is static in
this repository. Planning that integration has to settle, and record here: the
authoritative source, producer and consumer, the interface contract, failure and
loading behaviour, how a change on either side affects the other, and the
[public-data boundary](../AGENTS.md#public-repository-and-published-data). Nothing here
authorizes building it.
