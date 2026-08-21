import { NextResponse } from "next/server";
import {
  BIBLIOTECA_COMUNALE_URL,
  BIBLIOTECA_OPAC_URL,
  COMUNE_DI,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  MAP_CENTER,
} from "@/lib/constants";
import { isFeatureEnabled, isUpstreamDeploy } from "@/lib/comune-config";

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

  const upstream = isUpstreamDeploy();
  const fallback = upstream
    ? {
        disponibile: true,
        nome: 'Biblioteca Comunale "Giorgio Calandra"',
        indirizzo: `Piazza Osvaldo Mischi, 1 — 57027 ${COMUNE_NOME} (${COMUNE_PROVINCIA})`,
        telefono: "0565 707273",
        email: "biblioteca@comune.sanvincenzo.li.it",
        lat: 43.100583,
        lon: 10.538421,
        superficie_mq: 370,
        descrizione:
          "Biblioteca comunale al primo piano del Palazzo della Cultura. Fa parte del Sistema Documentario Territoriale Livornese; tessera gratuita valida in provincia.",
        orari: [
          { giorno: "Lun", orario: "8:30-18:30" },
          { giorno: "Mar", orario: "8:30-18:30" },
          { giorno: "Mer", orario: "8:30-18:30" },
          { giorno: "Gio", orario: "8:30-18:30" },
          { giorno: "Ven", orario: "8:30-18:30" },
          { giorno: "Sab", orario: "8:30-12:30" },
        ] as OrarioGiorno[],
        servizi: [
          "Prestito e consultazione",
          "Prestito interbibliotecario gratuito",
          "Sezione ragazzi 0–14 anni",
          "Book crossing nei parchi",
          "Punti prestito nelle scuole",
        ],
        opac_url: BIBLIOTECA_OPAC_URL,
        fonte: {
          nome: COMUNE_DI,
          url: BIBLIOTECA_COMUNALE_URL,
        },
      }
    : {
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

  try {
    const res = await fetch(BIBLIOTECA_COMUNALE_URL, {
      headers: {
        "User-Agent": "Cruscotto-San-Vincenzo/1.0 (+https://github.com/magiaslab/san-vincenzo-cruscotto)",
        Accept: "text/html",
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ...fallback,
          disponibile: upstream,
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
    const emailM = html.match(
      upstream
        ? /([a-z0-9._%+-]+@comune\.sanvincenzo\.li\.it)/i
        : /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i,
    );
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
        disponibile: upstream,
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
