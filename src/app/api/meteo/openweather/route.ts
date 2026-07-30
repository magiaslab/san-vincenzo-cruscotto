import { NextResponse } from "next/server";
import {
  METEO_LAT,
  METEO_LON,
  OPENWEATHER_BASE_URL,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AQI_IT: Record<number, string> = {
  1: "Buona",
  2: "Discreta",
  3: "Moderata",
  4: "Scarsa",
  5: "Pessima",
};

type OwWeather = {
  dt?: number;
  main?: {
    temp?: number;
    feels_like?: number;
    temp_min?: number;
    temp_max?: number;
    pressure?: number;
    humidity?: number;
  };
  weather?: Array<{ main?: string; description?: string; icon?: string }>;
  wind?: { speed?: number; deg?: number; gust?: number };
  clouds?: { all?: number };
  visibility?: number;
  rain?: { "1h"?: number; "3h"?: number };
  snow?: { "1h"?: number; "3h"?: number };
  sys?: { sunrise?: number; sunset?: number; pod?: string };
  pop?: number;
};

type OwForecast = {
  list?: OwWeather[];
  city?: { sunrise?: number; sunset?: number; name?: string };
};

type OwAir = {
  list?: Array<{
    main?: { aqi?: number };
    components?: Record<string, number>;
    dt?: number;
  }>;
};

function msToKmh(ms: number | undefined | null): number | null {
  if (ms == null || Number.isNaN(ms)) return null;
  return Math.round(ms * 3.6 * 10) / 10;
}

function isoFromUnix(sec: number | undefined | null): string | null {
  if (sec == null || !Number.isFinite(sec)) return null;
  return new Date(sec * 1000).toISOString();
}

function mapCurrent(w: OwWeather, sunrise?: number, sunset?: number) {
  const w0 = w.weather?.[0];
  return {
    temp_c: w.main?.temp ?? null,
    feels_like_c: w.main?.feels_like ?? null,
    temp_min_c: w.main?.temp_min ?? null,
    temp_max_c: w.main?.temp_max ?? null,
    pressure_hpa: w.main?.pressure ?? null,
    humidity_pct: w.main?.humidity ?? null,
    wind_kmh: msToKmh(w.wind?.speed),
    wind_deg: w.wind?.deg ?? null,
    wind_gust_kmh: msToKmh(w.wind?.gust),
    clouds_pct: w.clouds?.all ?? null,
    visibility_m: w.visibility ?? null,
    rain_1h_mm: w.rain?.["1h"] ?? null,
    rain_3h_mm: w.rain?.["3h"] ?? null,
    description: w0?.description ?? null,
    main: w0?.main ?? null,
    icon: w0?.icon ?? null,
    sunrise: isoFromUnix(sunrise ?? w.sys?.sunrise),
    sunset: isoFromUnix(sunset ?? w.sys?.sunset),
    dt: isoFromUnix(w.dt),
  };
}

type DailyAgg = {
  date: string;
  label: string;
  temp_min_c: number;
  temp_max_c: number;
  humidity_pct: number | null;
  wind_max_kmh: number | null;
  rain_mm: number;
  pop_max: number | null;
  description: string | null;
  icon: string | null;
};

function aggregateDaily(list: OwWeather[]): DailyAgg[] {
  const byDay = new Map<string, OwWeather[]>();
  for (const item of list) {
    if (!item.dt) continue;
    const d = new Date(item.dt * 1000);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
    const arr = byDay.get(key) ?? [];
    arr.push(item);
    byDay.set(key, arr);
  }

  const days: DailyAgg[] = [];
  for (const [date, items] of byDay) {
    let tMin = Infinity;
    let tMax = -Infinity;
    let humidSum = 0;
    let humidN = 0;
    let windMax: number | null = null;
    let rain = 0;
    let popMax: number | null = null;
    // Prefer midday slot (~12:00) for icon/description
    let best = items[0];
    let bestScore = Infinity;
    for (const it of items) {
      const t = it.main?.temp;
      if (t != null) {
        tMin = Math.min(tMin, t);
        tMax = Math.max(tMax, t);
      }
      if (it.main?.humidity != null) {
        humidSum += it.main.humidity;
        humidN += 1;
      }
      const w = msToKmh(it.wind?.speed);
      if (w != null) windMax = windMax == null ? w : Math.max(windMax, w);
      rain += it.rain?.["3h"] ?? 0;
      if (it.pop != null) popMax = popMax == null ? it.pop : Math.max(popMax, it.pop);
      const hour = new Date(it.dt! * 1000).getHours();
      const score = Math.abs(hour - 12);
      if (score < bestScore) {
        bestScore = score;
        best = it;
      }
    }
    const label = new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    days.push({
      date,
      label,
      temp_min_c: Number.isFinite(tMin) ? Math.round(tMin * 10) / 10 : NaN,
      temp_max_c: Number.isFinite(tMax) ? Math.round(tMax * 10) / 10 : NaN,
      humidity_pct: humidN ? Math.round(humidSum / humidN) : null,
      wind_max_kmh: windMax,
      rain_mm: Math.round(rain * 10) / 10,
      pop_max: popMax != null ? Math.round(popMax * 100) : null,
      description: best?.weather?.[0]?.description ?? null,
      icon: best?.weather?.[0]?.icon ?? null,
    });
  }
  return days.filter((d) => Number.isFinite(d.temp_min_c));
}

async function fetchOw<T>(path: string, key: string): Promise<T> {
  const url = new URL(`${OPENWEATHER_BASE_URL}${path}`);
  url.searchParams.set("lat", String(METEO_LAT));
  url.searchParams.set("lon", String(METEO_LON));
  url.searchParams.set("appid", key);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "it");
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenWeather ${path} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** OpenWeather free: current weather + 5d/3h forecast + air pollution. */
export async function GET() {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY non configurata" },
      { status: 503 },
    );
  }

  try {
    const [weather, forecast, air] = await Promise.all([
      fetchOw<OwWeather>("/weather", key),
      fetchOw<OwForecast>("/forecast", key),
      fetchOw<OwAir>("/air_pollution", key),
    ]);

    const list = forecast.list ?? [];
    const current = mapCurrent(
      weather,
      forecast.city?.sunrise,
      forecast.city?.sunset,
    );

    const forecast_3h = list.slice(0, 8).map((item) => ({
      ...mapCurrent(item),
      pop_pct: item.pop != null ? Math.round(item.pop * 100) : null,
      rain_3h_mm: item.rain?.["3h"] ?? null,
    }));

    const airItem = air.list?.[0];
    const aqi = airItem?.main?.aqi ?? null;

    return NextResponse.json(
      {
        current,
        forecast_3h,
        daily: aggregateDaily(list),
        air: {
          aqi,
          aqi_label: aqi != null ? (AQI_IT[aqi] ?? null) : null,
          components: airItem?.components ?? null,
          dt: isoFromUnix(airItem?.dt),
        },
        place: forecast.city?.name ?? "San Vincenzo",
        lat: METEO_LAT,
        lon: METEO_LON,
        source: "OpenWeather",
        _generated_at: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("OpenWeather error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare i dati OpenWeather" },
      { status: 502 },
    );
  }
}
