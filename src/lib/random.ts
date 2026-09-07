/**
 * A small deterministic pseudo-random number generator, shared by the surfaces
 * that need a scatter which repeats.
 *
 * Deliberately not a cryptographic generator: nothing here guards anything. The
 * only property that matters is that one seed always produces one stream, so
 * the starfield lands the same stars and the globe's entrance runs the same
 * arrival order on every load. That is what makes either of them reviewable
 * against a screenshot, and what makes "reload and compare" a valid check.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
