import { NextResponse } from "next/server";
import {
  METEO_LAT,
  METEO_LON,
  OPEN_METEO_URL,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** WMO Weather interpretation codes → descrizione IT (semplificata). */
const WMO_IT: Record<number, string> = {
  0: "Cielo sereno",
  1: "Prevalentemente sereno",
  2: "Parzialmente nuvoloso",
  3: "Coperto",
  45: "Nebbia",
  48: "Nebbia con brina",
  51: "Pioviggine leggera",
  53: "Pioviggine moderata",
  55: "Pioviggine intensa",
  61: "Pioggia debole",
  63: "Pioggia moderata",
  65: "Pioggia forte",
  71: "Neve debole",
  73: "Neve moderata",
  75: "Neve forte",
  80: "Rovesci deboli",
  81: "Rovesci moderati",
  82: "Rovesci violenti",
  95: "Temporale",
  96: "Temporale con grandine",
  99: "Temporale con grandine forte",
};

export async function GET() {
  try {
    const params = new URLSearchParams({
      latitude: String(METEO_LAT),
      longitude: String(METEO_LON),
      timezone: "Europe/Rome",
      forecast_days: "7",
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
      ].join(","),
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
      ].join(","),
      wind_speed_unit: "kmh",
    });

    const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      current?: Record<string, unknown>;
      hourly?: Record<string, unknown>;
      daily?: Record<string, unknown>;
    };

    const currentCode = Number(data.current?.weather_code ?? NaN);
    const current = {
      ...data.current,
      weather_desc: Number.isFinite(currentCode)
        ? (WMO_IT[currentCode] ?? `Codice WMO ${currentCode}`)
        : null,
    };

    // Prossime 48 ore per i grafici
    const times = (data.hourly?.time as string[] | undefined) ?? [];
    const slice = Math.min(48, times.length);
    const hourly = {
      time: times.slice(0, slice),
      temperature_2m: ((data.hourly?.temperature_2m as number[]) ?? []).slice(0, slice),
      precipitation: ((data.hourly?.precipitation as number[]) ?? []).slice(0, slice),
      precipitation_probability: (
        (data.hourly?.precipitation_probability as number[]) ?? []
      ).slice(0, slice),
      cloud_cover: ((data.hourly?.cloud_cover as number[]) ?? []).slice(0, slice),
      wind_speed_10m: ((data.hourly?.wind_speed_10m as number[]) ?? []).slice(0, slice),
      weather_code: ((data.hourly?.weather_code as number[]) ?? []).slice(0, slice),
    };

    const dailyCodes = (data.daily?.weather_code as number[] | undefined) ?? [];
    const daily = {
      ...data.daily,
      weather_desc: dailyCodes.map(
        (c) => WMO_IT[c] ?? (Number.isFinite(c) ? `WMO ${c}` : "n.d."),
      ),
    };

    return NextResponse.json(
      {
        source: "Open-Meteo",
        source_url: "https://open-meteo.com/",
        latitude: METEO_LAT,
        longitude: METEO_LON,
        current,
        hourly,
        daily,
        fetched_at: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
      },
    );
  } catch (err) {
    console.error("Forecast error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare le previsioni Open-Meteo" },
      { status: 502 },
    );
  }
}
