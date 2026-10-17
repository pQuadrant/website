/**
 * Star placement and appearance for the starfield layer, mapped under Field
 * generation in `codebase-map/starfield.md`.
 *
 * This module is the single definition of where a star sits and how bright it
 * is. It touches no canvas and no DOM: it is handed the
 * stage's dimensions and, for each route, where the globe sits and the boxes the
 * type occupies, and returns an array. `draw.ts`
 * turns that array into fills.
 *
 * Every tunable number lives in `STARFIELD` below.
 */

import { mulberry32 } from "@/lib/random";
import type { StageMode } from "@/lib/stage/mode";

/** A single star, in CSS pixels, positioned relative to the stage's top left. */
export interface Star {
  /**
   * Where the star is now.
   *
   * As generated that is also where it belongs, and it stays there unless the
   * pointer response is dragging the field around — that module holds the home
   * positions and moves these, and is the only thing that writes to them.
   */
  x: number;
  y: number;
  /**
   * Magnitude, 0 to 1. Every other value on this star derives from it.
   *
   * Power-distributed, so the field is overwhelmingly faint: around 44% of
   * stars fall below 0.1 and only 8% rise above 0.8. The lopsidedness is the
   * point. An even spread of sizes reads as speckle, because a real field is
   * mostly points you can barely see.
   */
  magnitude: number;
  /** Core radius. A hard-edged filled circle: no gradient, no soft edge. */
  coreRadius: number;
  coreAlpha: number;
  /** The core's colour, blended toward white with magnitude. */
  coreColour: readonly [number, number, number];
  /** Outer halo radius, or null for the ~92% of stars that have none. */
  haloRadius: number | null;
  haloAlpha: number;
  /** The star's own colour, undesaturated. The tint lives out here. */
  haloColour: readonly [number, number, number];
  /**
   * Which routes the star is part of the sky on.
   *
   * Most stars are on both and never change. The rest fill the ground one
   * route's globe or type leaves and the other's does not, and fade in or out
   * as the route changes — see Field generation in `codebase-map/starfield.md`.
   */
  home: boolean;
  market: boolean;
}

export const STARFIELD = {
  /**
   * `count = round(stageWidth x stageHeight / divisor)`, clamped.
   *
   * This is a count of stars that survive the falloff, not of candidates
   * offered to it. The difference is the whole point of the formula: the region
   * the falloff discards scales with the motif radius rather than with the
   * stage, so counting candidates would make the surviving density depend on
   * the window's shape — a third of the candidates survive on a 768 x 1024
   * window against three quarters on a 2560 x 1440 one. Counting survivors is
   * what actually holds the density steady across window sizes.
   *
   * The clamp is why a large monitor is slightly sparser per square pixel than
   * a laptop, which is correct: the viewer is usually further from it.
   */
  countDivisor: 3000,
  countMin: 220,
  countMax: 900,

  /**
   * Ceiling on candidates drawn per star kept, so a pathological window cannot
   * spin the generator forever.
   *
   * The worst real case is a stage almost entirely covered by the falloff,
   * which still keeps better than one candidate in four. Twelve is far above
   * anything a supported window produces and exists only as a stop.
   */
  maxCandidatesPerStar: 12,

  /**
   * Radial density falloff, as multiples of the motif radius. Nothing survives
   * inside `falloffInner`; everything survives beyond `falloffOuter`; between
   * them the keep probability is a smoothstep.
   *
   * The globe is a transparent point cloud rather than a solid object, so stars
   * drawn behind it would mix with its own points and read as noise inside the
   * sphere.
   */
  falloffInner: 1.0,
  falloffOuter: 1.7,

  /**
   * Text clearance, in CSS pixels from the edge of a box of type. Nothing
   * survives within `textClearInner`; everything survives beyond
   * `textClearOuter`; between them the keep probability is a smoothstep, for
   * the same reason as the radial falloff — a hard edge would leave a visible
   * rectangular hole around every line.
   *
   * The inner distance is set by the largest glow, not by the core. A bloom
   * reaches `bloomScale` times the largest core radius, about 20px, and a bloom
   * that clears the type with its core and not with its glow still lays a haze
   * over the letters.
   */
  textClearInner: 24,
  textClearOuter: 48,

  /**
   * `magnitude = uniform ** exponent`. Raise it for a fainter field, lower it
   * for a more evenly speckled one.
   */
  magnitudeExponent: 2.8,

  /** Core radius runs from `radiusFloor` to `radiusFloor + radiusRange`. */
  radiusFloor: 0.35,
  radiusRange: 1.35,

  /** Core alpha: `alphaFloor + magnitude ** alphaExponent * alphaRange`. */
  alphaFloor: 0.3,
  alphaExponent: 0.55,
  alphaRange: 0.7,

  /**
   * Never draw a circle smaller than this.
   *
   * Anti-aliasing turns a sub-pixel circle into a smudge, which is the exact
   * artefact this model exists to remove. Below the floor the radius is held
   * here and the shortfall is paid in alpha instead: brightness carries what
   * size cannot, and the star stays a sharp point rather than a soft grey
   * smear. Faint does not mean blurry.
   */
  radiusMin: 0.5,

  /**
   * Magnitude above which a star gets a halo at all.
   *
   * The most important number in this file. Roughly 92% of the field is a bare
   * core with no glow whatsoever, and that is what stops the field reading as a
   * scattering of grey discs.
   */
  haloThreshold: 0.8,

  /** Halo radius is `coreRadius x (haloScaleFloor + magnitude x haloScaleRange)`. */
  haloScaleFloor: 4,
  haloScaleRange: 5,

  /**
   * Halo peak alpha is the magnitude's share of the way past the threshold,
   * times this.
   *
   * It starts at zero exactly on the threshold, so halos fade in rather than
   * switching on. There is no magnitude at which a star visibly acquires a
   * glow, which is why the glowing and bare populations do not read as two
   * populations.
   */
  haloAlphaScale: 0.16,

  /**
   * The few stars that carry the field's sense of depth. There should be a
   * handful on screen, not a scattering.
   */
  bloomThreshold: 0.96,
  bloomScale: 12,
  bloomAlpha: 0.2,

  /**
   * Cores blend toward white by `magnitude ** this`.
   *
   * How a bright point actually renders: the centre saturates and goes
   * white-hot while its colour survives in the glow around it. Faint stars keep
   * their full colour, and they are the ones carrying the palette.
   */
  desaturationExponent: 2,

  colours: {
    /** Cool white. The default star. */
    white: [226, 234, 246],
    /** Relates to the auth bloom blue `#3183F5`. */
    blue: [120, 168, 240],
    /**
     * The odd one out, and the only warm colour anywhere on the page, which is
     * why it is held to a small share. Under review.
     */
    amber: [240, 196, 148],
  },

  /** Colour shares across the whole field. Must total 1. */
  colourShares: {
    white: 0.78,
    blue: 0.14,
    amber: 0.08,
  },

  /**
   * Fixed seed. The field must be identical across reloads so a reviewer can
   * compare a screenshot against the design, and identical across resizes at
   * the same size so watching a window being dragged does not scatter a
   * completely different sky on every frame.
   */
  seed: 0x9e3779b9,
} as const;

