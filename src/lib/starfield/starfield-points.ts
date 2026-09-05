/**
 * Star placement for the starfield layer, transcribed from "The field" section
 * of `docs/design/starfield.md`.
 *
 * This module is the single definition of where a star sits, how large it is
 * and what colour it is. It touches no canvas and no DOM: it is handed the
 * stage's dimensions and the motif radius, and returns an array. `draw.ts`
 * turns that array into fills.
 *
 * Every tunable number lives in `STARFIELD` below. The amber share and the
 * amber value in particular are marked as under review in the specification and
 * are expected to move once the field has been looked at on screen, so they are
 * named constants in one place rather than literals spread through the loop.
 */

/** A single star, in CSS pixels, positioned relative to the stage's top left. */
export interface Star {
  x: number;
  y: number;
  /** Core radius. The flat filled circle every star has. */
  radius: number;
  opacity: number;
  /** Red, green, blue. Alpha is `opacity`, applied at draw time. */
  colour: readonly [number, number, number];
  /**
   * Outer radius of the soft halo, or null for a star that has none.
   *
   * Precomputed here so the draw path holds no constants of its own and cannot
   * disagree with this file about how far the halo reaches.
   */
  haloRadius: number | null;
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
   * Size tiers, in CSS pixels before device-pixel-ratio scaling. Shares must
   * total 1. Radius and opacity are randomised within their ranges per star.
   *
   * Three tiers rather than one size is what gives the field parallax without
   * motion: a field of identical dots reads flat.
   */
  tiers: [
    {
      share: 0.72,
      radius: [0.5, 0.9],
      opacity: [0.15, 0.35],
      halo: false,
    },
    {
      share: 0.22,
      radius: [0.9, 1.4],
      opacity: [0.35, 0.6],
      halo: false,
    },
    {
      share: 0.06,
      radius: [1.4, 2.2],
      opacity: [0.6, 0.85],
      halo: true,
    },
  ],

  /** The near tier's halo reaches this multiple of its core radius. */
  haloScale: 3,

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
   * The share of far-tier stars that are cool white.
   *
   * The colour budget is deliberately spent on the larger stars: a coloured
   * star at 0.5px and 0.2 opacity is indistinguishable from a white one, so
   * colour in the far tier is wasted. The mid and near tiers take whatever is
   * left over, which `colourWeights` below works out — change this number or
   * `colourShares` and the two stay reconciled on their own.
   */
  farWhiteShare: 0.92,

  /**
   * Fixed seed. The field must be identical across reloads so a reviewer can
   * compare a screenshot against the design, and identical across resizes at
   * the same size so watching a window being dragged does not scatter a
   * completely different sky on every frame.
   */
  seed: 0x9e3779b9,
} as const;

const TIER_FAR = 0;

/**
 * Per-tier colour weights, derived once from the global shares.
 *
 * The far tier is pinned at `farWhiteShare` white, and the mid and near tiers
 * absorb the remainder needed to hit the global shares. At the specified
 * numbers that lands on 42% white for mid and near — which, weighted by the
 * tier shares, reconciles to exactly 78 / 14 / 8 across the field:
 *
 *   0.72 x 0.92 + 0.28 x 0.42 = 0.78
 *
 * Coloured stars in both groups are split between blue and amber in the same
 * ratio the global shares give them, so the amber share can be retuned on its
 * own without disturbing the blue.
 */
const colourWeights = (() => {
  const { colourShares, tiers, farWhiteShare } = STARFIELD;

  const farShare = tiers[TIER_FAR].share;
  const restShare = 1 - farShare;

  // Clamped because a large enough colour share would ask the mid and near
  // tiers for more colour than they have stars, and a negative weight would
  // silently push every star into one bucket rather than failing visibly.
  const restWhiteShare = clamp(
    (colourShares.white - farShare * farWhiteShare) / restShare,
    0,
    1,
  );

  const colouredRatio =
    colourShares.blue / (colourShares.blue + colourShares.amber);

  return [farWhiteShare, restWhiteShare].map((white) => {
    const coloured = 1 - white;
    return {
      white,
      blue: coloured * colouredRatio,
      amber: coloured * (1 - colouredRatio),
    };
  });
})();

/**
 * Builds the field.
 *
 * Pure: same arguments in, same array out, every time. `radius` is the motif
 * radius as `home.md` computes it, which the caller passes in rather than this
 * module deriving a second copy of it.
 */
export function createStarfield(
  width: number,
  height: number,
  radius: number,
): Star[] {
  if (width <= 0 || height <= 0 || radius <= 0) return [];

  const random = mulberry32(STARFIELD.seed);
  const centreX = width / 2;
  const centreY = height / 2;

  const count = clamp(
    Math.round((width * height) / STARFIELD.countDivisor),
    STARFIELD.countMin,
    STARFIELD.countMax,
  );

  const stars: Star[] = [];
  const limit = count * STARFIELD.maxCandidatesPerStar;

  for (
    let candidate = 0;
    stars.length < count && candidate < limit;
    candidate += 1
  ) {
    const x = random() * width;
    const y = random() * height;

    // Rejected candidates are discarded rather than repositioned; the loop goes
    // back for another one, because `count` is a target of survivors.
    const distance = Math.hypot(x - centreX, y - centreY) / radius;
    if (random() >= keepProbability(distance)) continue;

    const tierIndex = pickTier(random());
    const tier = STARFIELD.tiers[tierIndex];
    const starRadius = lerp(random(), tier.radius[0], tier.radius[1]);

    stars.push({
      x,
      y,
      radius: starRadius,
      opacity: lerp(random(), tier.opacity[0], tier.opacity[1]),
      colour: pickColour(random(), tierIndex),
      haloRadius: tier.halo ? starRadius * STARFIELD.haloScale : null,
    });
  }

  return stars;
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

/** Walks the cumulative tier shares. */
function pickTier(sample: number): number {
  let cumulative = 0;

  for (let index = 0; index < STARFIELD.tiers.length; index += 1) {
    cumulative += STARFIELD.tiers[index].share;
    if (sample < cumulative) return index;
  }

  // Only reachable if the shares total slightly under 1 through rounding.
  return STARFIELD.tiers.length - 1;
}

function pickColour(
  sample: number,
  tierIndex: number,
): readonly [number, number, number] {
  const weights = colourWeights[tierIndex === TIER_FAR ? 0 : 1];

  if (sample < weights.white) return STARFIELD.colours.white;
  if (sample < weights.white + weights.blue) return STARFIELD.colours.blue;
  return STARFIELD.colours.amber;
}

/**
 * A small deterministic PRNG. Sufficient here and deliberately not a
 * cryptographic one: this is a scatter of background dots, and the only
 * property that matters is that it repeats.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(t: number, from: number, to: number): number {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
