# Codebase map

Choose the area that matches the change, open its relevant section and the linked
implementation, and verify against the code. Cross-references are detours: read the
named section, then return to the task. Follow further links only when the change needs
them.

The site is one persistent stage serving two routes, `/` and `/marketplace`. Most
connections here are behavioural rather than imports: shared CSS properties, a shared
clock, matching timings, and elements measured by other layers.

## Areas

| Map                                 | Responsibility                                                                                           | Read when changing                                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Stage](stage.md#stage)             | Document shell, layers, vertical centre, corner chrome, tokens and breakpoints, entrance, reduced motion | `globals.css` tokens or margins, `Stage`, `layout.tsx`, chrome controls, [the centre](stage.md#stage-centre), [entrance timing](stage.md#page-entrance-timeline), [reduced motion](stage.md#reduced-motion) |
| [Routes](routes.md#routes)          | Home and marketplace: mode, route content, globe move, fades, gestures, focus                            | Anything in `src/spike/` or `src/app/(stage)/`, [transition timing](routes.md#route-transition-timing), [gestures](routes.md#navigation-and-gestures), `--mk-*`                                             |
| [Globe](globe.md#globe)             | Globe component and engine, size rule, point generator                                                   | `src/lib/globe/`, `Globe`, [anything that affects the globe's size](globe.md#motif-radius)                                                                                                                  |
| [Starfield](starfield.md#starfield) | Star canvases, field, ambient light, text clearance, pointer drag                                        | `src/lib/starfield/`, `Starfield`, [adding text to the page](starfield.md#text-clearance)                                                                                                                   |
| [Content](content.md#content)       | Where copy lives and what wording changes affect; intended platform data                                 | `src/content/`, metadata, [any copy change](content.md#wording-effects), [marketplace data](content.md#marketplace-copy-and-platform-data)                                                                  |
| [Delivery](delivery.md#delivery)    | CI, GitHub rules, Amplify publishing                                                                     | Workflows, merge or deploy questions, [what merging publishes](delivery.md#publishing)                                                                                                                      |

Working rules are in [AGENTS.md](../AGENTS.md). Code conventions are in
[docs/conventions.md](../docs/conventions.md). Commands and verification procedures are
in [docs/verification.md](../docs/verification.md).

## How statements are labelled

- Unlabelled statements about files and symbols were read in the code.
- **Observed** means measured in a running build, with a date. It can drift.
- **Design constraint** means an intended rule that was recorded when the earlier design
  specs were approved and that the code still follows. Changing one is a product
  decision, not a refactor.
- Current behaviour with no such label is what the code does, not a confirmed design
  requirement.
- **Open** marks an unresolved question.

## Maintenance

- Every development task reviews the affected maps and updates changed responsibilities,
  entry points, symbols, connections, constraints and verification in the same change.
- Record a relationship once, in its natural home, and link to it from the other maps it
  affects.
- When files, headings or symbols move, update their references and remove obsolete
  entries. Use paths and symbol names, not line numbers.
- Add new areas to this index. Split a map when it forces readers through unrelated
  detail; merge or remove maps when responsibilities converge or disappear.
- Keep detailed reasoning in code comments, and task results in the PR. Planning and
  history do not belong here.
