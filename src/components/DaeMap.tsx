"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HeartPulse } from "lucide-react";
import {
  DAE_GEOJSON_PATH,
  DAE_SEGNALAZIONI_API,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OPENAEDMAP_URL,
  OSM_COPYRIGHT_URL,
  TELEGRAM_DAE_BOT_HANDLE,
  TELEGRAM_DAE_BOT_URL,
} from "@/lib/constants";
import {
  DataUnavailable,
  LoadingBlock,
  PanelHeading,
  SolidLink,
} from "@/components/ui";

type GeoFeature = {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
  meta?: Record<string, unknown>;
};

function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
  }, [map, points]);
  return null;
}

/** Mappa DAE (defibrillatori) da GeoJSON locale (export OpenAEDMap / OSM) + segnalazioni. */
export function DaeMap() {
  const t = useT();
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [segnalazioni, setSegnalazioni] = useState<FeatureCollection | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(DAE_GEOJSON_PATH).then((r) => {
        if (!r.ok) throw new Error("dae");
        return r.json() as Promise<FeatureCollection>;
      }),
      fetch(DAE_SEGNALAZIONI_API)
        .then((r) => (r.ok ? (r.json() as Promise<FeatureCollection>) : null))
        .catch(() => null),
    ])
      .then(([json, seg]) => {
        if (cancelled) return;
        setData(json);
        if (seg) setSegnalazioni(seg);
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare la mappa DAE");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const points = useMemo(() => {
    const pts: [number, number][] = [];
    for (const f of data?.features ?? []) {
      if (f.geometry?.type !== "Point") continue;
      const [lon, lat] = f.geometry.coordinates;
      if (typeof lat === "number" && typeof lon === "number") pts.push([lat, lon]);
    }
    for (const f of segnalazioni?.features ?? []) {
      if (f.geometry?.type !== "Point") continue;
      const [lon, lat] = f.geometry.coordinates;
      if (typeof lat === "number" && typeof lon === "number") pts.push([lat, lon]);
    }
    return pts;
  }, [data, segnalazioni]);

  const count = data?.features.length ?? 0;
  const segCount = segnalazioni?.features.length ?? 0;
  const hasMap = points.length > 0;

  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Mappa DAE (defibrillatori)")}
          description={
            segCount > 0
              ? t(
                  "{n} defibrillatori georeferenziati nel territorio comunale (+ {s} segnalazioni cittadine). In emergenza chiama sempre il 118.",
                )
                  .replace("{n}", String(count))
                  .replace("{s}", String(segCount))
              : t(
                  "{n} defibrillatori georeferenziati nel territorio comunale. In emergenza chiama sempre il 118.",
                ).replace("{n}", String(count))
          }
          icon={HeartPulse}
          actions={
            <SolidLink href={OPENAEDMAP_URL}>OpenAEDMap</SolidLink>
          }
          className="mb-0"
        />
      </div>
      <div className="relative z-0 h-[320px] w-full overflow-hidden sm:h-[400px]">
        {loading ? <LoadingBlock label={t("Caricamento mappa DAE…")} /> : null}
        {error ? (
          <div className="p-4">
            <DataUnavailable message={t(error)} />
          </div>
        ) : null}
        {!loading && !error && !hasMap ? (
          <div className="p-4">
            <DataUnavailable
              message={t(
                "Nessun DAE georeferenziato su OpenStreetMap in quest’area.",
              )}
            />
          </div>
        ) : null}
        {!loading && !error && hasMap ? (
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-full w-full"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitPoints points={points} />
            {(data?.features ?? []).map((f, i) => {
              const [lon, lat] = f.geometry.coordinates;
              const nome = String(f.properties.nome ?? "DAE");
              const ubicazione = String(f.properties.ubicazione ?? "");
              const orari = String(f.properties.orari ?? "");
              const accesso = String(f.properties.accesso ?? "");
              const operatore = String(f.properties.operatore ?? "");
              const immagine = String(f.properties.immagine ?? "");
              const osmUrl = String(f.properties.osm_url ?? "");
              return (
                <CircleMarker
                  key={`dae-${String(f.properties.osm_id ?? i)}`}
                  center={[lat, lon]}
                  radius={10}
                  pathOptions={{
                    color: "#D9364F",
                    fillColor: "#D9364F",
                    fillOpacity: 0.88,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <strong>{nome}</strong>
                    <br />
                    {t("Defibrillatore automatico esterno (DAE)")}
                    {ubicazione ? (
                      <>
                        <br />
                        {ubicazione}
                      </>
                    ) : null}
                    {operatore ? (
                      <>
                        <br />
                        {operatore}
                      </>
                    ) : null}
                    {accesso ? (
                      <>
                        <br />
                        {t("Accesso")}: {accesso}
                      </>
                    ) : null}
                    {orari ? (
                      <>
                        <br />
                        {t("Orari")}: {orari}
                      </>
                    ) : null}
                    {immagine ? (
                      <>
                        <br />
                        <a href={immagine} target="_blank" rel="noopener noreferrer">
                          Foto
                        </a>
                      </>
                    ) : null}
                    {osmUrl ? (
                      <>
                        <br />
                        <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                          OpenStreetMap
                        </a>
                      </>
                    ) : null}
                  </Popup>
                </CircleMarker>
              );
            })}
            {(segnalazioni?.features ?? []).map((f, i) => {
              const [lon, lat] = f.geometry.coordinates;
              const nome = String(f.properties.nome ?? "Segnalazione DAE");
              const ubicazione = String(f.properties.ubicazione ?? "");
              return (
                <CircleMarker
                  key={`seg-${String(f.properties.id ?? i)}`}
                  center={[lat, lon]}
                  radius={9}
                  pathOptions={{
                    color: "#0066CC",
                    fillColor: "#0066CC",
                    fillOpacity: 0.75,
                    weight: 1,
                    dashArray: "2 4",
                  }}
                >
                  <Popup>
                    <strong>{nome}</strong>
                    <br />
                    {t("Segnalazione cittadina (in attesa di OSM)")}
                    {ubicazione ? (
                      <>
                        <br />
                        {ubicazione}
                      </>
                    ) : null}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : null}
      </div>
      <div className="border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3">
        <p className="m-0 text-sm text-[var(--pa-ink)]">
          {t(
            "Manca un defibrillatore sulla mappa? Puoi segnalarlo: i dati finiscono su OpenStreetMap e aggiornano anche OpenAEDMap.",
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <SolidLink href={`${TELEGRAM_DAE_BOT_URL}?start=sanita`}>
            {t("Segnala un DAE su Telegram")}
          </SolidLink>
          <SolidLink href={OPENAEDMAP_URL}>
            {t("Aggiungi su OpenAEDMap")}
          </SolidLink>
        </div>
        <p className="m-0 mt-2 text-xs text-[var(--pa-muted)]">
          {t(
            "Fonte volontaria OpenStreetMap (può essere incompleta rispetto al censimento 118). Mappa globale:",
          )}{" "}
          <a
            href={OPENAEDMAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            OpenAEDMap
          </a>
          {" · "}
          <a
            href={OSM_COPYRIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            OpenStreetMap
          </a>
          {" · "}
          <a
            href={TELEGRAM_DAE_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            {TELEGRAM_DAE_BOT_HANDLE}
          </a>
        </p>
      </div>
    </div>
  );
}
