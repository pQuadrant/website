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

[pquadrant.com](https://pquadrant.com) is served from AWS, and the evidence below points
to AWS Amplify. What can be checked from outside AWS is verified; what requires access
to the relevant AWS configuration has not been inspected.

| Claim                                                                                                        | Status                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| The domain is registered at GoDaddy, with Route 53 (`awsdns`) nameservers                                    | Verified with WHOIS and DNS                                                                                                                          |
| `pquadrant.com` and `www` are served through CloudFront, with an Amazon-issued `*.pquadrant.com` certificate | Verified with DNS, the TLS certificate and response headers                                                                                          |
| An active Amplify webhook (`amplify-webhooks.eu-north-1.amazonaws.com`) receives the repository's pushes     | Verified with the GitHub API                                                                                                                         |
| The site is Amplify app `pquadrant-website` in `eu-north-1`, and Amplify manages the certificate             | **Unverified.** The webhook points to Amplify in that region, but the app name, its domain setup and who manages the certificate were not inspected  |
| Every merge to `main` triggers a production build, including documentation-only merges                       | **Unverified.** The build settings and branch triggers are not in this repository; confirming them requires access to the relevant AWS configuration |
| Pull-request previews                                                                                        | **Unverified.** Whether any are configured, and whether they work, is unknown                                                                        |

No staging environment is documented in this repository; whether one exists externally
has not been verified. Until previews are confirmed, a change is reviewed by running the
branch locally ([running the site](../docs/verification.md#running-the-site)).

**What merging means:** expect a merge to `main` to be published to pquadrant.com, but
treat the trigger as unconfirmed. If a change must not go live, do not merge it.
Confirming the Amplify settings requires access to the relevant AWS configuration.
