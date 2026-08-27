import { NextResponse } from "next/server";
import {
  BIBLIOTECA_COMUNALE_URL,
  BIBLIOTECA_OPAC_URL,
  COMUNE_DI,
  COMUNE_NOME,
  HTTP_USER_AGENT,
  MAP_CENTER,
} from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/comune-config";

const CACHE_DURATION = 86400; // 24 ore

type OrarioGiorno = { giorno: string; orario: string };

function decodeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOrari(html: string): OrarioGiorno[] {
  const text = decodeHtml(html.replace(/<[^>]+>/g, " "));
  const map: Record<string, string> = {};
  const pairs: Array<[string, RegExp]> = [
    ["Lun", /\bLun(?:ed[iì])?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
    ["Mar", /\bMar(?:ted[iì])?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
    ["Mer", /\bMer(?:coled[iì])?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
    ["Gio", /\bGio(?:ved[iì])?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
    ["Ven", /\bVen(?:erd[iì])?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
    ["Sab", /\bSab(?:ato)?\s+(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|chiuso)/i],
  ];
  for (const [giorno, re] of pairs) {
    const m = text.match(re);
    if (m?.[1]) map[giorno] = decodeHtml(m[1]);
  }
  return Object.entries(map).map(([giorno, orario]) => ({ giorno, orario }));
}

export async function GET() {
  if (!isFeatureEnabled("biblioteca")) {
    return NextResponse.json(
      {
        disponibile: false,
        error: "Modulo biblioteca disattivato per questo comune",
      },
      { status: 404 },
    );
  }

  const fallback = {
        disponibile: true,
        nome: `Biblioteca comunale di ${COMUNE_NOME}`,
        indirizzo: null as string | null,
        telefono: null as string | null,
        email: null as string | null,
        lat: MAP_CENTER[0],
        lon: MAP_CENTER[1],
        superficie_mq: null as number | null,
        descrizione: "",
        orari: [] as OrarioGiorno[],
        servizi: [] as string[],
        opac_url: BIBLIOTECA_OPAC_URL,
        fonte: {
          nome: COMUNE_DI,
          url: BIBLIOTECA_COMUNALE_URL,
        },
      };

  if (!BIBLIOTECA_COMUNALE_URL) {
    return NextResponse.json({
      ...fallback,
      disponibile: false,
      scraped: false,
      note: "URL biblioteca non configurato (urls.biblioteca).",
    });
  }

  try {
    const res = await fetch(BIBLIOTECA_COMUNALE_URL, {
      headers: {
        "User-Agent": HTTP_USER_AGENT,
        Accept: "text/html",
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ...fallback,
          disponibile: false,
          scraped: false,
        },
        {
          headers: {
            "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          },
        },
      );
    }

    const html = await res.text();
    const orari = parseOrari(html);
    const phoneM = html.match(/Telefono:\s*([0-9\s/]+)/i);
    const emailM = html.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    const geoM = html.match(
      /"latitude"\s*:\s*([0-9.]+)\s*,\s*"longitude"\s*:\s*([0-9.]+)/,
    );

    return NextResponse.json(
      {
        ...fallback,
        telefono: phoneM ? decodeHtml(phoneM[1]) : fallback.telefono,
        email: emailM ? emailM[1].toLowerCase() : fallback.email,
        lat: geoM ? Number(geoM[1]) : fallback.lat,
        lon: geoM ? Number(geoM[2]) : fallback.lon,
        orari: orari.length >= 4 ? orari : fallback.orari,
        scraped: true,
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (error) {
    console.error("Errore API biblioteca:", error);
    return NextResponse.json(
      {
        ...fallback,
        disponibile: false,
        scraped: false,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate",
        },
      },
    );
  }
}
