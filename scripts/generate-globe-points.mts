/**
 * Generates the globe motif's point set and writes it into the repository.
 *
 *   npm run generate:globe -- [--count 9000] [--chart path/to/chart.svg]
 *
 * Implements the "Geometry generation" section of `docs/design/globe.md`:
 * candidates are placed by the Fibonacci sphere method, classified as land or
 * ocean by testing their coordinate against Natural Earth 50m land geometry, and
 * thinned to the specified land/ocean balance by regular discards.
 *
 * The mapping libraries used here are development dependencies. Nothing from
 * them reaches the browser: the output is a list of surviving candidate indices,
 * and the runtime rebuilds positions from `src/lib/globe/fibonacci-sphere.ts`,
 * the same module this script uses.
 */

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { geoArea, geoBounds, geoContains } from "d3-geo";
import { format } from "prettier";
import { feature } from "topojson-client";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

import {
  COMPONENTS_PER_POINT,
  latitudeOf,
  longitudeOf,
  writeSpherePoint,
} from "../src/lib/globe/fibonacci-sphere.ts";

/** Share of the kept points that must be land. From the spec. */
const LAND_SHARE = 0.64;

/**
 * How much larger than the bare minimum the candidate pool is made.
 *
 * The pool is sized from the measured area of the land geometry, but Fibonacci
 * sampling of it lands a few tenths of a percent either side of that area, so a
 * pool sized exactly to the land target sometimes falls short of it. This is
 * headroom, not a correction; the pool grows again if even this is not enough.
 */
const POOL_MARGIN = 1.02;

/** Default point count. The spec calls this a floor, not a ceiling. */
const DEFAULT_COUNT = 9000;

const RAD_TO_DEG = 180 / Math.PI;

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = path.join(repoRoot, "src/lib/globe/point-set.generated.ts");

// ---------------------------------------------------------------------------
// Source geometry
// ---------------------------------------------------------------------------

/** One land polygon, with the spherical bounds used to reject points cheaply. */
interface LandPolygon {
  geometry: Polygon;
  west: number;
  east: number;
  south: number;
  north: number;
}

interface LandGeometry {
  /** Every land polygon, for the point test. */
  polygons: LandPolygon[];
  /** Share of the sphere the polygons cover, as a fraction. */
  coverage: number;
}

function loadLandGeometry(): LandGeometry {
  const require = createRequire(import.meta.url);
  const topology = require("world-atlas/land-50m.json") as Topology<{
    land: GeometryCollection;
  }>;

  const collection = feature(topology, topology.objects.land);
  const rings: Position[][][] = [];

  for (const land of collection.features as Feature<Polygon | MultiPolygon>[]) {
    if (land.geometry.type === "Polygon") {
      rings.push(land.geometry.coordinates);
    } else {
      rings.push(...land.geometry.coordinates);
    }
  }

  const polygons = rings.map((coordinates) => {
    const geometry: Polygon = { type: "Polygon", coordinates };
    const [[west, south], [east, north]] = geoBounds(geometry);
    return { geometry, west, east, south, north };
  });

  const multiPolygon: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: rings,
  };

  return { polygons, coverage: geoArea(multiPolygon) / (4 * Math.PI) };
}

/**
 * True when the coordinate falls inside any land polygon.
 *
 * The bounds check is a prefilter only. `geoBounds` reports spherical bounds, so
 * a polygon that crosses the antimeridian comes back with `west > east`, and one
 * that encloses a pole comes back spanning the full range of longitude. Both are
 * handled here; the polygon test itself is left to `geoContains`, which treats
 * rings as spherical polygons and honours holes.
 */
