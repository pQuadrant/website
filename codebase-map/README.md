# Codebase map

Choose the area that matches the change, open its relevant section and the linked
implementation, and verify against the code. Cross-references are detours: read the
named section, then return to the task. Follow further links only when the change needs
them.

The site is one persistent stage serving two routes, `/` and `/marketplace`, plus a
plain reading page, `/privacy`, outside it. Most
connections here are behavioural rather than imports: shared CSS properties, a shared
clock, matching timings, and elements measured by other layers.

## Areas

| Map                                 | Responsibility                                                                                           | Read when changing                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Stage](stage.md#stage)             | Document shell, layers, vertical centre, corner chrome, tokens and breakpoints, entrance, reduced motion | `globals.css` tokens or margins, `Stage`, `layout.tsx`, chrome controls, [the centre](stage.md#stage-centre), [entrance timing](stage.md#page-entrance-timeline), [reduced motion](stage.md#reduced-motion)          |
| [Routes](routes.md#routes)          | Home and marketplace: mode, route content, globe move, fades, gestures, focus                            | `StageShell`, `src/components/home/` or `marketplace/`, `src/app/(stage)/`, `src/lib/stage/mode.ts`, [transition timing](routes.md#route-transition-timing), [gestures](routes.md#navigation-and-gestures), `--mk-*` |
| [Globe](globe.md#globe)             | Globe component and engine, size rule, point generator                                                   | `src/lib/globe/`, `Globe`, [anything that affects the globe's size](globe.md#motif-radius)                                                                                                                           |
| [Starfield](starfield.md#starfield) | Star canvases, field, ambient light, text clearance, pointer drag                                        | `src/lib/starfield/`, `Starfield`, [adding text to the page](starfield.md#text-clearance)                                                                                                                            |
| [Apply flow](apply.md#apply-flow)   | APPLY NOW, its panel, the application form and the screen after it                                       | `src/components/apply/`, `src/lib/apply/`, `src/content/apply.ts`, anything in the top-right corner                                                                                                                  |
| [Content](content.md#content)       | Where copy lives and what wording changes affect; intended platform data                                 | `src/content/`, metadata, [any copy change](content.md#wording-effects), [marketplace data](content.md#marketplace-copy-and-platform-data)                                                                           |
| [Delivery](delivery.md#delivery)    | CI, GitHub rules, Amplify publishing                                                                     | Workflows, merge or deploy questions, [what merging publishes](delivery.md#publishing)                                                                                                                               |

Working rules are in [AGENTS.md](../AGENTS.md). Code conventions are in
[docs/conventions.md](../docs/conventions.md). Commands and verification procedures are
in [docs/verification.md](../docs/verification.md).

## How statements are labelled

Unlabelled statements describe what the code and configuration do. That is current
behaviour, not proof of design intent. Labels are used only where they settle
uncertainty:

- **Design constraint:** an intentional requirement with current evidence, normally a
  comment beside the implementation that states the rule and its reason. Changing one
  is a product decision, not a refactor.
- **Not confirmed:** a rule the code follows that nothing current confirms as
  intentional. Ask before relying on it or changing it.
- **Open:** an unresolved question. **Unverified:** a claim about a system outside this
  repository that has not been checked.

Measurements and the results of a task's verification belong in its pull request, not
here.

## Maintenance

- Every development task reviews the affected maps and updates changed responsibilities,
  entry points, symbols, connections, constraints and verification in the same change.
- Record a relationship once, in its natural home, and link to it from the other maps it
  affects.
- When files, headings or symbols move, update their references and remove obsolete
  entries. Use paths and symbol names, not line numbers.
- Add new areas to this index. Split a map when it forces readers through unrelated
  detail; merge or remove maps when responsibilities converge or disappear.
- Keep detailed reasoning in code comments, and measurements and task results in the
  PR. Planning and history do not belong here.
- Track confirmed defects as GitHub issues and link them from the section they affect.
