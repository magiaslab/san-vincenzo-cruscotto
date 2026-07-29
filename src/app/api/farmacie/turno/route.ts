import { NextResponse } from "next/server";
import {
  FARMACIE_DI_TURNO_BASE,
  FARMACIE_DI_TURNO_URL,
} from "@/lib/constants";

export const revalidate = 1800;

const CACHE_CONTROL =
  "public, s-maxage=1800, stale-while-revalidate=3600";

const USER_AGENT =
  "Mozilla/5.0 (compatible; CruscottoSanVincenzo/1.0; +https://github.com/magiaslab/san-vincenzo-cruscotto)";

export type FarmaciaTurno = {
  nome: string;
  indirizzo: string;
  comune: string;
  cap: string;
  provincia: string;
  apertura: string;
  turno: string;
  distanza_km: number | null;
  telefono: string | null;
  url_scheda: string | null;
  url_orario: string | null;
};

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&agrave;/gi, "à")
    .replace(/&egrave;/gi, "è")
    .replace(/&eacute;/gi, "é")
    .replace(/&igrave;/gi, "ì")
    .replace(/&ograve;/gi, "ò")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href: string | undefined | null): string | null {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `${FARMACIE_DI_TURNO_BASE}${href}`;
  return `${FARMACIE_DI_TURNO_BASE}/${href}`;
}

function parseKm(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseFarmaciaBox(box: string): FarmaciaTurno | null {
  const nome =
    box.match(
      /itemprop=["']name["'][^>]*class=["']pharmacyname["'][^>]*>([^<]+)/i,
    )?.[1] ??
    box.match(/class=["']pharmacyname["'][^>]*>([^<]+)/i)?.[1] ??
    null;
  if (!nome) return null;

  const street =
    box.match(/itemprop=["']streetAddress["'][^>]*>([^<]*)/i)?.[1]?.trim() ??
    "";
  // Optional frazione after street: "Via X - FRAZIONE<br>" or just street + <br>
  const afterStreet = box.match(
    /itemprop=["']streetAddress["'][^>]*>[^<]*<\/span>\s*(?:-\s*([^<]+?))?\s*<br/i,
  )?.[1];
  const indirizzo = stripTags(
    afterStreet ? `${street} - ${afterStreet.trim()}` : street,
  );

  const localityRaw =
    box.match(/itemprop=["']addressLocality["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ??
    "";
  const localityText = stripTags(localityRaw);
  const capMatch = localityText.match(/^(\d{5})\s+(.*)$/);
  const cap = capMatch?.[1] ?? "";
  const comune = (capMatch?.[2] ?? localityText).trim();

  const provincia =
    box
      .match(/itemprop=["']addressRegion["'][^>]*>([^<]*)/i)?.[1]
      ?.trim() ?? "";

  const orarioBlock =
    box.match(/class=['"]orario['"][^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "";
  const orarioText = stripTags(orarioBlock.replace(/<br\s*\/?>/gi, " | "));
  const apertura =
    orarioText.match(/Apertura:\s*([^|]+?)(?:\s*\||$)/i)?.[1]?.trim() ??
    (orarioText.startsWith("Apertura:")
      ? orarioText.replace(/^Apertura:\s*/i, "").trim()
      : orarioText);
  const turno =
    orarioText
      .match(/Turno\*?:\s*(.+)$/i)?.[1]
      ?.replace(/\*+$/, "")
      .trim() ??
    (box.match(/class=["']btorario[^"']*["'][^>]*>([^<]+)/i)?.[1]?.trim() ??
      "");

  const distanza_km = parseKm(
    box.match(/Distanza stimata:\s*<b>([\d.,]+)<\/b>\s*km/i)?.[1],
  );

  const telefono =
    box.match(/href=["']tel:([^"']+)["']/i)?.[1]?.trim() ?? null;

  const idf =
    box.match(/farmacia\.asp\?idf=(\d+)/i)?.[1] ??
    box.match(/orariofarmacia\.asp\?idf=(\d+)/i)?.[1] ??
    null;

  const url_scheda = absoluteUrl(
    box.match(/href=["']([^"']*farmacia\.asp\?idf=\d+)["']/i)?.[1] ??
      (idf ? `/farmacia.asp?idf=${idf}` : null),
  );
  const url_orario = absoluteUrl(
    box.match(/href=["']([^"']*orariofarmacia\.asp\?idf=\d+)["']/i)?.[1] ??
      (idf ? `/orariofarmacia.asp?idf=${idf}` : null),
  );

  return {
    nome: decodeHtml(nome.trim()),
    indirizzo,
    comune: decodeHtml(comune),
    cap,
    provincia,
    apertura: decodeHtml(apertura),
    turno: decodeHtml(turno),
    distanza_km,
    telefono,
    url_scheda,
    url_orario,
  };
}

function parsePage(html: string) {
  const giorno =
    decodeHtml(
      html.match(/Giorno:\s*<b>([\s\S]*?)<\/b>/i)?.[1] ?? "",
    ).trim() || null;
  const orario_riferimento =
    decodeHtml(
      html.match(/Orario:\s*<b>([\s\S]*?)<\/b>/i)?.[1] ?? "",
    ).trim() || null;

  // Nested </div> inside each box — slice between consecutive openings.
  const starts: number[] = [];
  const startRe = /<div\b[^>]*class=["']farmacia-box["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = startRe.exec(html)) !== null) {
    starts.push(m.index);
  }

  const listEnd =
    html.search(/Altra ricerca di farmacie di turno/i) >= 0
      ? html.search(/Altra ricerca di farmacie di turno/i)
      : html.length;

  const farmacie: FarmaciaTurno[] = [];
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i]!;
    const to = i + 1 < starts.length ? starts[i + 1]! : listEnd;
    const parsed = parseFarmaciaBox(html.slice(from, to));
    if (parsed) farmacie.push(parsed);
  }

  return { giorno, orario_riferimento, farmacie };
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`farmaciediturno.org HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const charset =
    res.headers.get("content-type")?.match(/charset=([^\s;]+)/i)?.[1] ??
    "iso-8859-1";
  try {
    return new TextDecoder(charset).decode(buf);
  } catch {
    return new TextDecoder("iso-8859-1").decode(buf);
  }
}

export async function GET() {
  const fonte = {
    nome: "FarmacieDiTurno.org",
    url: FARMACIE_DI_TURNO_URL,
  };

  try {
    const html = await fetchHtml(FARMACIE_DI_TURNO_URL);
    const { giorno, orario_riferimento, farmacie } = parsePage(html);

    if (farmacie.length === 0) {
      return NextResponse.json(
        {
          giorno,
          orario_riferimento,
          farmacie: [],
          fonte,
          fetched_at: new Date().toISOString(),
          error: "Nessuna farmacia di turno trovata nella pagina sorgente",
        },
        {
          status: 502,
          headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
        },
      );
    }

    return NextResponse.json(
      {
        giorno,
        orario_riferimento,
        farmacie,
        fonte,
        fetched_at: new Date().toISOString(),
      },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (err) {
    console.error("Errore API farmacie di turno:", err);
    return NextResponse.json(
      {
        giorno: null,
        orario_riferimento: null,
        farmacie: [],
        fonte,
        fetched_at: new Date().toISOString(),
        error: "Impossibile recuperare le farmacie di turno",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }
}
