/**
 * The globe's canvas instructions. Nothing here computes a position.
 *
 * It receives rectangles already grouped by opacity bucket and issues one fill
 * per bucket. Canvas cannot vary opacity within a single fill, and setting it
 * per point would mean fifteen thousand draw calls a frame; bucketing brings
 * that down to twenty, ten per pass.
 */

import { ENTRANCE_WHITE, FORMING_COLOUR_STEPS } from "@/lib/globe/entrance";
import {
  BUCKET_COUNT,
  type GlobeFrame,
  type GlobeView,
  HIGHLIGHT_BUCKET_COUNT,
} from "@/lib/globe/projection";
import type { GlobeState } from "@/lib/globe/state";

const TAU = Math.PI * 2;

/** The ocean pass is lifted slightly against the land pass. */
const OCEAN_OPACITY = 1.15;

export interface GlobeColours {
  land: string;
  ocean: string;
  /** The white point the nearest points carry. See the highlight rule. */
  highlight: string;
}

/** The colours as the painter needs them, resolved once at creation. */
export interface PaintColours extends GlobeColours {
  /**
   * The entrance's colour ramps: the starfield's cool white blended toward the
   * land green and toward the ocean blue, one entry per colour step.
   *
   * Resolved once at creation rather than per frame. A point mid-crossfade is
   * assigned the nearest step and drawn with the rest of that step in one fill,
   * for the same reason the opacity buckets exist.
   */
  formingLand: string[];
  formingOcean: string[];
}

/**
 * Resolves the entrance ramps once, at creation, by letting the canvas
 * normalise the tokens for us rather than parsing CSS colours by hand.
 */
export function resolveColours(
  context: CanvasRenderingContext2D,
  colours: GlobeColours,
): PaintColours {
  const previous = context.fillStyle;
  context.fillStyle = colours.ocean;
  const ocean = context.fillStyle;
  context.fillStyle = colours.land;
  const land = context.fillStyle;
  context.fillStyle = previous;

  return {
    ...colours,
    formingLand: colourRamp(land),
    formingOcean: colourRamp(ocean),
  };
}

/**
 * The white-to-class ramp, sampled at `FORMING_COLOUR_STEPS` points.
 *
 * Step 0 is the starfield's cool white exactly, which is what a point wears
 * until 55% of its settle; the last step is the class colour itself, which is
 * what it hands over to the normal point pass wearing.
 */
function colourRamp(colour: string | CanvasGradient | CanvasPattern): string[] {
  const target = toRgb(colour);
  const [red, green, blue] = ENTRANCE_WHITE;

  return Array.from({ length: FORMING_COLOUR_STEPS }, (_, step) => {
    const t = step / (FORMING_COLOUR_STEPS - 1);
    const mix = (from: number, to: number) =>
      Math.round(from + (to - from) * t);

    return `rgb(${mix(red, target[0])}, ${mix(green, target[1])}, ${mix(blue, target[2])})`;
  });
}

/** Parses what canvas normalised for us: `#rrggbb`, or `rgb()`/`rgba()`. */
function toRgb(colour: string | CanvasGradient | CanvasPattern): number[] {
  if (typeof colour === "string") {
    const hex = colour.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (hex !== null) {
      return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
    }

    const channels = colour.match(/^rgba?\(([^)]*)\)$/);
    if (channels !== null) {
      const parts = channels[1].split(",").map((part) => parseFloat(part));
      if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
    }
  }

  // Unreachable with the design tokens as they stand. White rather than black,
  // so a colour this cannot read degrades to the entrance's own start value
  // instead of putting a field of black dots on a black stage.
  return [...ENTRANCE_WHITE];
}

export function paint(
  context: CanvasRenderingContext2D,
  frame: GlobeFrame,
  colours: PaintColours,
  view: GlobeView,
  state: GlobeState,
): void {
  context.clearRect(0, 0, view.width, view.height);

  paintPass(context, frame.land, colours.land, 1, BUCKET_COUNT);
  paintPass(context, frame.ocean, colours.ocean, OCEAN_OPACITY, BUCKET_COUNT);
  // Last of the settled passes, so the cores sit on top of the points they
  // belong to rather than under whichever pass happens to be drawn after them.
  paintPass(
    context,
    frame.highlight,
    colours.highlight,
    1,
    HIGHLIGHT_BUCKET_COUNT,
  );

  // Nothing below here runs once the entrance is over, so a settled globe is
  // exactly the three passes above and costs what it did before the entrance
  // existed.
  if (!state.entranceRunning) return;

  paintCircles(context, frame.formingLand, colours.formingLand, 1);
  paintCircles(
    context,
    frame.formingOcean,
    colours.formingOcean,
    OCEAN_OPACITY,
  );
}

/**
 * The points that have not resolved yet: filled circles, one path per colour
 * step and opacity bucket.
 *
 * Circles rather than the squares a settled point is drawn as. A square has an
 * orientation and four corners, which is a lot of definition for something that
 * is meant to read as not yet in focus; a round dot has none. The square is the
 * shape a point earns by settling, and handing it over on the frame the point
 * stops moving is what makes resolving a change of state rather than a change
 * of shape.
 */
function paintCircles(
  context: CanvasRenderingContext2D,
  buckets: number[][],
  colours: readonly string[],
  opacityScale: number,
): void {
  for (let step = 0; step < FORMING_COLOUR_STEPS; step += 1) {
    context.fillStyle = colours[step];

    for (let bucket = 0; bucket < BUCKET_COUNT; bucket += 1) {
      const circles = buckets[step * BUCKET_COUNT + bucket];
      if (circles.length === 0) continue;

      context.globalAlpha = Math.min(
        1,
        ((bucket + 0.5) / BUCKET_COUNT) * opacityScale,
      );

      context.beginPath();
      for (let at = 0; at < circles.length; at += 3) {
        const radius = circles[at + 2];
        // Moved to the rim first: an arc with no `moveTo` before it joins the
        // previous subpath with a straight line, which on a bucket of a
        // thousand points is a thousand hairlines across the stage.
        context.moveTo(circles[at] + radius, circles[at + 1]);
        context.arc(circles[at], circles[at + 1], radius, 0, TAU);
      }
      context.fill();
    }
  }

  context.globalAlpha = 1;
}

function paintPass(
  context: CanvasRenderingContext2D,
  buckets: number[][],
  colour: string,
  opacityScale: number,
  bucketCount: number,
): void {
  context.fillStyle = colour;

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
}
