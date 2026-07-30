"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Filter } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatInteger } from "@/lib/format";
import { COMUNE_EVENTI_URL, VISIT_SAN_VINCENZO_EVENTI_URL } from "@/lib/constants";

export type EventoComuneRow = {
  id?: string | null;
  titolo?: string | null;
  periodo?: string | null;
  orario?: string | null;
  luogo?: string | null;
  descrizione?: string | null;
  url?: string | null;
  url_esterno?: string | null;
};

function asText(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function EventiComunePanel({
  eventi,
  nEventi,
  fonteUrl,
  comuneUrl,
}: {
  eventi: EventoComuneRow[];
  nEventi?: number;
  fonteUrl?: string | null;
  comuneUrl?: string | null;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [luogo, setLuogo] = useState("");
  const [periodo, setPeriodo] = useState("");

  const luoghi = useMemo(() => {
    const set = new Set<string>();
    for (const ev of eventi) {
      const l = asText(ev.luogo).trim();
      if (l) set.add(l);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "it"));
  }, [eventi]);

  const periodi = useMemo(() => {
    const set = new Set<string>();
    for (const ev of eventi) {
      const p = asText(ev.periodo).trim();
      if (p) set.add(p);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "it"));
  }, [eventi]);

  const filtrati = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return eventi.filter((ev) => {
      if (luogo && asText(ev.luogo).trim() !== luogo) return false;
      if (periodo && asText(ev.periodo).trim() !== periodo) return false;
      if (!needle) return true;
      const hay = [ev.titolo, ev.luogo, ev.periodo, ev.orario, ev.descrizione]
        .map(asText)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [eventi, q, luogo, periodo]);

  const visitUrl = fonteUrl || VISIT_SAN_VINCENZO_EVENTI_URL;
  const comuneEventiUrl = comuneUrl || COMUNE_EVENTI_URL;

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-3 py-3 sm:px-4">
        <h3 className="m-0 mb-1 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
          <Filter size={18} className="text-[var(--pa-primary)]" aria-hidden />
          {t("Eventi e manifestazioni (Comune)")}
        </h3>
        <p className="m-0 text-xs text-[var(--pa-muted)] sm:text-sm">
          {t("Calendario ufficiale su Visit San Vincenzo")} —{" "}
          {formatInteger(nEventi ?? eventi.length)} {t("voci")}.{" "}
          {t("Filtra per testo, luogo o periodo.")}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-[var(--pa-muted)]">
            {t("Cerca")}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Titolo, luogo, descrizione…")}
              className="mt-1 w-full rounded-lg border border-[var(--pa-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--pa-ink)]"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--pa-muted)]">
            {t("Luogo")}
            <select
              value={luogo}
              onChange={(e) => setLuogo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--pa-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--pa-ink)]"
            >
              <option value="">{t("Tutti i luoghi")}</option>
              {luoghi.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[var(--pa-muted)]">
            {t("Periodo")}
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--pa-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--pa-ink)]"
            >
              <option value="">{t("Tutti i periodi")}</option>
              {periodi.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-0 mt-2 text-xs text-[var(--pa-muted)]">
          {formatInteger(filtrati.length)} {t("risultati")}
          {filtrati.length !== eventi.length
            ? ` / ${formatInteger(eventi.length)}`
            : null}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#e8f2fc] text-[#17324d]">
            <tr>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Evento")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Periodo")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Luogo")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Orario")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Link")}</th>
            </tr>
          </thead>
          <tbody>
            {filtrati.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-[var(--pa-muted)]"
                >
                  {t("Nessun evento corrisponde ai filtri selezionati.")}
                </td>
              </tr>
            ) : (
              filtrati.map((ev, i) => {
                const title = asText(ev.titolo) || t("Senza titolo");
                const url = asText(ev.url) || visitUrl;
                const esterno = asText(ev.url_esterno);
                return (
                  <tr
                    key={`${title}-${asText(ev.periodo)}-${i}`}
                    className="border-t border-[#eef2f5] align-top"
                  >
                    <td className="max-w-xs px-2 py-1.5 sm:px-3 sm:py-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--pa-primary)] underline-offset-2 hover:underline"
                      >
                        {title}
                      </a>
                      {ev.descrizione ? (
                        <span className="mt-0.5 block text-[10px] text-[var(--pa-muted)] sm:text-xs">
                          {asText(ev.descrizione)}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
                      {asText(ev.periodo) || "—"}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {asText(ev.luogo) || "—"}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {asText(ev.orario) || "—"}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <div className="flex flex-col gap-1">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[var(--pa-primary)] underline"
                        >
                          Visit SV
                          <ExternalLink size={12} aria-hidden />
                        </a>
                        {esterno ? (
                          <a
                            href={esterno}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--pa-muted)] underline"
                          >
                            {t("Sito / biglietti")}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-3 py-2 text-xs text-[var(--pa-muted)] sm:px-4">
        {t("Fonte:")}{" "}
        <a
          href={visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          Visit San Vincenzo
        </a>
        {" · "}
        <a
          href={comuneEventiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          {t("pagina Eventi del Comune")}
        </a>
      </p>
    </div>
  );
}
