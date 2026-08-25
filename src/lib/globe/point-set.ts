/**
 * Expands the generated globe point set into the typed arrays the renderer uses.
 *
 * The generated module holds only which Fibonacci sphere candidates survived
 * classification. Positions are rebuilt here from `fibonacci-sphere.ts`, the
 * same module the generator used to place and classify them, so the two cannot
 * describe a point differently. No map data is fetched and no mapping library is
 * involved: everything below is arithmetic over a few kilobytes of indices.
 */

import {
  COMPONENTS_PER_POINT,
  writeSpherePoint,
} from "@/lib/globe/fibonacci-sphere";
import { GLOBE_POINT_SET_DATA } from "@/lib/globe/point-set.generated";

export interface GlobePointSet {
  /** Total points. Land points occupy the first `landCount` slots. */
  count: number;
  landCount: number;
  oceanCount: number;
  /** Unit-sphere x, y, z per point, `COMPONENTS_PER_POINT` floats each. */
  positions: Float32Array;
}

/** Decodes a base64 stream of LEB128 varint gaps back into absolute indices. */
function decodeIndices(encoded: string, expected: number): Uint32Array {
  const binary = atob(encoded);
  const indices = new Uint32Array(expected);

  let byte = 0;
  let previous = 0;

  for (let slot = 0; slot < expected; slot += 1) {
    let gap = 0;
    let shift = 0;
    let current: number;

    do {
      current = binary.charCodeAt(byte);
      byte += 1;
      gap |= (current & 0x7f) << shift;
      shift += 7;
    } while (current & 0x80);

    previous += gap;
    indices[slot] = previous;
  }

  return indices;
}

/**
 * Builds the point set. Allocates once; the renderer holds the result for the
 * lifetime of the globe and never rebuilds it.
 */
export function createGlobePointSet(): GlobePointSet {
  const { total, landCount, oceanCount, land, ocean } = GLOBE_POINT_SET_DATA;

  const count = landCount + oceanCount;
  const positions = new Float32Array(count * COMPONENTS_PER_POINT);

  writePositions(decodeIndices(land, landCount), total, positions, 0);
  writePositions(
    decodeIndices(ocean, oceanCount),
    total,
    positions,
    landCount * COMPONENTS_PER_POINT,
  );

  return { count, landCount, oceanCount, positions };
}

function writePositions(
  indices: Uint32Array,
  total: number,
  positions: Float32Array,
  offset: number,
): void {
  for (let slot = 0; slot < indices.length; slot += 1) {
    writeSpherePoint(
      indices[slot],
      total,
      positions,
      offset + slot * COMPONENTS_PER_POINT,
    );
  }
}
