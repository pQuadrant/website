# Delivery

Owns how a change gets from a branch to pquadrant.com: CI, the GitHub rules on `main`,
and publishing. The commands themselves, and how to run them locally, are in
[verification](../docs/verification.md#required-checks).

## CI

[.github/workflows/ci.yml](../.github/workflows/ci.yml), job `check`, runs on every pull
request and every push to `main`: `npm ci`, then `format:check`, `lint`, `typecheck` and
`build`, on Node 24. `npm ci` resolves from `package-lock.json` alone, so a lockfile that
disagrees with `package.json` fails here before any other step. The other steps run
against an installed tree and cannot see it; this is why the
[lockfile check](../docs/verification.md#dependencies-and-the-lockfile) exists locally.

CI does not run the site in a browser. Nothing in CI checks layout, motion, viewport or
input behaviour.

## GitHub rules

These settings live in GitHub, not in this repository, so they can change without a
commit. Check them with `gh api` when a task depends on them.

- Ruleset **main protection** (active) on `main`: changes arrive by pull request, 0
  approvals required, required status check `check`, no force-push, no deletion. Merge,
  squash and rebase are all allowed; past PRs were squash-merged.
- `deleteBranchOnMerge` is off, so task branches must be deleted after merging.
- The repository is **public**. Secret scanning and push protection are enabled.
- Pull request bodies use [.github/pull_request_template.md](../.github/pull_request_template.md).

## Publishing

Hosting is AWS Amplify, app `pquadrant-website`, region `eu-north-1`, serving
[pquadrant.com](https://pquadrant.com). DNS is a Route 53 hosted zone; the domain is
registered at GoDaddy with nameservers pointing to Route 53; the certificate is
Amplify-managed. These facts come from the previous README and were not independently
checked.

What is verified, and what is not:

| Claim                                                                                           | Status                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| An Amplify webhook (`amplify-webhooks.eu-north-1.amazonaws.com`) is installed on the repository | Verified with the GitHub API                                                                                                           |
| Every merge to `main` triggers a production build, including documentation-only merges          | **Unverified.** The build settings and branch triggers live in the Amplify console, not in this repository, and could not be inspected |
| Pull-request previews                                                                           | Unverified. The previous README said they were configured but not working                                                              |

There is no staging environment. Until previews are confirmed, a change is reviewed by
running the branch locally ([running the site](../docs/verification.md#running-the-site)).

**What merging means:** expect a merge to `main` to be published to pquadrant.com, but
treat the trigger as unconfirmed. If a change must not go live, do not merge it.
Confirming the Amplify settings needs access to the AWS console or CLI.
