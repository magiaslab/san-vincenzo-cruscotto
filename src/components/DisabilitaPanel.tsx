"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Accessibility, ExternalLink, ParkingSquare, Toilet } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";
import type { AccessibilitaPayload, AccessPoint } from "@/lib/accessibilita";
import {
  COMUNE_STALLI_DISABILI_URL,
  ISTAT_DISABILITA_CIFRE_URL,
  WHEELMAP_URL,
  WHEELMAP_WIDGET_INFO_URL,
  isRuntsInclusione,
} from "@/lib/accessibilita";
import { AccessibilitaCompliance } from "@/components/AccessibilitaCompliance";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  OutlineLink,
  PanelHeading,
  SectionIntro,
  SolidLink,
} from "@/components/ui";
import { formatInteger } from "@/lib/format";
import WheelmapEmbed from "@/components/WheelmapEmbed";

type RuntsEnte = {
  denom?: string;
  sez?: string;
  x1000?: boolean;
  data_iscr?: string;
  rapp?: string;
};

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      window.setTimeout(() => map.invalidateSize(), 100);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [map, points]);
  return null;
}

function colorFor(p: AccessPoint): string {
  if (p.tipo === "parking_disabled") return "#0066CC";
  if (p.tipo === "toilet_accessible") return "#5B2C6F";
  if (p.wheelchair === "yes") return "#008758";
  if (p.wheelchair === "limited") return "#CC7A00";
  if (p.wheelchair === "no") return "#D9364F";
  return "#5b6f82";
}

