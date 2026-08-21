/**
 * Client Overpass minimale (OSM), condiviso da TPL / percorsi / accessibilità.
 */
import { HTTP_USER_AGENT } from "@/lib/constants";
import type { ComuneBbox } from "@/lib/comune-config";

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
] as const;

const OVERPASS_FETCH_MS = 25_000;

export type OverpassMember = {
  type: string;
  ref: number;
  role?: string;
};

export type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  members?: OverpassMember[];
  geometry?: Array<{ lat: number; lon: number }>;
};

/** Overpass bbox: latMin,lonMin,latMax,lonMax */
export function overpassBbox(b: ComuneBbox): string {
  return `${b.latMin},${b.lonMin},${b.latMax},${b.lonMax}`;
}

export async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  let lastErr: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OVERPASS_FETCH_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": HTTP_USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`overpass_http_${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      const elements = Array.isArray(json.elements) ? json.elements : [];
      if (elements.length === 0) {
        lastErr = new Error(`overpass_empty:${endpoint}`);
        continue;
      }
      return elements;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  if (
    lastErr instanceof Error &&
    String(lastErr.message).startsWith("overpass_empty:")
  ) {
    return [];
  }
  throw lastErr instanceof Error ? lastErr : new Error("overpass_failed");
}
