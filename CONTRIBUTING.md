# Contributing

How work moves from a ticket to production on this repository.

## The unit of work

One ticket → one branch → one pull request → one deploy.

If a ticket cannot be finished in a day, it is not a ticket yet. Split it.

A ticket is ready to be picked up when it contains:

1. **Why it exists** — one or two sentences of intent
2. **What is in scope**
3. **What is explicitly out of scope**
4. **Acceptance criteria** — observable statements, not vague goals

Good: "On mobile, the nav collapses into a menu button, and the menu closes
when a link is tapped."

Bad: "Make the nav responsive."

Write tickets this way because the ticket is also the prompt. A vague ticket
produces vague code, reliably.

## Definition of Ready

- The four items above are present
- Nobody has open questions about what is being asked
- It can be finished in a day

## Definition of Done

- Merged to `main`
- CI green
- Deployed
- Someone other than the author has confirmed the acceptance criteria on the
  preview URL

Work sitting unfinished on a branch is not progress.

## Branches

Branch off an up-to-date `main`:

```bash
git checkout main
git pull
git checkout -b feat/PQ-14-mobile-nav
```

Naming: `type/TICKET-ID-short-description`

| Prefix   | For                           |
| -------- | ----------------------------- |
| `feat/`  | New user-facing functionality |
| `fix/`   | Bug fixes                     |
| `chore/` | Tooling, config, dependencies |
| `docs/`  | Documentation                 |

## Commits

Conventional Commits format:

feat: add mobile navigation menu
fix: correct footer link spacing on small screens
chore: upgrade Tailwind to 4.1
docs: document the deployment setup

Lowercase after the colon, imperative mood, no full stop.

Commit often and in small pieces while working. Commits are your undo
points, and you will need them.

## Pull requests

Open the PR early, as a draft, before the work is finished. The preview URL
exists from that moment, and the team can see the direction while it is
still cheap to change.

**Open pull requests in the browser.** Push your branch, then go to the
repository on GitHub and click "Compare & pull request." The description box
will already contain a template with questions to answer — what changed, why,
and how to test it. Fill it in.

If you prefer the terminal, run `gh pr create` with no arguments. It opens
the same template in an editor. Passing `--body "..."` skips the template
entirely, so avoid that.

The template exists because the reviewer did not write your code and cannot
guess how to check it. "Fixed the nav" tells them nothing. "Open the preview,
narrow the window to phone width, tap the menu button, confirm the menu
closes when you tap a link" tells them exactly what to do.

**Size.** Aim for under 200 lines changed. Treat 400 as the ceiling. Above
that, explain why in the description before requesting review.

Deletions and generated files (lockfiles, scaffolds) do not count. What
counts is lines that contain a decision someone made.

**Review.**

- Nobody approves their own pull request
- Nobody approves a diff they have not read
- If a PR is too large to read properly, send it back rather than skimming it

**Merging.** Squash and merge. Delete the branch afterwards. `main` deploys
automatically.

There is no staging environment and no batching. Small changes go to
production one at a time. If something breaks, you know exactly what caused
it.

## Previewing your work

Three places to look at a change, cheapest first.

**Local, while building.** `npm run dev` serves on `localhost:3000` with
hot reload. Use this for anything you are still shaping.

**Local, as production.** `npm run build && npm start`. Dev mode and
production are not the same — static generation, caching, and metadata only
behave like production in a real build. Anything that depends on the
rendered HTML gets checked here, not in dev.

**The preview URL.** Every pull request gets one, rebuilt on each push. It
is the only place someone who is not you can confirm the acceptance
criteria, which the Definition of Done requires. This is why the PR is
opened as a draft early — the URL exists from that moment.

> **Note:** Pull request previews are not currently working. Amplify is
> configured for them but no preview is created. Likely cause is that the
> repository is public — Amplify appears to restrict previews for public
> repos. Resolving it probably means moving to GitHub Team so the repo can
> be private while keeping branch protection. Until then, reviewers should
> check out the branch and run `npm run dev` locally.

A shared staging environment is deliberately not one of these options, for
the reason above: it accumulates several unreleased changes at once, so
when it breaks, nobody knows whose change did it. Per-PR previews isolate
instead.

## Working with AI agents

Most code here is written with coding agents. These rules exist because the
failure modes are different from hand-written code.

**You own what the agent wrote.** The person who prompted it is accountable
for every line, exactly as if they had typed it. "The AI wrote that" is not
a review response.

**Plan before code.** Have the agent state what it intends to change before
it changes anything. Correct the plan, then let it implement. Reviewing a
short plan is something you will actually do properly. Reviewing 800
generated lines is something you will pretend to do.

**Two strikes, then revert.** If two attempts fail to fix a problem, stop.
Revert to the last good commit and re-approach. Never stack a third fix on
two failed ones. This single rule prevents most of the tangling that makes
AI-assisted codebases unmaintainable.

**Start a fresh session per ticket.** Long sessions fill the context window,
and as it fills, the agent follows `AGENTS.md` less reliably. A fresh
session is a quality control, not just tidiness.

**Fix the rules, not just the code.** If you correct the agent on the same
thing twice, that is a missing line in `AGENTS.md`. Add it.

## Before you push

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

CI runs these anyway. Running them locally saves a round trip.

## Secrets

Never commit API keys, passwords, or credentials. Not in a comment, not
temporarily, not "just to test."

Git history is permanent. A key committed and deleted an hour later is still
in the repository forever, and the only real fix is to revoke the key.

Real values belong in a local `.env` file (git-ignored), in GitHub Secrets
for CI, or in AWS Secrets Manager. Push protection is enabled on this
repository and will block the push — do not look for a way around it.

## Conventions

Code conventions — folder structure, naming, where content lives — are in
[AGENTS.md](../AGENTS.md). They apply to humans and agents equally.
