# Working on the website

## Product context

pQuadrant builds AI systems that help people and businesses carry out work. These
systems include automations, agents, and Artificial Employees (AEs).

The platform, a separate repository, gives customers a shared environment to access
these systems, connect them to their tools and information, and oversee their activity
and results. This repository is the public website at pquadrant.com. It presents
pQuadrant and its offerings and helps visitors discover and evaluate AI systems.

Use this context to understand the purpose of the product. Determine implementation
scope from the current task and verify existing capabilities against the codebase.

## Codebase navigation

Start with [codebase-map/README.md](codebase-map/README.md). It indexes focused maps
describing current responsibilities, implementation locations, behavioural
relationships and confirmed design constraints.

- Read the index and the maps relevant to the task. Follow targeted section links when
  their context is needed, then return to the task. Do not recursively load every
  connected document.
- Inspect referenced implementations, callers and dependencies before deciding what to
  change. On this site many connections are not imports: shared CSS custom properties,
  data attributes measured by other layers, timings kept in step by hand, and a shared
  animation clock.
- Treat maps as navigation aids. Verify relevant claims against code and configuration;
  investigate missing or conflicting information rather than assuming a map is
  exhaustive. Current behaviour is not design intent unless a map labels it a design
  constraint.
- Keep exploration focused; expand it when dependencies or uncertainty justify it.
  Exclude `node_modules/` and `.next/` from searches.
- Find commands and procedures in [docs/verification.md](docs/verification.md). Follow
  the code conventions in [docs/conventions.md](docs/conventions.md).

## From idea to approved plan

The user is a nontechnical product owner. Accept informal ideas and brainstorms; do not
require technically complete specifications. Distinguish exploration from an
implementation request. Brainstorming is not approval to change code.

Before proposing implementation, inspect relevant code and assess distinct outcomes,
affected areas, shared behaviour, uncertainty, dependencies, and consequences of
failure. Judge scope by behaviour and risk, not apparent code size.

- **Small, clear change:** briefly explain the change and verification; no separate
  planning document is needed.
- **Substantial feature:** investigate connections, clarify material questions, and
  prepare a focused plan.
- **Multiple outcomes or a large initiative:** propose smaller tickets with clear
  outcomes, completion criteria, and explicit dependencies. Prefer independently
  verifiable increments. Agree on the breakdown and the next ticket before
  implementation.

Avoid unnecessary tickets or planning documents. Do not assume separate tickets are
independent. When a ticket states a value and what that value produces, re-derive the
consequence; if the two disagree, say so rather than silently implementing one.

Present a concise plan covering:

1. What the visitor or user will be able to do after the change.
2. Where the work belongs and the main behaviour being added or changed.
3. Existing behaviour being reused and connected areas affected.
4. Significant choices or trade-offs, with a recommendation.
5. How completion will be verified.

Obtain approval of the implementation plan before editing project files, including for
small changes. Read-only investigation may proceed beforehand. Within an approved plan,
resolve routine engineering details autonomously. If discoveries materially change
scope, expected behaviour, or significant trade-offs, explain and obtain approval for
the revised plan. Do not repeatedly request approval for work already authorized.

## Change impact

For every change:

1. **Investigate before planning.** Identify the affected code and the user-experience
   relationships around it, using the maps and then the code.
2. **Consider indirect effects** beyond the edited files: layout, timing, layering,
   visibility, focus, responsive and input behaviour, and anything that measures or
   reads what you change.
3. **Verify the combined behaviour**, not only the edited component in isolation.
4. **Update the affected maps and relationships** before requesting final approval.

## Communication

Think thoroughly; communicate selectively. The user should focus on product decisions
while the agent owns routine engineering, organization, and repository housekeeping.

- Use plain language without assuming programming knowledge or familiarity with
  frameworks, repository conventions, or previous sessions. Explain unfamiliar concepts
  when needed; avoid the curse of knowledge.
- Lead with the useful answer or recommendation. Keep explanations brief, readable, and
  organized.
- Explain code responsibilities through their purpose. Use file paths as references so
  the user can understand what was built, where it lives, and why significant decisions
  were made. Do not present an inventory of every function or edit.
