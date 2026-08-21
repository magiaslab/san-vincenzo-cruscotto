"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CloudSun,
  Droplets,
  Fuel,
  MapPin,
  Phone,
  Pill,
  Thermometer,
  Train,
  Wind,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { TRASPORTI_TRENI_LIVE_API } from "@/lib/constants";
import { matchesComuneNome } from "@/lib/comune-config";
import { formatDecimal } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { TrenoBoardRow } from "@/lib/viaggiatreno";

type NavId = "sanita" | "infra" | "meteo";

type FarmaciaTurno = {
  nome: string;
  indirizzo: string;
  comune: string;
  apertura: string;
  turno: string;
  distanza_km: number | null;
  telefono: string | null;
};

type TurnoResponse = {
  giorno?: string | null;
  orario_riferimento?: string | null;
  farmacie?: FarmaciaTurno[];
  error?: string;
};

type TreniLive = {
  partenze?: TrenoBoardRow[];
  arrivi?: TrenoBoardRow[];
  station_name?: string;
  error?: string;
};

type CarburantiDetail = {
  carburanti?: {
    kpi?: {
      n_impianti?: number;
      prezzo_medio?: Record<string, number>;
      prezzo_min?: Record<string, number>;
    };
    punti?: Array<{
      name?: string;
      brand?: string;
      indirizzo?: string;
      prezzi?: Record<string, number | null | undefined>;
    }>;
  };
};

type MeteoSummary = {
  temp_c: number | null;
  feels_c: number | null;
  humidity_pct: number | null;
  wind_kmh: number | null;
  description: string | null;
  source: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h % 24) * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function formatRitardo(
  min: number | null | undefined,
  t: (s: string) => string,
): { label: string; tone: "ok" | "late" | "muted" } {
  if (min == null || !Number.isFinite(min)) {
    return { label: "—", tone: "muted" };
  }
  if (min <= 0) {
    return { label: t("In orario"), tone: "ok" };
  }
  return { label: `+${Math.round(min)} min`, tone: "late" };
}

function pickNextTreni(live: TreniLive | null, limit = 2): TrenoBoardRow[] {
  if (!live) return [];
  const now = nowMinutes();
  const rows = [...(live.partenze ?? []), ...(live.arrivi ?? [])].filter(
    (r) => !r.soppresso && !r.arrivato && r.orario,
  );
  return rows
    .map((d) => ({ d, mins: timeToMinutes(d.orario) }))
    .filter((x) => x.mins != null)
    .sort((a, b) => {
      const da = (((a.mins as number) - now) + 24 * 60) % (24 * 60);
      const db = (((b.mins as number) - now) + 24 * 60) % (24 * 60);
      return da - db;
    })
    .map((x) => x.d)
    .slice(0, limit);
}

