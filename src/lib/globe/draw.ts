/**
 * The globe's canvas instructions. Nothing here computes a position.
 *
 * It receives rectangles already grouped by opacity bucket and issues one fill
 * per bucket. Canvas cannot vary opacity within a single fill, and setting it
 * per point would mean fifteen thousand draw calls a frame; bucketing brings
 * that down to twenty, ten per pass.
 */

import {
  BUCKET_COUNT,
  type GlobeFrame,
  type GlobeView,
  HIGHLIGHT_BUCKET_COUNT,
} from "@/lib/globe/projection";
import type { GlobeState } from "@/lib/globe/state";

/** The ocean pass is lifted slightly against the land pass. */
const OCEAN_OPACITY = 1.15;

/** Below this, a glow is not worth the cost of a blurred fill. */
const GLOW_FLOOR = 0.05;

/** Point bloom: shadow blur is this multiplied by the stronger glow. */
const BLOOM_BLUR = 12;

/** The processing halo, as multiples of the current radius. */
const HALO_INNER = 0.15;
const HALO_OUTER = 2.05;

/** How far out the halo stays solid, as a share of its span. */
const HALO_SOLID = 0.42;

const HALO_OPACITY = 0.4;

export interface GlobeColours {
  land: string;
  ocean: string;
  /** The white point the nearest points carry. See the highlight rule. */
  highlight: string;
}

/**
 * The colours as the halo needs them: the ocean colour again at zero alpha, for
 * the gradient's outer stop.
 *
 * Canvas interpolates gradient stops in unpremultiplied RGBA, so fading to
 * `transparent` — which is transparent *black* — drags the halo through grey on
 * its way out. Fading to the same colour at zero alpha does not.
 */
export interface PaintColours extends GlobeColours {
  oceanFade: string;
}

/**
 * Resolves the fade colour once, at creation, by letting the canvas normalise
 * the token for us rather than parsing CSS colours by hand.
 */
export function resolveColours(
  context: CanvasRenderingContext2D,
  colours: GlobeColours,
): PaintColours {
  const previous = context.fillStyle;
  context.fillStyle = colours.ocean;
  const normalised = context.fillStyle;
  context.fillStyle = previous;

  return { ...colours, oceanFade: fadeOut(normalised) };
}

/** Canvas serialises an opaque colour as `#rrggbb`, and any other as `rgba()`. */
function fadeOut(colour: string | CanvasGradient | CanvasPattern): string {
  if (typeof colour !== "string") return "transparent";
  if (/^#[0-9a-f]{6}$/i.test(colour)) return `${colour}00`;

  const channels = colour.match(/^rgba?\(([^)]*)\)$/);
  if (channels === null) return "transparent";

  const [red, green, blue] = channels[1].split(",");
  return `rgba(${red}, ${green}, ${blue}, 0)`;
}

export function paint(
  context: CanvasRenderingContext2D,
  frame: GlobeFrame,
  colours: PaintColours,
  view: GlobeView,
  state: GlobeState,
): void {
  context.clearRect(0, 0, view.width, view.height);

  paintHalo(context, colours, view, state);

  // Every pass blooms on the stronger of the two glows, each in its own colour.
  const bloom = Math.max(state.glow, state.dotGlow);
  paintPass(context, frame.land, colours.land, 1, bloom, BUCKET_COUNT);
  paintPass(
    context,
    frame.ocean,
    colours.ocean,
    OCEAN_OPACITY,
    bloom,
    BUCKET_COUNT,
  );
  // Last, so the cores sit on top of the points they belong to rather than
  // under whichever pass happens to be drawn after them.
  paintPass(
    context,
    frame.highlight,
    colours.highlight,
    1,
    bloom,
    HIGHLIGHT_BUCKET_COUNT,
  );
}

/** The processing halo: a wash of ocean colour behind the points. */
function paintHalo(
  context: CanvasRenderingContext2D,
  colours: PaintColours,
  view: GlobeView,
  state: GlobeState,
): void {
  if (state.glow <= GLOW_FLOOR) return;

  const radius = view.radius * state.contract;
  const gradient = context.createRadialGradient(
    view.centreX,
    view.centreY,
    radius * HALO_INNER,
    view.centreX,
    view.centreY,
    radius * HALO_OUTER,
  );

  gradient.addColorStop(0, colours.ocean);
  gradient.addColorStop(HALO_SOLID, colours.ocean);
  gradient.addColorStop(1, colours.oceanFade);

  context.globalAlpha = HALO_OPACITY * state.glow;
  context.fillStyle = gradient;
  context.fillRect(0, 0, view.width, view.height);
  context.globalAlpha = 1;
}

function paintPass(
  context: CanvasRenderingContext2D,
  buckets: number[][],
  colour: string,
  opacityScale: number,
  bloom: number,
  bucketCount: number,
): void {
  context.fillStyle = colour;

  if (bloom > GLOW_FLOOR) {
    context.shadowBlur = BLOOM_BLUR * bloom;
    context.shadowColor = colour;
  }

  for (let bucket = 0; bucket < buckets.length; bucket += 1) {
    const rectangles = buckets[bucket];
    if (rectangles.length === 0) continue;

    context.globalAlpha = Math.min(
      1,
      ((bucket + 0.5) / bucketCount) * opacityScale,
    );

    // One path for the whole bucket, filled once.
    context.beginPath();
    for (let at = 0; at < rectangles.length; at += 3) {
      const size = rectangles[at + 2];
      context.rect(rectangles[at], rectangles[at + 1], size, size);
    }
    context.fill();
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}
