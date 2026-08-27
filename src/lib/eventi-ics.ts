/**
 * Feed iCalendar degli eventi comunali.
 */
import { COMUNE_NOME } from "@/lib/constants";

type EventoIcs = {
  id?: string | null;
  titolo: string;
  periodo?: string | null;
  orario?: string | null;
  luogo?: string | null;
  descrizione?: string | null;
  url?: string | null;
};

const MONTHS: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function icsStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

function parseItalianDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const m = t.match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS[m[2].normalize("NFD").replace(/\p{M}/gu, "")];
  if (month == null) return null;
  const day = Number(m[1]);
  const year = Number(m[3]);
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventiToIcs(eventi: EventoIcs[]): string {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cruscotto Comunale//Eventi//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Eventi ${COMUNE_NOME}`,
  ];
  for (const ev of eventi) {
    const start = parseItalianDate(ev.periodo) ?? now;
    const uid = String(ev.id || ev.url || ev.titolo).replace(/[^\w.-]/g, "").slice(0, 64);
    const desc = [ev.descrizione, ev.orario, ev.periodo, ev.luogo]
      .filter(Boolean)
      .join(" — ");
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:${uid}@cruscotto`));
    lines.push(`DTSTAMP:${icsStamp(now)}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(start)}`);
    lines.push(fold(`SUMMARY:${escapeIcs(ev.titolo)}`));
    if (desc) lines.push(fold(`DESCRIPTION:${escapeIcs(desc)}`));
    if (ev.luogo) lines.push(fold(`LOCATION:${escapeIcs(ev.luogo)}`));
    if (ev.url) lines.push(fold(`URL:${escapeIcs(ev.url)}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