function pickBestFuel(
  punti: NonNullable<NonNullable<CarburantiDetail["carburanti"]>["punti"]>,
  key: "benzina_self" | "gasolio_self",
) {
  let best: {
    price: number;
    name: string;
    brand: string;
  } | null = null;
  for (const p of punti) {
    const price = num(p.prezzi?.[key]);
    if (price == null) continue;
    if (!best || price < best.price) {
      best = {
        price,
        name: String(p.name ?? "Impianto"),
        brand: String(p.brand ?? ""),
      };
    }
  }
  return best;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "late" | "info" | "primary";
}) {
  const tones = {
    neutral:
      "border-[var(--pa-border)] bg-white text-[var(--pa-ink)]",
    ok: "border-[color-mix(in_srgb,var(--pa-success)_40%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-success)_12%,white)] text-[var(--pa-success)]",
    warn: "border-[color-mix(in_srgb,var(--pa-warning)_40%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-warning)_12%,white)] text-[var(--pa-warning)]",
    late: "border-[color-mix(in_srgb,var(--pa-danger)_40%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-danger)_12%,white)] text-[var(--pa-danger)]",
    info: "border-[color-mix(in_srgb,var(--pa-primary)_35%,var(--pa-border))] bg-[var(--pa-surface-soft)] text-[var(--pa-primary)]",
    primary:
      "border-transparent bg-[var(--pa-primary)] text-white",
  };
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function ServiceCardShell({
  title,
  icon: Icon,
  badge,
  loading,
  onOpen,
  openLabel,
  children,
  accent = "info",
}: {
  title: string;
  icon: LucideIcon;
  badge?: ReactNode;
  loading?: boolean;
  onOpen: () => void;
  openLabel: string;
  children: ReactNode;
  accent?: "info" | "ok" | "warn";
}) {
  const accentBg = {
    info: "bg-[color-mix(in_srgb,var(--pa-primary)_12%,white)] text-[var(--pa-primary)]",
    ok: "bg-[color-mix(in_srgb,var(--pa-success)_12%,white)] text-[var(--pa-success)]",
    warn: "bg-[color-mix(in_srgb,var(--pa-warning)_12%,white)] text-[var(--pa-warning)]",
  }[accent];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[11.5rem] flex-col rounded-xl border border-[var(--pa-border)] bg-white p-3.5 text-left shadow-sm transition hover:border-[var(--pa-primary)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-primary)] sm:min-h-[12.5rem] sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentBg}`}
            aria-hidden
          >
            <Icon size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold leading-tight text-[var(--pa-ink)] sm:text-base">
              {title}
            </p>
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        {loading ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--pa-surface-soft)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--pa-surface-soft)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--pa-surface-soft)]" />
          </div>
        ) : (
          children
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--pa-primary)]">
        <span>{openLabel}</span>
        <ArrowRight
          size={14}
          className="transition group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </button>
  );
}

export function ServiziUtiliCards({
  onNavigate,
  meteoFallback,
}: {
  onNavigate: (id: NavId) => void;
  /** KPI ItaliaMeteo già disponibile lato server (fallback). */
  meteoFallback?: Record<string, unknown> | null;
}) {
  const t = useT();
  const [farmacie, setFarmacie] = useState<TurnoResponse | null>(null);
  const [treni, setTreni] = useState<TreniLive | null>(null);
  const [carburanti, setCarburanti] = useState<CarburantiDetail | null>(null);
  const [meteo, setMeteo] = useState<MeteoSummary | null>(null);
  const [loading, setLoading] = useState({
    farmacie: true,
    treni: true,
    carburanti: true,
    meteo: true,
  });

  const meteoFallbackRef = useRef(meteoFallback);
  meteoFallbackRef.current = meteoFallback;

  useEffect(() => {
    let cancelled = false;
    const stamp = Date.now();

    function fromKpiLike(
      raw: Record<string, unknown> | null | undefined,
      source: string,
    ): MeteoSummary | null {
      if (!raw) return null;
      const stats =
        asRecord(raw.osservazione) ?? asRecord(raw.corrente) ?? raw;
      const temp = num(stats.t2m_c);
      if (temp == null && !stats.ww_desc) return null;
      return {
        temp_c: temp,
        feels_c: null,
        humidity_pct: num(stats.umidita_pct),
        wind_kmh: num(stats.vento_kmh),
        description: stats.ww_desc ? String(stats.ww_desc) : null,
        source,
      };
    }

    void (async () => {
      try {
        const res = await fetch(`/api/farmacie/turno?_=${stamp}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as TurnoResponse;
        if (!cancelled) setFarmacie(json);
      } catch {
        if (!cancelled) setFarmacie({ farmacie: [], error: "fail" });
      } finally {
        if (!cancelled) {
          setLoading((s) => ({ ...s, farmacie: false }));
        }
      }
    })();

    void (async () => {
      try {
        const res = await fetch(`${TRASPORTI_TRENI_LIVE_API}?_=${stamp}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as TreniLive;
        if (!cancelled) setTreni(json);
      } catch {
        if (!cancelled) setTreni({ partenze: [], arrivi: [], error: "fail" });
      } finally {
        if (!cancelled) setLoading((s) => ({ ...s, treni: false }));
      }
    })();

    void (async () => {
      try {
        const res = await fetch(
          `/api/dettaglio?sezioni=${encodeURIComponent("carburanti")}&_=${stamp}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as CarburantiDetail;
        if (!cancelled) setCarburanti(json);
      } catch {
        if (!cancelled) setCarburanti(null);
      } finally {
        if (!cancelled) setLoading((s) => ({ ...s, carburanti: false }));
      }
    })();

    void (async () => {
      try {
        const [fcRes, kpiRes] = await Promise.all([
          fetch(`/api/meteo/forecast?_=${stamp}`, { cache: "no-store" }),
          fetch(`/api/meteo?_=${stamp}`, { cache: "no-store" }),
        ]);
        let summary: MeteoSummary | null = null;

        if (fcRes.ok) {
          const fc = await fcRes.json();
          const cur = asRecord(fc.current);
          if (cur) {
            summary = {
              temp_c: num(cur.temperature_2m),
              feels_c: num(cur.apparent_temperature),
              humidity_pct: num(cur.relative_humidity_2m),
              wind_kmh: num(cur.wind_speed_10m),
              description: cur.weather_desc
                ? String(cur.weather_desc)
                : null,
              source: "Open-Meteo",
            };
          }
        }

        if ((!summary || summary.temp_c == null) && kpiRes.ok) {
          const body = await kpiRes.json();
          summary =
            fromKpiLike(asRecord(body.meteo) ?? asRecord(body), "ItaliaMeteo") ??
            summary;
        }

        if (!summary) {
          summary = fromKpiLike(meteoFallbackRef.current, "ItaliaMeteo");
        }

        if (!cancelled) setMeteo(summary);
      } catch {
        if (!cancelled) {
          setMeteo(fromKpiLike(meteoFallbackRef.current, "ItaliaMeteo"));
        }
      } finally {
        if (!cancelled) setLoading((s) => ({ ...s, meteo: false }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const farmacia = useMemo(() => {
    const list = Array.isArray(farmacie?.farmacie) ? farmacie.farmacie : [];
    if (!list.length) return null;
    const locali = list.filter((f) => matchesComuneNome(f.comune));
    return (locali[0] ?? list[0]) || null;
  }, [farmacie]);

  const nextTreni = useMemo(() => pickNextTreni(treni, 2), [treni]);

  const punti = useMemo(
    () => carburanti?.carburanti?.punti ?? [],
    [carburanti],
  );
  const bestBenzina = useMemo(
    () => pickBestFuel(punti, "benzina_self"),
    [punti],
  );
  const bestGasolio = useMemo(
    () => pickBestFuel(punti, "gasolio_self"),
    [punti],
  );
  const nImpianti = carburanti?.carburanti?.kpi?.n_impianti ?? null;

  return (
    <section className="mb-5" aria-labelledby="servizi-utili-heading">
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3
            id="servizi-utili-heading"
            className="m-0 text-sm font-bold text-[var(--pa-ink)] sm:text-base"
          >
            {t("Servizi utili adesso")}
          </h3>
          <p className="m-0 mt-0.5 text-xs text-[var(--pa-muted)] sm:text-sm">
            {t(
              "Dati live con link alle schede di dettaglio: farmacia, treni, carburanti e meteo.",
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ServiceCardShell
          title={t("Farmacia di turno")}
          icon={Pill}
          accent="ok"
          loading={loading.farmacie}
          onOpen={() => onNavigate("sanita")}
          openLabel={t("Apri Sanità")}
          badge={
            farmacia ? <Badge tone="ok">{t("Di turno")}</Badge> : undefined
          }
        >
          {farmacia ? (
            <div>
              <p className="m-0 text-lg font-bold leading-tight text-[var(--pa-ink)]">
                {farmacia.nome}
              </p>
              <p className="m-0 mt-1.5 flex items-start gap-1.5 text-xs text-[var(--pa-muted)] sm:text-sm">
                <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  {farmacia.indirizzo}
                  {farmacia.comune ? ` · ${farmacia.comune}` : ""}
                  {farmacia.distanza_km != null
                    ? ` · ${formatDecimal(farmacia.distanza_km, 1)} km`
                    : ""}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {farmacia.turno ? (
                  <Badge tone="info">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} aria-hidden />
                      {farmacia.turno}
                    </span>
                  </Badge>
                ) : null}
                {farmacia.apertura ? (
                  <Badge tone="neutral">{farmacia.apertura}</Badge>
                ) : null}
              </div>
              {farmacia.telefono ? (
                <p className="m-0 mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--pa-ink)]">
                  <Phone size={13} aria-hidden />
                  {farmacia.telefono}
                </p>
              ) : null}
              {farmacie?.giorno ? (
                <p className="m-0 mt-1 text-[11px] text-[var(--pa-muted)]">
                  {farmacie.giorno}
                  {farmacie.orario_riferimento
                    ? ` · ${t("ore")} ${farmacie.orario_riferimento}`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t("Turno non disponibile al momento.")}
            </p>
          )}
        </ServiceCardShell>

        <ServiceCardShell
          title={t("Prossimi treni")}
          icon={Train}
          accent="info"
          loading={loading.treni}
          onOpen={() => onNavigate("infra")}
          openLabel={t("Apri Mobilità")}
          badge={<Badge tone="info">{t("Live FS")}</Badge>}
        >
          {nextTreni.length ? (
            <ul className="m-0 list-none space-y-2 p-0">
              {nextTreni.map((row, i) => {
                const rit = formatRitardo(row.ritardo_min, t);
                return (
                  <li
                    key={`${row.kind}-${row.numero}-${row.orario}-${i}`}
                    className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)]/60 px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge
                          tone={row.kind === "partenze" ? "primary" : "neutral"}
                        >
                          {row.kind === "partenze"
                            ? t("Partenza")
                            : t("Arrivo")}
                        </Badge>
                        <span className="text-base font-bold tabular-nums text-[var(--pa-ink)]">
                          {row.orario?.slice(0, 5) ?? "—"}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-bold ${
                          rit.tone === "ok"
                            ? "text-[var(--pa-success)]"
                            : rit.tone === "late"
                              ? "text-[var(--pa-danger)]"
                              : "text-[var(--pa-muted)]"
                        }`}
                      >
                        {rit.label}
                      </span>
                    </div>
                    <p className="m-0 mt-1 truncate text-xs text-[var(--pa-muted)] sm:text-sm">
                      <span className="font-semibold text-[var(--pa-ink)]">
                        {row.categoria ? `${row.categoria} ` : ""}
                        {row.numero}
                      </span>
                      {row.verso ? ` · ${row.verso}` : ""}
                      {row.binario ? ` · ${t("bin.")} ${row.binario}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t("Nessun treno imminente da S.Vincenzo.")}
            </p>
          )}
        </ServiceCardShell>

        <ServiceCardShell
          title={t("Miglior prezzo carburanti")}
          icon={Fuel}
          accent="warn"
          loading={loading.carburanti}
          onOpen={() => onNavigate("infra")}
          openLabel={t("Apri Mobilità")}
          badge={<Badge tone="ok">{t("Miglior prezzo")}</Badge>}
        >
          {bestBenzina || bestGasolio ? (
            <div className="space-y-2.5">
              {bestBenzina ? (
                <div className="rounded-lg border border-[color-mix(in_srgb,var(--pa-success)_30%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-success)_6%,white)] px-2.5 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
                      {t("Benzina self")}
                    </span>
                    <span className="text-xl font-bold tabular-nums text-[var(--pa-success)]">
                      {formatDecimal(bestBenzina.price, 3)}{" "}
                      <span className="text-sm font-semibold">€/L</span>
                    </span>
                  </div>
                  <p className="m-0 mt-1 truncate text-xs text-[var(--pa-ink)] sm:text-sm">
                    {[bestBenzina.brand, bestBenzina.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ) : null}
              {bestGasolio ? (
                <div className="rounded-lg border border-[var(--pa-border)] bg-white px-2.5 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
                      {t("Gasolio self")}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-[var(--pa-ink)]">
                      {formatDecimal(bestGasolio.price, 3)}{" "}
                      <span className="text-sm font-semibold">€/L</span>
                    </span>
                  </div>
                  <p className="m-0 mt-1 truncate text-xs text-[var(--pa-muted)] sm:text-sm">
                    {[bestGasolio.brand, bestGasolio.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ) : null}
              {nImpianti != null ? (
                <p className="m-0 text-[11px] text-[var(--pa-muted)]">
                  {nImpianti} {t("impianti MIMIT nel comune")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t("Prezzi carburanti non disponibili.")}
            </p>
          )}
        </ServiceCardShell>

        <ServiceCardShell
          title={t("Meteo ora")}
          icon={CloudSun}
          accent="info"
          loading={loading.meteo}
          onOpen={() => onNavigate("meteo")}
          openLabel={t("Apri Meteo")}
          badge={
            meteo?.description ? (
              <Badge tone="info">
                <span className="max-w-[9rem] truncate sm:max-w-[11rem]">
                  {meteo.description}
                </span>
              </Badge>
            ) : undefined
          }
        >
          {meteo && meteo.temp_c != null ? (
            <div>
              <div className="flex items-end gap-2">
                <Thermometer
                  size={22}
                  className="mb-1 text-[var(--pa-primary)]"
                  aria-hidden
                />
                <p className="m-0 text-3xl font-bold leading-none tabular-nums text-[var(--pa-ink)] sm:text-4xl">
                  {formatDecimal(meteo.temp_c, 1)}°
                </p>
                {meteo.feels_c != null ? (
                  <p className="m-0 mb-0.5 text-xs text-[var(--pa-muted)]">
                    {t("percepita")} {formatDecimal(meteo.feels_c, 1)}°
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {meteo.humidity_pct != null ? (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-2.5 text-xs font-semibold text-[var(--pa-ink)]">
                    <Droplets size={14} aria-hidden />
                    {formatDecimal(meteo.humidity_pct, 0)}%
                  </span>
                ) : null}
                {meteo.wind_kmh != null ? (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-2.5 text-xs font-semibold text-[var(--pa-ink)]">
                    <Wind size={14} aria-hidden />
                    {formatDecimal(meteo.wind_kmh, 0)} km/h
                  </span>
                ) : null}
              </div>
              {meteo.source ? (
                <p className="m-0 mt-2 text-[11px] text-[var(--pa-muted)]">
                  {t("Fonte")}: {meteo.source}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t("Meteo non disponibile al momento.")}
            </p>
          )}
        </ServiceCardShell>
      </div>
    </section>
  );
}
