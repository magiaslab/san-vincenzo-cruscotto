/**
 * Indice PA — domicili digitali, PEC, codice IPA e univoco fatturazione.
 */
import { COMUNE, isFeatureEnabled, matchesComuneText } from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export const IPA_FONTE = "IPA — Indice dei domicili digitali della PA";
const PACKAGE_URL =
  "https://indicepa.gov.it/ipa-dati/api/3/action/package_show?id=domicili-digitali";

export type IpaEnte = {
  denominazione: string;
  codiceIpa: string;
  pec: string;
  codiceUnivoco: string;
  comune: string;
};

export type IpaData = {
  enti: IpaEnte[];
  note: string | null;
};

export async function buildIpa(): Promise<IpaData> {
  if (!isFeatureEnabled("ipa")) {
    return { enti: [], note: "Modulo spento (features.ipa)." };
  }
  const pkgRes = await fetchUa(PACKAGE_URL, {
    headers: { Accept: "application/json" },
  });
  if (!pkgRes.ok) {
    return { enti: [], note: `IPA CKAN ha risposto ${pkgRes.status}.` };
  }
  const pkg = (await pkgRes.json()) as {
    result?: { resources?: Array<{ url?: string; format?: string }> };
  };
  const resources = pkg.result?.resources ?? [];
  const csv = resources.find((r) =>
    String(r.format || r.url || "").toLowerCase().includes("csv"),
  );
  const jsonR = resources.find((r) =>
    String(r.format || r.url || "").toLowerCase().includes("json"),
  );
  const url = csv?.url || jsonR?.url;
  if (!url) {
    return {
      enti: [],
      note: "Nessuna risorsa CSV/JSON nel package IPA domicili-digitali.",
    };
  }
  const res = await fetchUa(url, { timeoutMs: 40_000 });
  if (!res.ok) {
    return { enti: [], note: `Download IPA ${res.status}.` };
  }
  const text = await res.text();
  const enti: IpaEnte[] = [];
  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      const data = JSON.parse(text) as unknown;
      const rows = Array.isArray(data)
        ? data
        : Array.isArray((data as { records?: unknown[] }).records)
          ? (data as { records: unknown[] }).records
          : [];
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const comune = String(r.Comune ?? r.comune ?? r.citta ?? "");
        const denom = String(
          r.Denominazione_ente ?? r.denominazione ?? r.nome ?? "",
        );
        if (!matchesComuneText(comune, denom)) continue;
        enti.push({
          denominazione: denom,
          codiceIpa: String(r.Codice_IPA ?? r.codice_ipa ?? r.ipa ?? ""),
          pec: String(r.Mail_PEC ?? r.pec ?? r.domicilio_digitale ?? ""),
          codiceUnivoco: String(
            r.Codice_univoco ?? r.codice_univoco ?? r.cuu ?? "",
          ),
          comune,
        });
      }
    } catch {
      return { enti: [], note: "JSON IPA non analizzabile." };
    }
  } else {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    if (lines.length < 2) {
      return { enti: [], note: "CSV IPA vuoto." };
    }
    const sep = lines[0].includes(";") ? ";" : ",";
    const header = lines[0].split(sep).map((h) => h.replace(/"/g, "").trim());
    const idx = (needles: string[]) =>
      header.findIndex((h) =>
        needles.some((n) => h.toLowerCase().includes(n)),
      );
    const iDenom = idx(["denominazione", "ente"]);
    const iComune = idx(["comune", "citt"]);
    const iIpa = idx(["codice_ipa", "ipa"]);
    const iPec = idx(["pec", "mail", "domicilio"]);
    const iCuu = idx(["univoco", "cuu", "fatturaz"]);
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
      const comune = iComune >= 0 ? cols[iComune] ?? "" : "";
      const denom = iDenom >= 0 ? cols[iDenom] ?? "" : "";
      if (!matchesComuneText(comune, denom)) continue;
      enti.push({
        denominazione: denom,
        codiceIpa: iIpa >= 0 ? cols[iIpa] ?? "" : "",
        pec: iPec >= 0 ? cols[iPec] ?? "" : "",
        codiceUnivoco: iCuu >= 0 ? cols[iCuu] ?? "" : "",
        comune,
      });
    }
  }
  return {
    enti,
    note:
      enti.length === 0
        ? `Nessun ente IPA trovato per ${COMUNE.nome}.`
        : null,
  };
}
