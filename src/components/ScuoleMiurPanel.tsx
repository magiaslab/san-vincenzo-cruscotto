"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  School,
  Users,
} from "lucide-react";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  OutlineLink,
  PanelHeading,
} from "@/components/ui";
import { MIUR_ESPLORA_URL, MIUR_OPENDATA_URL } from "@/lib/constants";
import { formatInteger, formatPercent } from "@/lib/format";
import type { MiurScuolePayload } from "@/lib/miur";

export function ScuoleMiurPanel() {
  const t = useT();
  const [data, setData] = useState<MiurScuolePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/scuole/miur", { cache: "force-cache" })
      .then(async (r) => {
        const json = (await r.json()) as MiurScuolePayload & { error?: string };
        if (!r.ok) throw new Error(json.error || "Errore caricamento");
        return json;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Dati scuole MIUR non disponibili",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingBlock label={t("Caricamento scuole da dati.istruzione.it…")} />;
  }

  if (error || !data) {
    return (
      <DataUnavailable
        message={error ?? "Dati scuole MIUR non disponibili"}
      />
    );
  }

  const { kpi, scuole, per_ordine: perOrdine } = data;

  return (
    <div className="panel">
      <PanelHeading
        title={t("Scuole e alunni (MIUR)")}
        description={`Anagrafe ${data.anno_anagrafe ?? "n.d."}${
          data.anno_alunni ? ` · alunni ${data.anno_alunni}` : ""
        }. Fonte: Portale Unico dei Dati della Scuola.`}
        icon={School}
        actions={
          <>
            <OutlineLink href={MIUR_ESPLORA_URL}>Esplora i dati</OutlineLink>
            <OutlineLink href={MIUR_OPENDATA_URL}>Catalogo MIUR</OutlineLink>
          </>
        }
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Plessi")}
          value={formatInteger(kpi.n_plessi)}
          hint={`${formatInteger(kpi.n_istituti)} istituto/i`}
          icon={School}
        />
        <KpiCard
          label={t("Alunni / bambini")}
          value={formatInteger(kpi.alunni_totale)}
          hint={`${formatInteger(kpi.classi_totale)} classi`}
          icon={Users}
          variant="info"
        />
        <KpiCard
          label={t("Infanzia")}
          value={formatInteger(kpi.infanzia_bambini)}
          hint={`${formatInteger(kpi.infanzia_classi)} sezioni`}
          icon={GraduationCap}
        />
        <KpiCard
          label={t("Cittadinanza non italiana")}
          value={
            kpi.pct_non_italiani == null
              ? "n.d."
              : formatPercent(kpi.pct_non_italiani)
          }
          hint={`${formatInteger(kpi.alunni_non_italiani)} su ${formatInteger(kpi.alunni_italiani + kpi.alunni_non_italiani)} (primaria/media)`}
          icon={Users}
        />
      </div>

      {perOrdine.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--pa-surface-soft)]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Ordine</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Alunni</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Classi</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Non italiani</th>
              </tr>
            </thead>
            <tbody>
              {perOrdine.map((o) => (
                <tr key={o.ordine} className="border-t border-[var(--pa-border)]">
                  <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                    {o.ordine}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatInteger(o.alunni)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatInteger(o.classi)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {o.non_italiani > 0 ? formatInteger(o.non_italiani) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ul className="m-0 grid list-none gap-3 p-0 lg:grid-cols-3">
        {scuole.map((s) => (
          <li
            key={s.codice}
            className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] p-3"
          >
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--pa-muted)]">
              {s.tipologia}
            </p>
            <p className="m-0 mt-1 text-sm font-bold text-[var(--pa-ink)]">
              {s.denominazione}
            </p>
            <p className="m-0 mt-1 flex items-start gap-1.5 text-xs text-[var(--pa-muted)]">
              <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {s.indirizzo}
                {s.cap ? ` · ${s.cap}` : ""}
              </span>
            </p>
            <p className="m-0 mt-1 text-xs text-[var(--pa-muted)]">
              Istituto: {s.istituto_riferimento || "—"}
              <br />
              <span className="font-mono">{s.codice}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {s.email ? (
                <a
                  href={`mailto:${s.email}`}
                  className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                >
                  <Mail size={12} aria-hidden />
                  Email
                </a>
              ) : null}
              {s.sito ? (
                <a
                  href={
                    s.sito.startsWith("http") ? s.sito : `https://${s.sito}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                >
                  <ExternalLink size={12} aria-hidden />
                  Sito
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
        Dataset:{" "}
        {data.fonte.dataset
          .map((d) => d.label)
          .join(" · ")}
        . Licenza {data.fonte.licenza}.
      </p>
    </div>
  );
}
