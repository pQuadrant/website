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
- **Previews** — every pull request gets its own temporary URL, built from
  that branch
- **DNS** — Route 53 hosted zone for `pquadrant.com`. The domain is
  registered at GoDaddy but its nameservers point to Route 53.
- **SSL** — Amplify-managed certificate, renewed automatically

There is no staging environment. Pull request previews serve that purpose.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how work moves from ticket to
production, including branch naming, pull request expectations, and the
rules for AI-assisted changes.

## License

Source-available, all rights reserved. See [LICENSE](LICENSE).