function labelTipo(p: AccessPoint, t: (k: string) => string): string {
  if (p.tipo === "parking_disabled") return t("Stallo disabili");
  if (p.tipo === "toilet_accessible") return t("Bagno accessibile");
  if (p.wheelchair === "yes") return t("Accessibile in carrozzina");
  if (p.wheelchair === "limited") return t("Accessibilità limitata");
  if (p.wheelchair === "no") return t("Non accessibile");
  return t("Punto mappato");
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
        active
          ? "bg-[var(--pa-primary)] text-white"
          : "bg-[var(--pa-surface-soft)] text-[var(--pa-ink)] hover:bg-[#e8f2fc]"
      }`}
    >
      {children}
    </button>
  );
}

export function AccessibilitaMap({
  punti,
}: {
  punti: AccessPoint[];
}) {
  const t = useT();
  const points = useMemo(
    () => punti.map((p) => [p.lat, p.lon] as [number, number]),
    [punti],
  );

  if (punti.length === 0) {
    return (
      <DataUnavailable message={t("Nessun punto di accessibilità mappato su OSM nel raggio considerato.")} />
    );
  }

  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Mappa OSM locale (stalli, bagni, wheelchair)")}
          description={`${punti.length} ${t("punti georeferenziati nel territorio")}. ${t("Verde = accessibile, arancio = limitato, rosso = no, blu = stallo, viola = bagno.")}`}
          icon={Accessibility}
          actions={<SolidLink href={WHEELMAP_URL}>Wheelmap</SolidLink>}
          className="mb-0"
        />
      </div>
      <div className="relative isolate z-0 h-[360px] w-full overflow-hidden sm:h-[440px] [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:z-0">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapReady />
          <FitPoints points={points} />
          {punti.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lon]}
              radius={8}
              pathOptions={{
                color: colorFor(p),
                fillColor: colorFor(p),
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <strong>{p.nome || labelTipo(p, t)}</strong>
                <br />
                {labelTipo(p, t)}
                {p.categoria ? ` · ${p.categoria}` : ""}
                {p.indirizzo ? (
                  <>
                    <br />
                    {p.indirizzo}
                  </>
                ) : null}
                <br />
                <a
                  href={p.osm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  OpenStreetMap
                </a>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
        Fonte:{" "}
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
          href={WHEELMAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          Wheelmap
        </a>
      </p>
    </div>
  );
}

export default function DisabilitaPanel({
  runtsEnti = [],
}: {
  runtsEnti?: RuntsEnte[];
}) {
  const t = useT();
  const [data, setData] = useState<AccessibilitaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "tutti" | "accessibili" | "stalli" | "bagni"
  >("tutti");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/accessibilita")
      .then((r) => {
        if (!r.ok) throw new Error("accessibilita");
        return r.json() as Promise<AccessibilitaPayload>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare i dati di accessibilità");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const punti = data?.punti ?? [];
    if (filter === "accessibili") {
      return punti.filter(
        (p) => p.wheelchair === "yes" || p.wheelchair === "limited",
      );
    }
    if (filter === "stalli") {
      return punti.filter((p) => p.tipo === "parking_disabled");
    }
    if (filter === "bagni") {
      return punti.filter((p) => p.tipo === "toilet_accessible");
    }
    return punti;
  }, [data?.punti, filter]);

  const entiRilevanti = useMemo(
    () =>
      runtsEnti.filter((e) =>
        isRuntsInclusione(String(e.denom ?? ""), String(e.sez ?? "")),
      ),
    [runtsEnti],
  );

  const kpi = data?.kpi;

  return (
    <section>
      <SectionIntro
        title={t("Disabilità e accessibilità")}
        description={t(
          "Luoghi accessibili, stalli e bagni su OpenStreetMap/Wheelmap, enti del terzo settore e link ai servizi ufficiali. Dati volontari: verifica sempre sulle fonti del Comune.",
        )}
      />

      <AccessibilitaCompliance />

      {loading ? <LoadingBlock label={t("Caricamento accessibilità…")} /> : null}
      {error ? <DataUnavailable message={error} /> : null}

      {!loading && !error && kpi ? (
        <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <KpiCard
            label={t("Punti mappati OSM")}
            value={formatInteger(kpi.n_totale)}
            hint={`${t("Raggio")} ${data?.raggio_km ?? 6} km`}
            icon={Accessibility}
            variant="info"
          />
          <KpiCard
            label={t("Accessibili (wheelchair=yes)")}
            value={formatInteger(kpi.n_wheelchair_yes)}
            hint={`${formatInteger(kpi.n_wheelchair_limited)} ${t("limitati")}`}
            icon={Accessibility}
            variant="success"
          />
          <KpiCard
            label={t("Stalli disabili")}
            value={formatInteger(kpi.n_parking_disabled)}
            icon={ParkingSquare}
          />
          <KpiCard
            label={t("Bagni accessibili")}
            value={formatInteger(kpi.n_toilet_accessible)}
            icon={Toilet}
          />
        </div>
      ) : null}

      {data?.disclaimer ? (
        <p
          className="mb-4 rounded-md border border-[#f0d9a8] bg-[#fff8e8] px-3 py-2 text-xs text-[#5c4a1f] sm:text-sm"
          role="note"
        >
          <strong>{t("Disclaimer")}:</strong> {data.disclaimer}
        </p>
      ) : null}

      {process.env.NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN?.trim() ? (
        <div className="mb-4">
          <WheelmapEmbed
            embedToken={process.env.NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN.trim()}
          />
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip active={filter === "tutti"} onClick={() => setFilter("tutti")}>
          {t("Tutti")} ({data?.kpi.n_totale ?? 0})
        </FilterChip>
        <FilterChip
          active={filter === "accessibili"}
          onClick={() => setFilter("accessibili")}
        >
          {t("Accessibili")} (
          {(data?.kpi.n_wheelchair_yes ?? 0) +
            (data?.kpi.n_wheelchair_limited ?? 0)}
          )
        </FilterChip>
        <FilterChip
          active={filter === "stalli"}
          onClick={() => setFilter("stalli")}
        >
          {t("Stalli")} ({data?.kpi.n_parking_disabled ?? 0})
        </FilterChip>
        <FilterChip active={filter === "bagni"} onClick={() => setFilter("bagni")}>
          {t("Bagni")} ({data?.kpi.n_toilet_accessible ?? 0})
        </FilterChip>
      </div>

      <div className="mb-4">
        {!loading && !error ? <AccessibilitaMap punti={filtered} /> : null}
      </div>

      {!loading && !error && filtered.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
            <h3 className="m-0">{t("Elenco punti di accessibilità")}</h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {t("Filtra con i pulsanti sopra. Apri OpenStreetMap per dettagli e correzioni.")}
            </p>
          </div>
          <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">
              {t("Elenco punti di accessibilità")}
            </caption>
            <thead className="bg-[#e8f2fc]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Nome")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Tipo")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Categoria")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Indirizzo")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Link")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <strong>{p.nome || "—"}</strong>
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: colorFor(p) }}
                      aria-hidden
                    />
                    {labelTipo(p, t)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{p.categoria}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {p.indirizzo || "—"}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <a
                      href={p.osm_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--pa-primary)] underline"
                    >
                      OSM <ExternalLink size={12} aria-hidden />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="panel">
          <h3 className="m-0 mb-2">{t("Enti del terzo settore (inclusione / cura)")}</h3>
          <p className="mt-0 text-xs text-[var(--pa-muted)] sm:text-sm">
            {t(
              "Selezione euristica dagli enti RUNTS locali (es. AUSER, Misericordia, CRI, cooperative sociali). Elenco completo nel tab Società.",
            )}
          </p>
          {entiRilevanti.length === 0 ? (
            <p className="mb-0 text-sm text-[var(--pa-muted)]">
              {t("Nessun ente evidenziato con le parole chiave correnti.")}{" "}
              <Link href="/#societa" className="underline">
                {t("Apri Società")}
              </Link>
            </p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {entiRilevanti.map((e) => (
                <li
                  key={String(e.denom)}
                  className="border-b border-[#eef2f5] pb-2 last:border-0"
                >
                  <strong>{e.denom}</strong>
                  {e.sez ? (
                    <span className="text-[var(--pa-muted)]"> · {e.sez}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3 className="m-0 mb-2">{t("Servizi e fonti ufficiali")}</h3>
          <ul className="m-0 space-y-2 p-0 text-sm">
            <li>
              <SolidLink href={COMUNE_STALLI_DISABILI_URL}>
                {t("Stalli personali e sosta CUDE (Comune)")}
              </SolidLink>
            </li>
            <li>
              <OutlineLink href={WHEELMAP_URL}>Wheelmap</OutlineLink>
            </li>
            <li>
              <OutlineLink href={WHEELMAP_WIDGET_INFO_URL}>
                {t("Wheelmap Widget (embed ufficiale)")}
              </OutlineLink>
            </li>
            <li>
              <OutlineLink href={ISTAT_DISABILITA_CIFRE_URL}>
                ISTAT — Disabilità in cifre
              </OutlineLink>
            </li>
            <li>
              <OutlineLink href="https://www.openstreetmap.org/">
                OpenStreetMap — contribuisci ai dati
              </OutlineLink>
            </li>
          </ul>
          <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
            {t(
              "In programma: PEBA comunale e layer stalli ufficiali quando pubblicati come open data.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
