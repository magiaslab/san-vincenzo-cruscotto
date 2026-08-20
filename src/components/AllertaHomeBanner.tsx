"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { REGIONE_TOSCANA_ALLERTA_URL } from "@/lib/constants";
import { useT } from "@/lib/i18n";

type DayNorm = {
  colore: string;
  descrizione: string;
  attiva: boolean;
  rischi_attivi?: string[];
};

type AllertePayload = {
  zona?: string;
  oggi?: DayNorm;
  domani?: DayNorm;
  show_home_banner?: boolean;
  has_alert?: boolean;
  error?: string;
};

function bannerStyles(colore: string): {
  border: string;
  bg: string;
  text: string;
  badge: string;
} {
  switch (colore) {
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
        border: "border-[#E6B800]",
        bg: "bg-[#fff8e1]",
        text: "text-[#7a5c00]",
        badge: "bg-[#E6B800] text-[#1a1400]",
      };
  }
}

const RISK_LABELS: Record<string, string> = {
  idrogeologico: "Idrogeologico",
  idraulico: "Idraulico",
  temporali: "Temporali",
  vento: "Vento",
  mareggiate: "Mareggiate",
  neve: "Neve",
  ghiaccio: "Ghiaccio",
};

const DISMISS_KEY = "allerta-home-dismiss";

function dismissKey(oggi?: DayNorm, domani?: DayNorm): string {
  return [
    oggi?.colore ?? "",
    (oggi?.rischi_attivi ?? []).join(","),
    domani?.colore ?? "",
    (domani?.rischi_attivi ?? []).join(","),
  ].join("|");
}

/**
 * Banner in Panoramica solo per allerta gialla / arancione / rossa
 * (Regione Toscana zona E2 + DPC).
 */
export function AllertaHomeBanner({
  onOpenMeteo,
}: {
  onOpenMeteo?: () => void;
}) {
  const t = useT();
  const [data, setData] = useState<AllertePayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meteo/allerte?_=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as AllertePayload;
      setData(json);
      try {
        const key = dismissKey(json.oggi, json.domani);
        if (sessionStorage.getItem(DISMISS_KEY) === key) {
          setDismissed(true);
        } else {
          setDismissed(false);
        }
      } catch {
        /* ignore */
      }
    } catch {
      /* empty-state non bloccante */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data?.show_home_banner || dismissed) return null;

  const primary =
    data.oggi?.attiva && ["giallo", "arancione", "rosso"].includes(data.oggi.colore)
      ? data.oggi
      : data.domani?.attiva
        ? data.domani
        : null;
  if (!primary) return null;

  const styles = bannerStyles(primary.colore);
  const rischi = (primary.rischi_attivi ?? [])
    .map((r) => RISK_LABELS[r] ?? r)
    .filter(Boolean);
  const when =
    primary === data.oggi ? t("Oggi") : t("Domani");

  return (
    <aside
      role="alert"
      aria-live="polite"
      className={`mb-4 overflow-hidden rounded-lg border ${styles.border} ${styles.bg}`}
    >
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <AlertTriangle
          size={22}
          className={`mt-0.5 shrink-0 ${styles.text}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className={`text-sm sm:text-base ${styles.text}`}>
              {t("Allerta meteo")} {when}
            </strong>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}
            >
              {primary.descrizione}
            </span>
          </div>
          <p className={`mb-0 mt-1 text-xs sm:text-sm ${styles.text}`}>
            {t("San Vincenzo")}
            {data.zona ? ` · ${t("Zona")} ${data.zona}` : ""}
            {rischi.length > 0 ? ` · ${rischi.join(", ")}` : ""}
            {". "}
            {t("Consultare il bollettino ufficiale Regione Toscana.")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={REGIONE_TOSCANA_ALLERTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold text-white no-underline ${
                primary.colore === "rosso"
                  ? "bg-[#D9364F]"
                  : primary.colore === "arancione"
                    ? "bg-[#CC7A00]"
                    : "bg-[#B8860B]"
              }`}
            >
              {t("Allerta Toscana")}
            </a>
            {onOpenMeteo ? (
              <button
                type="button"
                onClick={onOpenMeteo}
                className={`inline-flex items-center rounded border bg-white/70 px-2.5 py-1 text-xs font-semibold ${styles.border} ${styles.text}`}
              >
                {t("Dettaglio meteo")}
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label={t("Chiudi")}
          className={`shrink-0 rounded p-1 ${styles.text}`}
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(
                DISMISS_KEY,
                dismissKey(data.oggi, data.domani),
              );
            } catch {
              /* ignore */
            }
          }}
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
