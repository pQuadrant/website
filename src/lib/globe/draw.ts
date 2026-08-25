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
} from "@/lib/globe/projection";

/** The ocean pass is lifted slightly against the land pass. */
const OCEAN_OPACITY = 1.15;

export interface GlobeColours {
  land: string;
  ocean: string;
}

export function paint(
  context: CanvasRenderingContext2D,
  frame: GlobeFrame,
  colours: GlobeColours,
  view: GlobeView,
): void {
  context.clearRect(0, 0, view.width, view.height);
  paintPass(context, frame.land, colours.land, 1);
  paintPass(context, frame.ocean, colours.ocean, OCEAN_OPACITY);
}

function paintPass(
  context: CanvasRenderingContext2D,
  buckets: number[][],
  colour: string,
  opacityScale: number,
): void {
  context.fillStyle = colour;

  for (let bucket = 0; bucket < buckets.length; bucket += 1) {
    const rectangles = buckets[bucket];
    if (rectangles.length === 0) continue;

    context.globalAlpha = Math.min(
      1,
      ((bucket + 0.5) / BUCKET_COUNT) * opacityScale,
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