- Ask focused questions only when their answers materially affect the outcome.
  Investigate technical questions independently where possible.
- For complex topics, present one coherent decision at a time and offer deeper
  explanation as needed.
- Distinguish verified facts, assumptions, proposals, and unresolved questions. Never
  claim to have inspected or tested something without evidence.
- Write project documentation for a newcomer, without references to the planning
  conversation. Do not turn tentative ideas or illustrative examples into requirements.

## Engineering and code organization

Own the technical quality of the implementation. Translate product intent into
maintainable code without requiring the user to direct routine engineering decisions.

### Complete vertical slices

Organize implementation around usable, verifiable outcomes. Include the interface,
content, styling, responsive and input behaviour, motion and reduced-motion behaviour,
and failure handling needed for the approved outcome. Keep each responsibility in its
appropriate module. When foundational work must come first, make that dependency
explicit. Avoid speculative infrastructure for unapproved future features.

### Clear responsibilities

- Give each module a coherent purpose and clear interface. Follow established
  boundaries; propose changes when they no longer fit the work.
- Use descriptive, consistent names. Keep related behaviour together and avoid
  catch-all files or folders accumulating unrelated responsibilities.
- Explain non-obvious decisions and important constraints close to the code. Comments
  should clarify purpose and reasoning without repeating obvious code.

### Thoughtful reuse and safe changes

- Search for existing implementations before adding new ones.
- When features share the same underlying rules, maintain those rules in one
  appropriate place and keep feature-specific behaviour separate. Similar-looking code
  alone is not a reason to force a shared abstraction.
- Before changing shared behaviour, identify its consumers and contracts. Preserve
  existing expectations unless their change is explicitly in scope. Update affected
  consumers together; avoid competing implementations of the same responsibility.
- Choose the simplest design that satisfies the approved requirements and fits the
  architecture. Consider performance proportionately; this page runs continuous canvas
  animation and must cost nothing at rest where the maps say so.
- Include restructuring necessary for a sound implementation. Raise broader cleanup
  separately when it materially expands scope.

### Production readiness

The agent owns implementation readiness and technical housekeeping. Before presenting a
feature as complete, review temporary scaffolding, experimental placement, obsolete
code, and integration gaps. Complete necessary cleanup within the approved scope. If
resolving an issue materially expands scope, explain it and obtain approval before
declaring the feature complete.

Do not depend on the product owner to request that working features be moved out of
experimental structures. Visual or product approval is not proof that engineering
cleanup is complete.

## Public repository and published data

This repository is public and its `main` branch is published as the website.

- Never commit credentials, keys or tokens, not even temporarily. Git history is
  permanent; a leaked key must be revoked. Real values belong in an untracked `.env`
  file, GitHub Secrets, or AWS Secrets Manager. Push protection is enabled; do not work
  around it.