/**
 * A box of type the field keeps clear of, in the same coordinates as the stars:
 * CSS pixels from the stage's top left.
 */
export interface ClearRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * What one route's sky keeps clear of: its globe, as a centre and the motif
 * radius it is drawn at there, and its type.
 */
export interface FieldLayout {
  centreX: number;
  centreY: number;
  radius: number;
  clear: readonly ClearRect[];
}

/** Pure white: what a bright core desaturates toward. */
const WHITE_POINT = 255;

/**
 * Builds the field, for both routes at once.
 *
 * Pure: same arguments in, same array out, every time. Each layout's `radius`
 * is the motif radius as `motifRadius` computes it, or the small globe's in the
 * marketplace, which the caller passes in rather than this module deriving a
 * second copy of it. `clear` is that route's type, which the caller measures;
 * see `text-clearance.ts`.
 *
 * One stream of candidates serves both routes, and each candidate is judged
 * against both with the same draw. A star where both routes have open sky is
 * therefore in both, at the same place — which is most of the field, and is why
 * changing route moves nothing that does not have to move.
 */
export function createStarfield(
  width: number,
  height: number,
  home: FieldLayout,
  market: FieldLayout,
): Star[] {
  if (width <= 0 || height <= 0 || home.radius <= 0 || market.radius <= 0) {
    return [];
  }

  const random = mulberry32(STARFIELD.seed);

  const count = clamp(
    Math.round((width * height) / STARFIELD.countDivisor),
    STARFIELD.countMin,
    STARFIELD.countMax,
  );

  const stars: Star[] = [];
  let homeCount = 0;
  let marketCount = 0;
  // Twice the single-route ceiling: the loop runs until both routes are full,
  // and the second one to fill is fed only by the candidates the first no
  // longer needs.
  const limit = count * STARFIELD.maxCandidatesPerStar * 2;

  for (
    let candidate = 0;
    (homeCount < count || marketCount < count) && candidate < limit;
    candidate += 1
  ) {
    const x = random() * width;
    const y = random() * height;

    // Rejected candidates are discarded rather than repositioned; the loop goes
    // back for another one, because `count` is a target of survivors on each
    // route. A route that is already full takes no more.
    const draw = random();
    const inHome =
      homeCount < count && draw < layoutKeepProbability(x, y, home);
    const inMarket =
      marketCount < count && draw < layoutKeepProbability(x, y, market);
    if (!inHome && !inMarket) continue;

    if (inHome) homeCount += 1;
    if (inMarket) marketCount += 1;

    const magnitude = Math.pow(random(), STARFIELD.magnitudeExponent);
    stars.push({
      ...describe(x, y, magnitude, pickColour(random())),
      home: inHome,
      market: inMarket,
    });
  }

  return stars;
}

