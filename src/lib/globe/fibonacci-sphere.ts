/**
 * Point placement for the globe motif, transcribed from the "Even distribution"
 * and "Land classification" sections of `docs/design/globe.md`.
 *
 * This module is the single definition of where a point sits on the sphere. The
 * build-time generator (`scripts/generate-globe-points.mts`) and the runtime both
 * import it, so neither can drift from the other: the generator stores only which
 * candidate indices survived, and the runtime rebuilds their positions from here.
 */

/** `golden = π × (3 − √5)` */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Floats per point in a packed position array: x, y, z. */
export const COMPONENTS_PER_POINT = 3;

/**
 * Writes the unit-sphere position of candidate `index` of `total` into `out` at
 * `offset`, as x, y, z.
 *
 * Writing into a caller-owned array rather than returning an object keeps
 * generation allocation-free, which matters at nine thousand points.
 */
export function writeSpherePoint(
  index: number,
  total: number,
  out: Float32Array,
  offset: number,
): void {
  const z = 1 - (index / (total - 1)) * 2;
  const r = Math.sqrt(1 - z * z);
  const theta = GOLDEN_ANGLE * index;

  out[offset] = Math.cos(theta) * r;
  out[offset + 1] = Math.sin(theta) * r;
  out[offset + 2] = z;
}

/** Longitude in radians, in `[−π, π]`. */
export function longitudeOf(x: number, y: number): number {
  return Math.atan2(y, x);
}

/** Latitude in radians, in `[−π/2, π/2]`. */
export function latitudeOf(z: number): number {
  return Math.asin(Math.min(1, Math.max(-1, z)));
}
