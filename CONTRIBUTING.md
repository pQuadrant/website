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
