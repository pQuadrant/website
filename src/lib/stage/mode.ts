/**
 * Which route the persistent stage is showing. See Route structure in
 * `codebase-map/routes.md`.
 *
 * The stage is mounted once for both routes, so nothing remounts on
 * navigation: every route-dependent layer takes the mode and styles on
 * `data-mode` instead.
 */

/** The two arrangements the stage has, one per route. */
export type StageMode = "home" | "market";

/** The mode for a pathname: the marketplace and anything under it, else home. */
export function stageModeFor(pathname: string): StageMode {
  return pathname.startsWith("/marketplace") ? "market" : "home";
}
