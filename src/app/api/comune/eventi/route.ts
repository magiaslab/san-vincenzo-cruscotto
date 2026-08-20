import { NextResponse } from "next/server";
import {
  COMUNE_EVENTI_URL,
  COMUNE_NOME,
  HTTP_USER_AGENT,
  VISIT_SAN_VINCENZO_EVENTI_URL,
} from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 3600; // 1 ora

export type EventoComune = {
  id: string | null;
  titolo: string;
  periodo: string | null;
  orario: string | null;
  luogo: string | null;
  descrizione: string | null;
  /** Link all’evento sul calendario configurato (o esterno). */
  url: string;
  /** Eventuale sito/biglietto esterno (Eventbrite, cinema, ecc.). */
  url_esterno: string | null;
};

function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, " "));
}

function absoluteCalendarioUrl(href: string, base: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/** Parser specifico per il template “Visit …” (row event). Altri comuni: kind=link. */
function parseVisitEvents(html: string, baseUrl: string): EventoComune[] {
  const parts = html.split('<div class="row event">').slice(1);
  const events: EventoComune[] = [];
  let host = "";
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    host = "";
  }

  for (const part of parts) {
    const dateM = part.match(/<span class="date">\s*([^<]+?)\s*<\/span>/);
    const titleM = part.match(/<h3>\s*([^<]+?)\s*<\/h3>/);
    const metas = [
      ...part.matchAll(/<p class="meta-info">\s*([^<]+?)\s*<\/p>/g),
    ].map((m) => decodeHtml(m[1] ?? ""));
    const descM = part.match(/<div class="rich-text"><p>([\s\S]*?)<\/p>/);
    if (!titleM?.[1]) continue;

    const titolo = decodeHtml(titleM[1]);
    if (!titolo) continue;

    const mapId = part.match(/href=["']#(\d+)["']/i)?.[1] ?? null;

    const external =
      [...part.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)]
        .map((m) => absoluteCalendarioUrl(decodeHtml(m[1] ?? ""), baseUrl))
        .find(
          (u) =>
            !(host && u.includes(host)) &&
            !/google(apis)?\.com/i.test(u) &&
            !/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(u) &&
            !/\/media\//i.test(u),
        ) ?? null;

    const url = mapId ? `${baseUrl}#${mapId}` : baseUrl;

    events.push({
      id: mapId,
      titolo,
      periodo: dateM?.[1] ? decodeHtml(dateM[1]) : null,
      orario: metas[0] ?? null,
      luogo: metas[1] ?? null,
      descrizione: descM?.[1] ? stripTags(descM[1]).slice(0, 280) : null,
      url,
      url_esterno: external,
    });
  }

  return events;
}

function emptyPayload(message: string) {
  return {
    disponibile: false,
    n_eventi: 0,
    eventi: [] as EventoComune[],
    messaggio: message,
    fonte: {
      nome: `Calendario eventi — ${COMUNE_NOME}`,
      url: VISIT_SAN_VINCENZO_EVENTI_URL || COMUNE_EVENTI_URL,
      comune_url: COMUNE_EVENTI_URL,
    },
  };
}

export async function GET() {
  if (!isFeatureEnabled("eventi_comune")) {
    return NextResponse.json(emptyPayload("Modulo eventi comunali disattivato"), {
      status: 404,
    });
  }

  const calendario = VISIT_SAN_VINCENZO_EVENTI_URL || COMUNE_EVENTI_URL;
  const kind = COMUNE.urls.eventi_calendario_kind || "none";

  if (!calendario || kind === "none" || kind === "link") {
    return NextResponse.json(
      {
        ...emptyPayload(
          kind === "link" || calendario
            ? "Calendario configurato solo come link esterno (nessuno scrape)."
            : "Nessun URL calendario eventi configurato in config/comune.json",
        ),
        disponibile: Boolean(calendario),
        fonte: {
          nome: `Eventi — ${COMUNE_NOME}`,
          url: calendario || COMUNE_EVENTI_URL,
          comune_url: COMUNE_EVENTI_URL,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  }

  if (kind !== "visit_html") {
    return NextResponse.json(
      emptyPayload(
        `Tipo calendario "${kind}" non supportato. Usa visit_html o link.`,
      ),
      { status: 501 },
    );
  }

  try {
    const res = await fetch(calendario, {
      headers: {
        "User-Agent": HTTP_USER_AGENT,
        Accept: "text/html",
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!res.ok) {
      throw new Error(`Calendario eventi HTTP ${res.status}`);
    }

    const html = await res.text();
    const eventi = parseVisitEvents(html, calendario);

    return NextResponse.json(
      {
        disponibile: true,
        n_eventi: eventi.length,
        eventi,
        fonte: {
          nome: `Calendario eventi — ${COMUNE_NOME}`,
          url: calendario,
          comune_url: COMUNE_EVENTI_URL,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (err) {
    console.error("Eventi comune error", err);
    return NextResponse.json(
      emptyPayload("Impossibile recuperare il calendario eventi"),
      { status: 502 },
    );
  }
}
