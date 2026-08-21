"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  ALLERTA_METEO_SV_PAGE_URL,
  CFR_TOSCANA_URL,
  COMUNE_NOME,
  DPC_ALLERTAMENTO_URL,
  REGIONE_TOSCANA_ALLERTA_URL,
} from "@/lib/constants";
import { useT } from "@/lib/i18n";
import {
  DataUnavailable,
  LoadingBlock,
  OutlineLink,
  SolidLink,
} from "@/components/ui";

type DayNorm = {
  colore: string;
  descrizione: string;
  livello: number;
  attiva: boolean;
  dettagli: {
    idraulico: string | null;
    temporali: string | null;
    idrogeologico: string | null;
    vento?: string | null;
    mareggiate?: string | null;
    neve?: string | null;
    ghiaccio?: string | null;
  };
  rischi_attivi?: string[];
};

type AllertePayload = {
  comune?: string;
  zona?: string;
  oggi?: DayNorm;
  domani?: DayNorm;
  bollettino?: {
    data?: string | null;
    ora?: string | null;
    label_oggi?: string | null;
    label_domani?: string | null;
    link_pdf?: string | null;
  };
  has_alert?: boolean;
  note?: string;
  error?: string;
};

function colorStyles(colore: string): {
  border: string;
  bg: string;
  text: string;
  badge: string;
} {
  switch (colore) {
    case "giallo":
      return {
        border: "border-[#E6B800]",
        bg: "bg-[#fff8e1]",
        text: "text-[#7a5c00]",
        badge: "bg-[#E6B800] text-[#1a1400]",
      };
    case "arancione":
      return {
        border: "border-[#CC7A00]",
        bg: "bg-[#fff1e0]",
        text: "text-[#7a3d00]",
        badge: "bg-[#CC7A00] text-white",
      };
    case "rosso":
      return {
        border: "border-[#D9364F]",
        bg: "bg-[#fdecef]",
        text: "text-[#8a1528]",
        badge: "bg-[#D9364F] text-white",
      };
    default:
      return {
        border: "border-[#008758]",
        bg: "bg-[#eef9f3]",
        text: "text-[#0b4d32]",
        badge: "bg-[#008758] text-white",
      };
  }
}

function DayCard({
  title,
  day,
}: {
  title: string;
  day: DayNorm | undefined;
}) {
  const t = useT();
  if (!day) return null;
  const styles = colorStyles(day.colore);
  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-3 sm:p-4`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className={`m-0 text-sm font-bold sm:text-base ${styles.text}`}>
          {title}
        </h4>
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${styles.badge}`}
        >
          {day.descrizione}
        </span>
      </div>
      <dl className="m-0 grid gap-1.5 text-xs sm:text-sm">
        {(
          [
            [t("Idraulico"), day.dettagli.idraulico],
            [t("Temporali"), day.dettagli.temporali],
            [t("Idrogeologico"), day.dettagli.idrogeologico],
            [t("Vento"), day.dettagli.vento],
            [t("Mareggiate"), day.dettagli.mareggiate],
            [t("Neve"), day.dettagli.neve],
            [t("Ghiaccio"), day.dettagli.ghiaccio],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold text-[var(--pa-ink)]">{label}</dt>
            <dd className="m-0 text-[var(--pa-muted)]">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Sezione allerte DPC + Regione Toscana per San Vincenzo (zona E2 / Etruria-Costa Nord). */
export function AllerteMeteoPanel() {
  const t = useT();
  const [data, setData] = useState<AllertePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meteo/allerte?_=${Date.now()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as AllertePayload;
      if (!res.ok) throw new Error(json.error || "fetch failed");
      setData(json);
    } catch {
      setError("Impossibile caricare le allerte Protezione Civile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasAlert = Boolean(data?.has_alert);

  return (
    <div
      className={`mb-4 panel overflow-hidden p-0 ${
        hasAlert ? "border-[#CC7A00]" : ""
      }`}
    >
      <div className="border-b border-[var(--pa-border)] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)] sm:text-lg">
              {hasAlert ? (
                <AlertTriangle
                  size={20}
                  className="shrink-0 text-[#CC7A00]"
                  aria-hidden
                />
              ) : (
                <ShieldAlert
                  size={20}
                  className="shrink-0 text-[var(--pa-primary)]"
                  aria-hidden
                />
              )}
              {t("Allerte meteo")}
            </h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {COMUNE_NOME}
              {data?.zona ? ` · ${t("Zona")} ${data.zona}` : ""}
              {data?.bollettino?.data
                ? ` · ${t("Bollettino")} ${data.bollettino.data}${
                    data.bollettino.ora ? ` ${data.bollettino.ora}` : ""
                  }`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SolidLink href={REGIONE_TOSCANA_ALLERTA_URL}>
              {t("Allerta Toscana")}
            </SolidLink>
            <OutlineLink href={ALLERTA_METEO_SV_PAGE_URL}>
              {t("Dettaglio comune")}
            </OutlineLink>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4">
        {loading && !data ? (
          <LoadingBlock label={t("Caricamento allerte…")} />
        ) : null}
        {error ? <DataUnavailable message={error} /> : null}

        {data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DayCard
              title={data.bollettino?.label_oggi ?? t("Oggi")}
              day={data.oggi}
            />
            <DayCard
              title={data.bollettino?.label_domani ?? t("Domani")}
              day={data.domani}
            />
          </div>
        ) : null}

        {data?.note ? (
          <p className="mb-0 mt-3 text-[11px] text-[var(--pa-muted)] sm:text-xs">
            {data.note}{" "}
            <a
              href={CFR_TOSCANA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              CFR Toscana
            </a>
            {" · "}
            <a
              href={DPC_ALLERTAMENTO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              DPC
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