function isLand(
  polygons: LandPolygon[],
  lonDeg: number,
  latDeg: number,
): boolean {
  const epsilon = 1e-9;

  for (const polygon of polygons) {
    if (latDeg < polygon.south - epsilon || latDeg > polygon.north + epsilon) {
      continue;
    }

    const withinLongitude =
      polygon.west <= polygon.east
        ? lonDeg >= polygon.west - epsilon && lonDeg <= polygon.east + epsilon
        : lonDeg >= polygon.west - epsilon || lonDeg <= polygon.east + epsilon;

    if (!withinLongitude) continue;

    if (geoContains(polygon.geometry, [lonDeg, latDeg])) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Point set
// ---------------------------------------------------------------------------

interface PointSet {
  total: number;
  landIndices: number[];
  oceanIndices: number[];
}

/** Splits the whole candidate pool of `total` points into land and ocean. */
function classify(
  total: number,
  polygons: LandPolygon[],
): [number[], number[]] {
  const position = new Float32Array(COMPONENTS_PER_POINT);
  const land: number[] = [];
  const ocean: number[] = [];

  for (let index = 0; index < total; index += 1) {
    writeSpherePoint(index, total, position, 0);

    const lonDeg = longitudeOf(position[0], position[1]) * RAD_TO_DEG;
    const latDeg = latitudeOf(position[2]) * RAD_TO_DEG;

    (isLand(polygons, lonDeg, latDeg) ? land : ocean).push(index);
  }

  return [land, ocean];
}

/**
 * Takes exactly `target` of `available`, spread evenly across the whole list.
 *
 * The discards are regular rather than random, so the even distribution of the
 * candidates survives the thinning. Spreading the stride across the entire list,
 * rather than keeping every n-th until the target is met, is what keeps the far
 * end of the walk populated: the walk runs pole to pole, so stopping early would
 * empty a cap of the sphere.
 */
function thin(available: number[], target: number): number[] {
  const kept: number[] = [];

  for (let k = 0; k < target; k += 1) {
    kept.push(available[Math.floor((k * available.length) / target)]);
  }

  return kept;
}

function buildPointSet(count: number): PointSet {
  const landTarget = Math.round(count * LAND_SHARE);
  const oceanTarget = count - landTarget;
  const { polygons, coverage } = loadLandGeometry();

  console.log(`land coverage ${(coverage * 100).toFixed(3)}% of the sphere`);

  let total = Math.ceil((landTarget / coverage) * POOL_MARGIN);

  for (;;) {
    const [land, ocean] = classify(total, polygons);
    console.log(
      `candidates    ${total} -> ${land.length} land, ${ocean.length} ocean`,
    );

    if (land.length >= landTarget && ocean.length >= oceanTarget) {
      console.log(`kept          ${landTarget} land, ${oceanTarget} ocean`);
      return {
        total,
        landIndices: thin(land, landTarget),
        oceanIndices: thin(ocean, oceanTarget),
      };
    }

    console.log(`              short of target, growing the pool`);
    const shortfall = Math.max(
      landTarget / land.length,
      oceanTarget / ocean.length,
    );
    total = Math.ceil(total * shortfall * POOL_MARGIN);
  }
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

/**
 * Packs an ascending index list as LEB128 varint gaps, base64 encoded.
 *
 * The gaps are small — the candidate pool is barely twice the kept count — so
 * almost every index costs one byte, against two for a raw 16-bit index and
 * several for a decimal literal in source.
 */
function encodeIndices(indices: number[]): string {
  const bytes: number[] = [];
  let previous = 0;

  for (const index of indices) {
    let gap = index - previous;
    previous = index;

    while (gap >= 0x80) {
      bytes.push((gap & 0x7f) | 0x80);
      gap >>>= 7;
    }
    bytes.push(gap);
  }

  return Buffer.from(bytes).toString("base64");
}

async function writeGeneratedModule({
  total,
  landIndices,
  oceanIndices,
}: PointSet): Promise<void> {
  const source = `// Generated by scripts/generate-globe-points.mts. Do not edit by hand.
//
// Surviving Fibonacci sphere candidate indices, as LEB128 varint gaps in base64.
// Positions are rebuilt at runtime from these indices and \`total\`; see
// \`src/lib/globe/point-set.ts\`.

export const GLOBE_POINT_SET_DATA = {
  /** Candidates the indices below address, and the divisor their positions use. */
  total: ${total},
  landCount: ${landIndices.length},
  oceanCount: ${oceanIndices.length},
  land: "${encodeIndices(landIndices)}",
  ocean: "${encodeIndices(oceanIndices)}",
} as const;
`;

  // Formatted here so that `npm run format` leaves the generated file alone and
  // re-running the generator is a no-op when nothing has changed.
  writeFileSync(
    outputPath,
    await format(source, { filepath: outputPath }),
    "utf8",
  );
  console.log(`\nwrote         ${path.relative(repoRoot, outputPath)}`);
}

// ---------------------------------------------------------------------------
// Verification chart
// ---------------------------------------------------------------------------

/**
 * Writes an equirectangular plot of the point set, for confirming by eye that
 * the continents are in the right places and the right way up. Not committed.
 */
function writeChart(
  chartPath: string,
  { total, landIndices, oceanIndices }: PointSet,
): void {
  const width = 1440;
  const height = 720;
  const position = new Float32Array(COMPONENTS_PER_POINT);

  const plot = (indices: number[], size: number): string => {
    const parts: string[] = [];

    for (const index of indices) {
      writeSpherePoint(index, total, position, 0);
      const lonDeg = longitudeOf(position[0], position[1]) * RAD_TO_DEG;
      const latDeg = latitudeOf(position[2]) * RAD_TO_DEG;
      const x = (((lonDeg + 180) / 360) * width).toFixed(1);
      const y = (((90 - latDeg) / 180) * height).toFixed(1);
      parts.push(`M${x} ${y}h${size}v${size}h-${size}z`);
    }

    return parts.join("");
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#080A0F"/>
<path d="${plot(oceanIndices, 2)}" fill="#4E9BFB" fill-opacity="0.35"/>
<path d="${plot(landIndices, 2)}" fill="#5FD98F"/>
<path d="M0 ${height / 2}h${width}M${width / 2} 0v${height}" stroke="#ffffff" stroke-opacity="0.18"/>
</svg>
`;

  writeFileSync(chartPath, svg, "utf8");
  console.log(`wrote         ${chartPath}`);
}

// ---------------------------------------------------------------------------

function readOption(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const count = Number(readOption("count") ?? DEFAULT_COUNT);

if (!Number.isInteger(count) || count < 1) {
  console.error(
    `--count must be a positive integer, got ${readOption("count")}`,
  );
  process.exit(1);
}

const pointSet = buildPointSet(count);
await writeGeneratedModule(pointSet);

const chartPath = readOption("chart");
if (chartPath) writeChart(path.resolve(chartPath), pointSet);
