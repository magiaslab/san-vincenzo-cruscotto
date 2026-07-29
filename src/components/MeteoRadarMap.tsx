"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  METEO_LAT,
  METEO_LON,
  OSM_COPYRIGHT_URL,
  RAINVIEWER_ATTRIBUTION_URL,
} from "@/lib/constants";
import { DataUnavailable, LoadingBlock } from "@/components/ui";

type RadarFrame = {
  time: number;
  path: string;
  tileUrl: string;
  label: string;
  isNowcast?: boolean;
};

type RadarResponse = {
  frames: RadarFrame[];
  infrared: RadarFrame[];
  defaultIndex: number;
  error?: string;
};

export default function MeteoRadarMap() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [layer, setLayer] = useState<"radar" | "infrared">("radar");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/meteo/radar", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("radar");
        return r.json();
      })
      .then((json: RadarResponse) => {
        if (cancelled) return;
        setData(json);
        setIndex(json.defaultIndex ?? Math.max(0, (json.frames?.length ?? 1) - 1));
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare il radar precipitazioni");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const frames = useMemo(() => {
    if (!data) return [];
    return layer === "radar" ? data.frames ?? [] : data.infrared ?? [];
  }, [data, layer]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, 700);
    return () => window.clearInterval(id);
  }, [playing, frames.length]);

  useEffect(() => {
    if (frames.length === 0) return;
    setIndex((i) => Math.min(i, frames.length - 1));
  }, [frames.length]);

  const current = frames[index] ?? null;

  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#d9e6f2] px-4 py-3">
        <h3 className="m-0 text-base font-bold text-[#17324d]">
          Radar precipitazioni
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            className={`rounded-full px-3 py-1 font-semibold ${
              layer === "radar" ? "bg-[#0066CC] text-white" : "bg-[#e8f2fc] text-[#17324d]"
            }`}
            onClick={() => setLayer("radar")}
          >
            Radar
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 font-semibold ${
              layer === "infrared"
                ? "bg-[#0066CC] text-white"
                : "bg-[#e8f2fc] text-[#17324d]"
            }`}
            onClick={() => setLayer("infrared")}
            disabled={!data?.infrared?.length}
          >
            Satellite IR
          </button>
          <button
            type="button"
            className="rounded-full bg-[#17324d] px-3 py-1 font-semibold text-white"
            onClick={() => setPlaying((p) => !p)}
            disabled={frames.length < 2}
          >
            {playing ? "Pausa" : "Play"}
          </button>
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs text-[#5b6f82]">
          Opacità
          <input
            type="range"
            min={20}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          />
        </label>
      </div>

      {error ? (
        <div className="p-4">
          <DataUnavailable message={error} />
        </div>
      ) : null}
      {!data && !error ? (
        <div className="p-4">
          <LoadingBlock label="Caricamento frame radar…" />
        </div>
      ) : null}

      {data && frames.length === 0 ? (
        <div className="p-4">
          <DataUnavailable message="Nessun frame disponibile per questo layer." />
        </div>
      ) : null}

      {data && frames.length > 0 ? (
        <>
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_DEFAULT_ZOOM - 1}
            scrollWheelZoom
            className="h-[420px] w-full"
          >
            <TileLayer
              attribution={`&copy; <a href="${OSM_COPYRIGHT_URL}">OpenStreetMap</a>`}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {current ? (
              <TileLayer
                key={current.tileUrl}
                url={current.tileUrl}
                opacity={opacity}
                zIndex={400}
                attribution={`Radar <a href="${RAINVIEWER_ATTRIBUTION_URL}" target="_blank" rel="noopener noreferrer">RainViewer</a>`}
              />
            ) : null}
            <CircleMarker
              center={[METEO_LAT, METEO_LON]}
              radius={8}
              pathOptions={{
                color: "#0066CC",
                fillColor: "#0066CC",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>San Vincenzo — punto meteo di riferimento</Popup>
            </CircleMarker>
          </MapContainer>

          <div className="space-y-2 border-t border-[#d9e6f2] bg-[#f5f8fc] px-4 py-3">
            <input
              type="range"
              className="w-full"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={index}
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5b6f82]">
              <span>
                Frame {index + 1}/{frames.length}
                {current?.isNowcast ? " · nowcast" : ""} — {current?.label}
              </span>
              <span>
                Fonte:{" "}
                <a
                  href={RAINVIEWER_ATTRIBUTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  RainViewer
                </a>
              </span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
