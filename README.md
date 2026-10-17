# pQuadrant website

The public website at [pquadrant.com](https://pquadrant.com). It presents pQuadrant and
its AI systems (automations, agents and Artificial Employees) and helps visitors
discover and evaluate them. Customers use the separate pQuadrant platform at
[app.pquadrant.com](https://app.pquadrant.com).

The site is a full-window stage: a rotating point-cloud globe and a starfield drawn on
canvases, with a home view (`/`) and a marketplace view (`/marketplace`) that share it.

Built with Next.js 16 (App Router), TypeScript and Tailwind 4.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Where to look

- [codebase-map/](codebase-map/README.md): what lives where and how the parts affect
  each other.
- [docs/conventions.md](docs/conventions.md): code conventions.
- [docs/verification.md](docs/verification.md): commands and how to verify a change.
- [AGENTS.md](AGENTS.md): working rules for coding agents.
- [Delivery](codebase-map/delivery.md#delivery): CI, GitHub rules and how the site is
  published.

## License

Source-available, all rights reserved. See [LICENSE](LICENSE).
