import proj4 from "proj4";

/**
 * Monte Mario / Italy zone 1 (EPSG:3003) → WGS84.
 * I GeoJSON del portale comunale ldpgis arrivano spesso in 3003.
 */
const EPSG_3003 =
  "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs";

proj4.defs("EPSG:3003", EPSG_3003);

type GeoJsonLike = {
  type?: string;
  crs?: { properties?: { name?: string } } | null;
  features?: Array<{
    geometry?: { type?: string; coordinates?: unknown } | null;
  }>;
};

function crsName(fc: GeoJsonLike): string {
  return String(fc.crs?.properties?.name ?? "");
}

function looksProjected(fc: GeoJsonLike): boolean {
  const name = crsName(fc).toUpperCase();
  if (name.includes("3003") || name.includes("EPSG::3003")) return true;
  const feat = fc.features?.[0];
  const coords = feat?.geometry?.coordinates;
  const pt = firstPoint(coords);
  if (!pt) return false;
  // lon/lat tipici Toscana ~10/43; 3003 ha valori ~1.6e6 / 4.7e6
  return Math.abs(pt[0]) > 180 || Math.abs(pt[1]) > 90;
}

function firstPoint(coords: unknown): [number, number] | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    return [coords[0], coords[1]];
  }
  return firstPoint(coords[0]);
}

function convertCoords(coords: unknown): unknown {
  if (!Array.isArray(coords) || coords.length === 0) return coords;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    const [lon, lat] = proj4("EPSG:3003", "EPSG:4326", [
      coords[0],
      coords[1],
    ]);
    return coords.length > 2 ? [lon, lat, ...coords.slice(2)] : [lon, lat];
  }
  return coords.map(convertCoords);
}

/** Se il FeatureCollection è in EPSG:3003 (o sembra proiettato), lo riconverte in WGS84. */
export function ensureWgs84GeoJson<T>(fc: T | null): T | null {
  if (!fc || typeof fc !== "object") return fc;
  const asFc = fc as GeoJsonLike;
  if (!Array.isArray(asFc.features)) return fc;
  if (!looksProjected(asFc)) return fc;
  const features = asFc.features.map((f) => {
    const g = f.geometry;
    if (!g || g.coordinates == null) return f;
    return {
      ...f,
      geometry: {
        ...g,
        coordinates: convertCoords(g.coordinates),
      },
    };
  });
  return {
    ...(fc as object),
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features,
  } as T;
}