/**
 * How likely a candidate is to survive one route's globe and type together.
 *
 * Multiplied, against a single draw, so a candidate the type rejects costs the
 * generator exactly what one the globe rejects does.
 */
function layoutKeepProbability(
  x: number,
  y: number,
  layout: FieldLayout,
): number {
  const distance =
    Math.hypot(x - layout.centreX, y - layout.centreY) / layout.radius;
  return keepProbability(distance) * textKeepProbability(x, y, layout.clear);
}

/**
 * How likely a candidate at `distance` motif radii from the stage centre is to
 * survive.
 *
 * A genuine smoothstep rather than a linear ramp. A linear ramp leaves a
 * faintly visible ring where the density changes slope; this does not.
 */
function keepProbability(distance: number): number {
  const { falloffInner, falloffOuter } = STARFIELD;

  if (distance <= falloffInner) return 0;
  if (distance >= falloffOuter) return 1;

  const t = (distance - falloffInner) / (falloffOuter - falloffInner);
  return t * t * (3 - 2 * t);
}

/**
 * How likely a candidate at `x`/`y` is to survive the type around it: the
 * nearest box decides.
 *
 * Distance is to the box's edge, not its centre, so a long line is cleared
 * along its whole length rather than as a circle around its middle.
 */
function textKeepProbability(
  x: number,
  y: number,
  clear: readonly ClearRect[],
): number {
  const { textClearInner, textClearOuter } = STARFIELD;
  let nearest = Number.POSITIVE_INFINITY;

  for (const box of clear) {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    nearest = Math.min(nearest, Math.hypot(dx, dy));
  }

  if (nearest <= textClearInner) return 0;
  if (nearest >= textClearOuter) return 1;

  const t = (nearest - textClearInner) / (textClearOuter - textClearInner);
  return t * t * (3 - 2 * t);
}

/**
 * Derives everything about a star's appearance from its magnitude.
 *
 * Split out from the loop because this, not the placement above it, is what the
 * appearance model actually is.
 */
function describe(
  x: number,
  y: number,
  magnitude: number,
  colour: readonly [number, number, number],
): Omit<Star, StageMode> {
  let coreRadius = STARFIELD.radiusFloor + magnitude * STARFIELD.radiusRange;
  let coreAlpha =
    STARFIELD.alphaFloor +
    Math.pow(magnitude, STARFIELD.alphaExponent) * STARFIELD.alphaRange;

  // Below the floor, size stops shrinking and brightness takes over. Squared,
  // because the light a disc carries goes with its area.
  if (coreRadius < STARFIELD.radiusMin) {
    coreAlpha *= Math.pow(coreRadius / STARFIELD.radiusMin, 2);
    coreRadius = STARFIELD.radiusMin;
  }

  let haloRadius: number | null = null;
  let haloAlpha = 0;

  if (magnitude > STARFIELD.bloomThreshold) {
    haloRadius = coreRadius * STARFIELD.bloomScale;
    haloAlpha = STARFIELD.bloomAlpha;
  } else if (magnitude > STARFIELD.haloThreshold) {
    haloRadius =
      coreRadius *
      (STARFIELD.haloScaleFloor + magnitude * STARFIELD.haloScaleRange);
    haloAlpha =
      ((magnitude - STARFIELD.haloThreshold) / (1 - STARFIELD.haloThreshold)) *
      STARFIELD.haloAlphaScale;
  }

  const towardWhite = Math.pow(magnitude, STARFIELD.desaturationExponent);

  return {
    x,
    y,
    magnitude,
    coreRadius,
    coreAlpha,
    coreColour: [
      lerp(towardWhite, colour[0], WHITE_POINT),
      lerp(towardWhite, colour[1], WHITE_POINT),
      lerp(towardWhite, colour[2], WHITE_POINT),
    ],
    haloRadius,
    haloAlpha,
    haloColour: colour,
  };
}

/**
 * Picks a colour by the global shares.
 *
 * Colour no longer depends on how bright a star is, and does not need to: the
 * desaturation in `describe` takes the tint out of a bright core on its own,
 * and leaves the faint majority carrying the palette.
 */
function pickColour(sample: number): readonly [number, number, number] {
  const { white, blue } = STARFIELD.colourShares;

  if (sample < white) return STARFIELD.colours.white;
  if (sample < white + blue) return STARFIELD.colours.blue;
  return STARFIELD.colours.amber;
}

function lerp(t: number, from: number, to: number): number {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
