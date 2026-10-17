# Verification

The commands this repository runs and how to verify a change. This file is the single
source for both; other documents link here. How CI and publishing use these is in the
[delivery map](../codebase-map/delivery.md#delivery).

## Required checks

Run from the repository root before requesting final approval:

```bash
npm run format      # prettier --write .
npm run lint        # eslint
npm run typecheck   # next typegen && tsc --noEmit
npm run build       # next build
```

CI runs `npm ci` and then the same checks, with `format:check` in place of `format`.
When a change adds, removes or upgrades a dependency, also run `npm ci --dry-run`; see
below.

These checks cannot see layout, motion, viewport or input behaviour. A page can overlap
itself on a phone while every one of them passes.

## Dependencies and the lockfile

CI installs from `package-lock.json` alone and fails at the install step if it disagrees
with `package.json`. Local checks run against the installed `node_modules`, where nothing
is missing, so only `npm ci --dry-run` catches this before CI does.

Installing on top of an existing `node_modules` can silently drop transitive
dependencies of optional packages that do not install on this platform. A change that
adds a dependency should only **add** lines to `package-lock.json`. If
`git diff main -- package-lock.json` shows packages removed, or `npm install` reports
removing packages you did not ask to remove, resolve from scratch instead of patching:

```bash
rm -rf node_modules package-lock.json && npm install
```

## Tests

No test framework is installed. Adding one is a dependency decision; propose it when a
change introduces logic that a unit test would meaningfully protect (for example a
content helper, form validation, or a pure function such as `motifRadius` or
`routeEase` when it changes). Until then, verification is the checks above plus runtime
inspection.

## Running the site

```bash
npm run dev                       # localhost:3000, hot reload
npm run build && npm start        # production build; use for metadata, static output and anything timing-sensitive
npm run generate:globe            # regenerate the globe point set (see the globe map)
```

Development mode differs from production in static generation, caching and metadata,
and it runs effects twice on fast refresh. Measure in a production build.

## Browser inspection

Use the browser tools when they connect. The Chrome extension has not connected in this
repository before; when it does not, drive headless Chrome over the DevTools Protocol
from a Node script:

- Launch Chrome with `--headless=new --remote-debugging-port=<port>` and a temporary
  `--user-data-dir`. Read the page target from `http://127.0.0.1:<port>/json/list` and
  connect with Node's global `WebSocket`.
- Set the viewport with `Emulation.setDeviceMetricsOverride`, not `--window-size` (which
  reserves space for browser UI and gives a shorter viewport than requested).
- Coarse pointer: `mobile: true` in the metrics override and
  `Emulation.setTouchEmulationEnabled`. Reduced motion and hover:
  `Emulation.setEmulatedMedia` with `prefers-reduced-motion`, `hover` and `pointer`.
  Touch gestures: `Input.dispatchTouchEvent`.
- **Assert the page rendered before trusting a number.** A dev server's error overlay
  screenshots happily and returns plausible figures. Check for something that only
  exists when the page works, such as `main canvas`, and fail loudly without it.
- **Identical results across different inputs mean a broken harness**, not a finding.
- **The shell is zsh, which does not word-split unquoted variables.** Drive parameter
  sweeps from Node or Python with explicit arguments, never from shell loops. A zsh loop
  has previously written a malformed constant into source and produced a sweep of
  identical error pages.
- Keep harness scripts outside the repository.

## Window sizes

Check layout changes at these viewport sizes, with a fine pointer and with a coarse one:

| Size        | Why                                                                |
| ----------- | ------------------------------------------------------------------ |
| 320 × 568   | Narrowest supported window                                         |
| 360 × 640   | Small Android                                                      |
| 390 × 844   | Common iPhone                                                      |
| 430 × 932   | Large iPhone                                                       |
| 768 × 1024  | Tablet portrait, roomy layout                                      |
| 667 × 375   | iPhone SE on its side                                              |
| 844 × 390   | Phone on its side                                                  |
| 852 × 312   | iPhone 15 Pro on its side with Safari's bars, measured on a device |
| 896 × 414   | Phone on its side                                                  |
| 932 × 430   | Large phone on its side, toolbar hidden                            |
| 932 × 330   | The same phone with Safari's toolbar showing                       |
| 1060 × 480  | Tallest phone on its side; just under the 500px height switch      |
| 1133 × 744  | iPad mini on its side; must take the roomy layout                  |
| 1100 × 650  | Just at the widest margin tier                                     |
| 1440 × 900  | The size the design was composed at                                |
| 1512 × 855  | 14-inch MacBook Pro                                                |
| 1920 × 1080 | Common monitor                                                     |
| 2560 × 1440 | Globe cap and chrome scale ceiling                                 |

The layout switches at 640px wide, 500px tall and 1100px wide, and the top-right
controls tighten below 380px wide. For a change near one of
those, also check a pixel either side. A phone's landscape viewport is shorter than its
screen while the browser toolbar shows; check both states, and do not rely on an
emulator to reproduce the toolbar.

At each size, check that nothing overlaps, nothing touches the globe that should clear
it, and every string the layout is meant to show is on screen.

## Interactive and visual states

Final screenshots are not enough for changes that move, fade or respond. Cover whatever
applies:

- **Entrance:** a hard reload, sampled across the first 1.5 seconds, not only the
  settled page.
- **Route changes:** home → marketplace and back, sampled during the 800ms move; a
  reversal part way; several round trips in a row; a deep link to `/marketplace`;
  browser Back and Forward; Esc.
- **Gestures:** swipe up on home and pull down in the catalogue, each short of and past
  its threshold, and a pull that starts while the catalogue is scrolled.
- **Input:** fine and coarse pointers; hover and tap (`active`) states; keyboard focus
  order and the focus ring; off-route content not focusable.
- **Reduced motion:** on at load, and toggled in both directions while the page is open.
- **Resize:** during the entrance and during a route move.
- **Idle:** once settled, the star field and ambient light draw nothing, while the globe
  keeps animating (it stops only under reduced motion). Count draws per canvas rather
  than frames for the whole page.

To compare pixels, first control time and randomness: the globe rotates continuously
and the entrance runs on the page clock. Either control animation time (for example
the DevTools `Animation` domain or virtual time), compare only deterministic layers
(the star field at rest is seeded), or compare measured values with tolerances: element
boxes, computed styles, opacity over time, hit tests. Hiding a layer to isolate another
is a diagnostic, not a substitute for checking the full composition.

Report what was verified at runtime separately from static checks, and say plainly what
was not verified.

## Measuring tone and contrast

Contrast, black point, glow visibility and gradient smoothness cannot be judged from a
screenshot by eye; that has produced confidently wrong answers here. Measure:

- Screenshot the page and draw the PNG into a canvas **inside the page** to read pixels;
  the background layers are CSS and canvas, so there is nothing else to sample.
- Luminance is `0.2126R + 0.7152G + 0.0722B` over raw sRGB values.
- To read the background behind something, hide it and screenshot again.
- For a gradient or glow, sample a radial profile and look for slope breaks, not steps.
