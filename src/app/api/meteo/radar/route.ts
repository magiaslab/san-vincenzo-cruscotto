import { NextResponse } from "next/server";
import { RAINVIEWER_MAPS_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RadarFrame = { time: number; path: string };

/**
 * Metadati frame radar RainViewer (past + nowcast).
 * I tile vengono caricati direttamente dal CDN lato client.
 */
export async function GET() {
  try {
    const res = await fetch(RAINVIEWER_MAPS_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`RainViewer HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      version?: string;
      generated?: number;
      host?: string;
      radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] };
      satellite?: { infrared?: RadarFrame[] };
    };

    const host = data.host ?? "https://tilecache.rainviewer.com";
    const past = data.radar?.past ?? [];
    const nowcast = data.radar?.nowcast ?? [];
    const frames = [...past, ...nowcast].map((f) => ({
      time: f.time,
      path: f.path,
      /** Tile template Leaflet: {z}/{x}/{y} */
      tileUrl: `${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
      label: new Date(f.time * 1000).toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
        dateStyle: "short",
        timeStyle: "short",
      }),
      isNowcast: nowcast.some((n) => n.time === f.time),
    }));

    const infrared = (data.satellite?.infrared ?? []).slice(-6).map((f) => ({
      time: f.time,
      path: f.path,
      tileUrl: `${host}${f.path}/256/{z}/{x}/{y}/0/0_0.png`,
      label: new Date(f.time * 1000).toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
        dateStyle: "short",
        timeStyle: "short",
      }),
    }));

    return NextResponse.json(
      {
        source: "RainViewer",
        source_url: "https://www.rainviewer.com/",
        host,
        generated: data.generated,
        frames,
        infrared,
        defaultIndex: Math.max(0, past.length - 1),
        fetched_at: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=60" },
      },
    );
  } catch (err) {
    console.error("Radar error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare i frame radar RainViewer" },
      { status: 502 },
    );
  }
}
