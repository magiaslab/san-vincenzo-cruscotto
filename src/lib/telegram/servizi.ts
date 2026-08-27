/**
 * Risposte Telegram opt-in: allerta, balneazione, farmacia, incendi.
 */
import { getSiteUrl } from "@/lib/seo";

async function getJson(path: string): Promise<unknown> {
  const url = `${getSiteUrl()}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res.json();
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export function serviziHelp(): string {
  return [
    "<b>Servizi territoriali</b> (opt-in: chiedi quando ti serve)",
    "",
    "/allerta — colore allerta meteo",
    "/farmacia — farmacie di turno oggi",
    "/balneazione — stato acque di balneazione",
    "/incendi — overlay EFFIS / Copernicus",
  ].join("\n");
}

export async function testoAllerta(): Promise<string> {
  try {
    const json = rec(await getJson("/api/meteo/allerte"));
    const oggi = rec(json?.oggi) ?? rec(rec(json?.data)?.oggi);
    const colore =
      String(rec(oggi?.allerta)?.colore ?? json?.colore ?? "n.d.");
    const zona = String(json?.zona ?? rec(json?.data)?.zona ?? "");
    return [
      "<b>Allerta meteo</b>",
      zona ? `Zona: ${zona}` : "",
      `Oggi: ${colore}`,
      "",
      "Fonte: Protezione Civile / allertameteo.app",
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "Allerta non disponibile in questo momento. Riprova più tardi.";
  }
}

export async function testoFarmacia(): Promise<string> {
  try {
    const json = rec(await getJson("/api/farmacie/turno"));
    const list = Array.isArray(json?.farmacie)
      ? (json.farmacie as Array<Record<string, unknown>>)
      : [];
    if (list.length === 0) {
      return "Nessuna farmacia di turno trovata per oggi.";
    }
    const lines = list.slice(0, 5).map((f) => {
      const nome = String(f.nome ?? "Farmacia");
      const ind = String(f.indirizzo ?? "");
      const tel = f.telefono ? ` — ${String(f.telefono)}` : "";
      return `• <b>${nome}</b>\n  ${ind}${tel}`;
    });
    return ["<b>Farmacie di turno</b>", "", ...lines].join("\n");
  } catch {
    return "Farmacie di turno non disponibili in questo momento.";
  }
}

export async function testoBalneazione(): Promise<string> {
  try {
    const json = rec(await getJson("/api/arpat/balneazione"));
    const aree = Array.isArray(json?.aree)
      ? (json.aree as Array<Record<string, unknown>>)
      : [];
    if (aree.length === 0) {
      return "Nessun dato di balneazione disponibile (fuori stagione o fonte non raggiungibile).";
    }
    const lines = aree.slice(0, 8).map((a) => {
      const nome = String(a.nome ?? "Area");
      const cl = String(a.classificazione ?? a.classe ?? "n.d.");
      return `• ${nome}: <b>${cl}</b>`;
    });
    return ["<b>Balneazione ARPAT</b>", "", ...lines].join("\n");
  } catch {
    return "Balneazione non disponibile in questo momento.";
  }
}

export async function testoIncendi(): Promise<string> {
  try {
    const json = rec(await getJson("/api/incendi"));
    const data = rec(json?.data) ?? json;
    const viewer = String(data?.viewerUrl ?? "https://maps.effis.emergency.copernicus.eu/effis");
    return [
      "<b>Rischio incendi (EFFIS)</b>",
      "Indice FWI e hotspot MODIS come overlay sulla mappa del cruscotto.",
      `Visualizzatore: ${viewer}`,
    ].join("\n");
  } catch {
    return "Dati incendi non disponibili in questo momento.";
  }
}
