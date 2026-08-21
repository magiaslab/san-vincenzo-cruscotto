"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Bike, Download, Footprints } from "lucide-react";
import { isFeatureEnabled } from "@/lib/comune-config";
import {
  WAYMARKED_CYCLING_URL,
  WAYMARKED_HIKING_URL,
  type PercorsiData,
  type Percorso,
  type PercorsoTipo,
  percorsoColor,
} from "@/lib/percorsi";
import { useOpenData } from "@/lib/use-open-data";
import { useT } from "@/lib/i18n";
import { formatDecimal, formatInteger } from "@/lib/format";
import {
  KpiCard,
  LoadingBlock,
  OutlineLink,
  PanelHeading,
  SolidLink,
  valueOrMissing,
} from "@/components/ui";
import { PanelState } from "@/components/panel-state";

const PercorsiMap = dynamic(
  () => import("@/components/PercorsiMap").then((m) => m.PercorsiMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento mappa percorsi…" />,
  },
);

type Filtro = "tutti" | PercorsoTipo;

function labelTipo(tipo: PercorsoTipo, t: (s: string) => string): string {
  switch (tipo) {
    case "bicycle":
      return t("Ciclabile");
    case "mtb":
      return t("MTB");
    case "hiking":
      return t("Sentiero");
    default:
      return t("Pedonale");
  }
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function coordsToTrkseg(coords: number[][]): string {
  return coords
    .map(
      ([lon, lat]) =>
        `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`,
    )
    .join("\n");
}

function featureToGpx(
  nome: string,
  geometry: PercorsiData["geojson"]["features"][number]["geometry"],
): string {
  const segs =
    geometry.type === "LineString"
      ? [geometry.coordinates as number[][]]
      : (geometry.coordinates as number[][][]);
  const trk = segs
    .filter((s) => s.length >= 2)
    .map((s) => `    <trkseg>\n${coordsToTrkseg(s)}\n    </trkseg>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Cruscotto" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(nome)}</name>
${trk}
  </trk>
</gpx>
`;
}

function downloadGpx(percorso: Percorso, data: PercorsiData) {
  const feat = data.geojson.features.find((f) => f.id === percorso.id);
  if (!feat) {
    window.open(percorso.gpx_url, "_blank", "noopener,noreferrer");
    return;
  }
  const xml = featureToGpx(percorso.nome, feat.geometry);
  const blob = new Blob([xml], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${percorso.nome.replace(/[^\w\-]+/g, "_").slice(0, 60)}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PercorsiPanel() {
  const t = useT();
  const state = useOpenData<PercorsiData>("/api/percorsi");
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = state.data?.percorsi ?? [];
    const query = q.trim().toLowerCase();
    return list.filter((p) => {
      if (filtro !== "tutti" && p.tipo !== filtro) return false;
      if (!query) return true;
      return (
        p.nome.toLowerCase().includes(query) ||
        (p.ref ?? "").toLowerCase().includes(query) ||
        (p.rete ?? "").toLowerCase().includes(query)
      );
    });
  }, [state.data, filtro, q]);

  const filteredGeo = useMemo(() => {
    if (!state.data) {
      return { type: "FeatureCollection" as const, features: [] };
    }
    const ids = new Set(filtered.map((p) => p.id));
    return {
      type: "FeatureCollection" as const,
      features: state.data.geojson.features.filter((f) => ids.has(String(f.id))),
    };
  }, [state.data, filtered]);

  if (!isFeatureEnabled("ciclabili_pedonali")) return null;

  return (
    <section id="percorsi" className="mb-6">
      <div className="panel overflow-hidden p-0">
        <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
          <PanelHeading
            title={t("Percorsi ciclabili e pedonali")}
            description={t(
              "Relazioni OpenStreetMap (piste, MTB, sentieri CAI) nel territorio comunale. Lista, mappa e GPX. Fonte volontaria: può essere incompleta.",
            )}
            icon={Bike}
            className="mb-0"
            actions={
              <>
                <SolidLink href={WAYMARKED_CYCLING_URL}>Waymarked Cycling</SolidLink>
                <OutlineLink href={WAYMARKED_HIKING_URL}>
                  Waymarked Hiking
                </OutlineLink>
              </>
            }
          />
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <PanelState
            state={state}
            title={t("Percorsi non disponibili")}
            emptyHint={t(
              "Nessun percorso OSM nel bbox comunale. Puoi spegnere il modulo con features.ciclabili_pedonali, o aggiungere relazioni su OpenStreetMap.",
            )}
            loadingLabel={t("Caricamento percorsi…")}
          >
            {(data) => (
              <>
                <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <KpiCard
                    label={t("Percorsi")}
                    value={valueOrMissing(data.kpi.n_totale, formatInteger)}
                    icon={Bike}
                    variant="info"
                  />
                  <KpiCard
                    label={t("Ciclabili")}
                    value={valueOrMissing(data.kpi.n_ciclo, formatInteger)}
                    icon={Bike}
                    variant="success"
                  />
                  <KpiCard
                    label={t("MTB")}
                    value={valueOrMissing(data.kpi.n_mtb, formatInteger)}
                  />
                  <KpiCard
                    label={t("Sentieri / pedonali")}
                    value={valueOrMissing(data.kpi.n_pedo, formatInteger)}
                    icon={Footprints}
                  />
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["tutti", t("Tutti")],
                      ["bicycle", t("Ciclabili")],
                      ["mtb", t("MTB")],
                      ["hiking", t("Sentieri")],
                      ["foot", t("Pedonali")],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFiltro(id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        filtro === id
                          ? "bg-[var(--pa-primary)] text-white"
                          : "bg-[var(--pa-surface-soft)] text-[var(--pa-ink)] hover:bg-[#e8f2fc]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <label className="ml-auto min-w-[12rem] flex-1 sm:max-w-xs">
                    <span className="sr-only">{t("Cerca percorso")}</span>
                    <input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("Cerca per nome o ref…")}
                      className="w-full rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="mb-4 overflow-hidden rounded-lg border border-[var(--pa-border)]">
                  {filteredGeo.features.length > 0 ? (
                    <PercorsiMap
                      geojson={filteredGeo}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
                  ) : (
                    <p className="m-0 px-4 py-6 text-sm text-[var(--pa-muted)]">
                      {t("Nessun percorso corrisponde al filtro.")}
                    </p>
                  )}
                  <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
                    {t("Legenda")}:{" "}
                    <span className="font-semibold text-[#008758]">
                      {t("ciclabili")}
                    </span>
                    {" · "}
                    <span className="font-semibold text-[#117A65]">MTB</span>
                    {" · "}
                    <span className="font-semibold text-[#5B2C6F]">
                      {t("sentieri")}
                    </span>
                  </p>
                </div>

                <ul className="m-0 max-h-[28rem] list-none space-y-2 overflow-y-auto p-0">
                  {filtered.map((p) => {
                    const active = p.id === selectedId;
                    return (
                      <li key={p.id}>
                        <div
                          className={`rounded-lg border px-3 py-2.5 ${
                            active
                              ? "border-[var(--pa-primary)] bg-[var(--pa-surface-soft)]"
                              : "border-[var(--pa-border)] bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(p.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span
                                className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                                style={{ background: percorsoColor(p.tipo) }}
                                aria-hidden
                              />
                              <strong className="text-sm text-[var(--pa-ink)]">
                                {p.nome}
                              </strong>
                              <span className="mt-0.5 block text-xs text-[var(--pa-muted)]">
                                {labelTipo(p.tipo, t)}
                                {p.ref ? ` · ${p.ref}` : ""}
                                {p.rete ? ` · ${p.rete}` : ""}
                                {p.distanza_km != null
                                  ? ` · ${formatDecimal(p.distanza_km, 1)} km`
                                  : ""}
                              </span>
                            </button>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => downloadGpx(p, data)}
                                className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[var(--pa-border)] px-2.5 text-xs font-semibold text-[var(--pa-ink)] hover:border-[var(--pa-primary)]"
                              >
                                <Download size={14} aria-hidden />
                                GPX
                              </button>
                              <OutlineLink href={p.osm_url}>OSM</OutlineLink>
                              {p.waymarked_url ? (
                                <OutlineLink href={p.waymarked_url}>
                                  Waymarked
                                </OutlineLink>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </PanelState>
        </div>
      </div>
    </section>
  );
}
