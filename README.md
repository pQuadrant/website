# pQuadrant website

The sign-in entry point for the pQuadrant platform. It is a single
full-screen page: a rotating point-cloud globe drawn on a canvas, with a
sign-in panel over it. There are no other pages, no navigation, and no
scrolling content — a visitor either signs in to the platform or they do
not.

Built with Next.js 16 (App Router), TypeScript, and Tailwind 4.

Folders under `src/` are created as they are first needed, so some may not
exist yet. Conventions for what belongs where are in [AGENTS.md](AGENTS.md).

Imports use the `@/` alias for `src/`:

```ts
import { Button } from "@/components/ui/Button";
```

## Deployment

Hosting is AWS Amplify, in the `eu-north-1` (Stockholm) region. The app is
named `pquadrant-website`.

- **Production** — `main` deploys automatically on merge to
  [pquadrant.com](https://pquadrant.com)
- **Previews** — configured to build a URL per pull request, but not
  currently working; see
  [CONTRIBUTING.md](CONTRIBUTING.md#previewing-your-work)
- **DNS** — Route 53 hosted zone for `pquadrant.com`. The domain is
  registered at GoDaddy but its nameservers point to Route 53.
- **SSL** — Amplify-managed certificate, renewed automatically

There is no staging environment. Pull request previews are meant to serve
that purpose; until they work, a change is verified by running the branch
locally.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how work moves from ticket to
production, including branch naming, pull request expectations, and the
rules for AI-assisted changes.

## License

Source-available, all rights reserved. See [LICENSE](LICENSE).