- Do not assume information is safe to publish because the website needs it. Before
  planning any data the site will receive from the platform or another service, define
  the public-data boundary explicitly: what may be shown, to whom, and who decides. See
  [marketplace copy and platform data](codebase-map/content.md#marketplace-copy-and-platform-data).

## Sub-agents

When available, use sub-agents for focused investigation, implementation, or
independent review when that improves the work. Do not create a fixed delegation
ceremony for every task.

Give each sub-agent a clear objective, relevant context and map references, scope, and
expected result. Coordinate editing responsibilities to avoid conflicting changes. The
main agent remains responsible for reconciling findings, checking evidence, and
delivering a coherent result. Delegation does not expand the approved scope or bypass
approval requirements.

## Verification and review

- Verify the approved behaviour and relevant failure cases. When shared code changes,
  check affected existing consumers.
- Run the [required checks](docs/verification.md#required-checks). Propose tests where
  they would meaningfully protect behaviour, with effort proportionate to risk.
- **For interactive or visual changes, verify intermediate states and transitions, not
  only final screenshots.** Consider interrupted actions, repeated navigation, reverse
  transitions, and the relevant viewport and input variations. See
  [interactive and visual states](docs/verification.md#interactive-and-visual-states).
  Use browser inspection when available, and report honestly what remains unverified.
- Measure tonal criteria rather than judging them by eye
  ([measuring tone and contrast](docs/verification.md#measuring-tone-and-contrast)).
- When attempts stop producing new evidence, reassess the cause and the approach rather
  than stacking speculative fixes.
- Review the diff for correctness, unnecessary complexity, duplication, unrelated
  edits, and documentation impact. Use independent review when warranted.
- Distinguish static checks, runtime checks in a local build, and behaviour on the live
  site. Report failed or blocked checks accurately; do not present unexecuted checks as
  passing.
- Once verification is sufficient and required checks pass, avoid unrelated or
  repetitive checks without a concrete reason.

## Required map maintenance

Map maintenance is part of implementation, not optional follow-up work.

Before declaring any development task complete or requesting final approval, review
its diff against the affected maps. Update them in the same branch whenever changes
affect:

- Responsibilities or implementation status.
- Files, entry points, or referenced symbols.
- Dependencies, consumers, interfaces, or behavioural relationships.
- Important constraints, configuration, or verification instructions.

Update affected cross-references, remove obsolete information, and check that links and
descriptions remain accurate. Correct inaccuracies discovered in the areas being
changed. Update [docs/conventions.md](docs/conventions.md) or
[docs/verification.md](docs/verification.md) when a convention or procedure changes,
keeping each fact in one authoritative location.

In the final handoff, identify updated maps. If none needed updating, briefly explain
why mapped information remained accurate; do not make artificial edits merely to show
activity. **A change is not complete while it leaves the relevant maps inaccurate.**

### Grow the map with the site

The current maps are not a fixed set:

- Extend an existing map when new behaviour belongs to its responsibility.
- Add a focused map when a distinct responsibility needs its own navigation context.
- Split a map when independently useful topics otherwise force readers to load
  unrelated detail.
- Merge or remove maps when responsibilities converge or disappear.

Update the index and affected references whenever maps change structure. Use targeted
heading links explaining when and why to read the referenced section. Reference file
paths and symbols rather than line numbers. Keep maps focused on current structure and
change impact; keep planning and historical task reports out of them.

## Git and delivery workflow

Own this sequence without requiring the user to request each routine step:

1. **Inspect the checkout.** Check the branch and working-tree state. Preserve existing
   work; never discard, overwrite, or include unrelated changes. If the checkout is not
   ready for a new task, resolve it safely. Ask only when ownership or intent is
   unclear. Continue an existing task on its task branch.
2. **Plan, then branch.** After plan approval, create a task branch from up-to-date
   `main`, named `type/short-description` (with the ticket ID after the type when there
   is one). Types: `feat`, `fix`, `perf`, `chore`, `docs`. Recheck the plan if upstream
   changes affect it.
3. **Complete the work.** Implement the approved scope, verify it, review the diff, and
   update maps and affected documentation. Make focused commits in Conventional
   Commits form (`fix: correct footer spacing on small screens`: lowercase after the
   colon, imperative, no full stop) explaining the change and its purpose. Reference
   the ClickUp task, when there is one, at the end of the body (`Closes CU-<id>`).
4. **Request final approval.** Briefly explain what changed, where it lives,
   significant decisions, verification results, map updates, and unresolved
   limitations. Explain what merging will publish, as the
   [delivery map](codebase-map/delivery.md#publishing) records it. Request approval to
   create the PR and merge the reviewed result.
5. **Create and merge the PR.** After approval, push and create a PR whose body follows
   [the PR template](.github/pull_request_template.md). Squash-merge once the required
   `check` passes; do not bypass it. If substantive fixes become necessary, verify them
   and renew final approval for the changed result.
6. **Clean up.** Confirm the merge, delete the remote branch (GitHub does not do it
   automatically here), return to `main`, update it from the remote, and remove the
   local task branch. Confirm cleanup without disturbing unrelated work.

Final approval authorizes the PR, merge, and branch cleanup as one sequence. Do not
request separate permission for each routine step. Report blockers accurately and
distinguish implemented, verified, merged, and published states.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
