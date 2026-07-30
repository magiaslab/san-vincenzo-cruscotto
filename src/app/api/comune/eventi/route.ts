import { NextResponse } from "next/server";
import {
  COMUNE_EVENTI_URL,
  VISIT_SAN_VINCENZO_EVENTI_URL,
} from "@/lib/constants";

const CACHE_DURATION = 3600; // 1 ora

export type EventoComune = {
  id: string | null;
  titolo: string;
  periodo: string | null;
  orario: string | null;
  luogo: string | null;
  descrizione: string | null;
  /** Link all’evento sul calendario Visit San Vincenzo (o esterno). */
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

function absoluteVisitUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://visitsanvincenzo.it${href}`;
  return href;
}

function parseVisitEvents(html: string): EventoComune[] {
  const parts = html.split('<div class="row event">').slice(1);
  const events: EventoComune[] = [];

  for (const part of parts) {
    const dateM = part.match(/<span class="date">\s*([^<]+?)\s*<\/span>/);
    const titleM = part.match(/<h3>\s*([^<]+?)\s*<\/h3>/);
    const metas = [
      ...part.matchAll(/<p class="meta-info">\s*([^<]+?)\s*<\/p>/g),
    ].map((m) => decodeHtml(m[1]));
    const descM = part.match(/<div class="rich-text"><p>([\s\S]*?)<\/p>/);
    if (!titleM) continue;

    const titolo = decodeHtml(titleM[1]);
    if (!titolo) continue;

    const mapId = part.match(/href=["']#(\d+)["']/i)?.[1] ?? null;

    const external =
      [...part.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)]
        .map((m) => absoluteVisitUrl(decodeHtml(m[1])))
        .find(
          (u) =>
            !/visitsanvincenzo\.it/i.test(u) &&
            !/google(apis)?\.com/i.test(u) &&
            !/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(u) &&
            !/\/media\//i.test(u),
        ) ?? null;

    const url = mapId
      ? `${VISIT_SAN_VINCENZO_EVENTI_URL}#${mapId}`
      : VISIT_SAN_VINCENZO_EVENTI_URL;

    events.push({
      id: mapId,
      titolo,
      periodo: dateM ? decodeHtml(dateM[1]) : null,
      orario: metas[0] ?? null,
      luogo: metas[1] ?? null,
      descrizione: descM ? stripTags(descM[1]).slice(0, 280) : null,
      url,
      url_esterno: external,
    });
  }

  return events;
}

export async function GET() {
  try {
    const res = await fetch(VISIT_SAN_VINCENZO_EVENTI_URL, {
      headers: {
        "User-Agent":
          "Cruscotto-San-Vincenzo/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto)",
        Accept: "text/html",
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!res.ok) {
      throw new Error(`Visit San Vincenzo HTTP ${res.status}`);
    }

    const html = await res.text();
    const eventi = parseVisitEvents(html);

    return NextResponse.json(
      {
        disponibile: true,
        n_eventi: eventi.length,
        eventi,
        fonte: {
          nome: "Visit San Vincenzo — Calendario eventi",
          url: VISIT_SAN_VINCENZO_EVENTI_URL,
          comune_url: COMUNE_EVENTI_URL,
        },
        note:
          "Il Comune rimanda al portale turistico Visit San Vincenzo per il calendario ufficiale delle manifestazioni.",
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (error) {
    console.error("Errore API eventi comunali:", error);
    return NextResponse.json(
      {
        disponibile: false,
        n_eventi: 0,
        eventi: [],
        messaggio: "Calendario eventi non disponibile al momento",
        fonte: {
          nome: "Visit San Vincenzo — Calendario eventi",
          url: VISIT_SAN_VINCENZO_EVENTI_URL,
          comune_url: COMUNE_EVENTI_URL,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate",
        },
      },
    );
  }
}
