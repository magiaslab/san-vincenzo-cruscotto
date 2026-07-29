"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_CENTER,
  METEO_LAT,
  METEO_LON,
  OSM_COPYRIGHT_URL,
  RAINVIEWER_ATTRIBUTION_URL,
} from "@/lib/constants";
import {
  DataUnavailable,
  LoadingBlock,
  PanelHeading,
  SolidButton,
} from "@/components/ui";
import { CloudRain } from "lucide-react";

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

/** Zoom iniziale locale Toscana / San Vincenzo (radar nativo max z7). */
const INITIAL_ZOOM = 8;
const RADAR_MAX_NATIVE_ZOOM = 7;

/** Aggiorna URL del layer radar senza rimontare la mappa (preserva zoom/pan). */
function RadarTileUpdater({
  url,
  opacity,
}: {
  url: string | null;
  opacity: number;
}) {
  const t = useT();
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!url) return;

    if (!layerRef.current) {
      const layer = L.tileLayer(url, {
        opacity,
        zIndex: 450,
        maxZoom: 18,
        maxNativeZoom: RADAR_MAX_NATIVE_ZOOM,
        tileSize: 512,
        zoomOffset: -1,
        updateWhenIdle: true,
        keepBuffer: 2,
        className: "radar-tiles",
        attribution: `Radar <a href="${RAINVIEWER_ATTRIBUTION_URL}" target="_blank" rel="noopener noreferrer">RainViewer</a>`,
      });
      layer.addTo(map);
      layerRef.current = layer;
    } else {
      layerRef.current.setUrl(url);
      layerRef.current.setOpacity(opacity);
    }
  }, [map, url, opacity]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

/** Garantisce dimensioni corrette dopo il mount (altrimenti tile “stirate”). */
function MapReady() {
  const t = useT();
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize();
      map.setView([METEO_LAT, METEO_LON], INITIAL_ZOOM, { animate: false });
    }, 50);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

export default function MeteoRadarMap() {
  const t = useT();
  const [data, setData] = useState<RadarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(0.65);
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
    }, 900);
    return () => window.clearInterval(id);
  }, [playing, frames.length]);

  useEffect(() => {
    if (frames.length === 0) return;
    setIndex((i) => Math.min(i, frames.length - 1));
  }, [frames.length]);

  const current = frames[index] ?? null;

  const toggleClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition ${
      active
        ? "bg-[var(--pa-primary)] text-white"
        : "bg-[var(--pa-surface-soft)] text-[var(--pa-ink)] hover:bg-[color-mix(in_srgb,var(--pa-primary)_12%,white)]"
    }`;

  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Radar precipitazioni")}
          icon={CloudRain}
          className="mb-2"
          actions={
            <>
              <button
                type="button"
                className={toggleClass(layer === "radar")}
                style={layer === "radar" ? { color: "#ffffff" } : undefined}
                onClick={() => {
                  setLayer("radar");
                  setPlaying(false);
                }}
              >
                Radar
              </button>
              <button
                type="button"
                className={toggleClass(layer === "infrared")}
                style={layer === "infrared" ? { color: "#ffffff" } : undefined}
                onClick={() => {
                  setLayer("infrared");
                  setPlaying(false);
                }}
                disabled={!data?.infrared?.length}
              >
                Satellite IR
              </button>
              <SolidButton
                onClick={() => setPlaying((p) => !p)}
                disabled={frames.length < 2}
              >
                {playing ? "Pausa" : "Play"}
              </SolidButton>
            </>
          }
        />
        <label className="flex items-center gap-2 text-xs text-[var(--pa-muted)]">
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
          <LoadingBlock label={t("Caricamento frame radar…")} />
        </div>
      ) : null}

      {data && frames.length === 0 ? (
        <div className="p-4">
          <DataUnavailable message={t("Nessun frame disponibile per questo layer.")} />
        </div>
      ) : null}

      {data && frames.length > 0 ? (
        <>
          <div className="relative isolate h-[480px] w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:z-0 [&_.radar-tiles]:!image-rendering-auto">
            <MapContainer
              center={MAP_CENTER}
              zoom={INITIAL_ZOOM}
              minZoom={5}
              maxZoom={16}
              scrollWheelZoom
              doubleClickZoom
              dragging
              touchZoom
              zoomControl
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <MapReady />
              <TileLayer
                attribution={`&copy; <a href="${OSM_COPYRIGHT_URL}">OpenStreetMap</a> · <a href="https://carto.com/">CARTO</a>`}
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
                detectRetina
              />
              <RadarTileUpdater url={current?.tileUrl ?? null} opacity={opacity} />
              <CircleMarker
                center={[METEO_LAT, METEO_LON]}
                radius={9}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#0066CC",
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>San Vincenzo — punto meteo di riferimento</Popup>
              </CircleMarker>
            </MapContainer>
          </div>

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
                Zoom rotella/pinch · radar nativo fino a z{RADAR_MAX_NATIVE_ZOOM} ·{" "}
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
