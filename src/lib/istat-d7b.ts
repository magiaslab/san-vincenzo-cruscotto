/**
 * Bilancio demografico mensile ISTAT — serie D7B (ZIP → CSV, latin-1).
 * Gli ZIP annuali arrivano fino all’anno precedente: se l’anno in corso
 * manca, si degrada all’ultimo disponibile.
 */
import { inflateRawSync } from "zlib";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";
import { ISTAT_CODE } from "@/lib/constants";
import { fetchUa } from "@/lib/http-ua";

export const D7B_FONTE = "ISTAT — Demo, bilancio demografico mensile (serie D7B)";

export type D7bMese = {
  anno: number;
  mese: number;
  nati: number | null;
  morti: number | null;
  iscritti: number | null;
  cancellati: number | null;
  saldoNaturale: number | null;
  saldoMigratorio: number | null;
};

export type D7bData = {
  anno: number | null;
  mesi: D7bMese[];
  note: string | null;
};

function unzipFirstCsv(buf: Buffer): string | null {
  // ZIP local file header
  let offset = 0;
  while (offset + 30 < buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break;
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const data = buf.subarray(dataStart, dataStart + compSize);
    if (/\.csv$/i.test(name) || name.toLowerCase().includes("d7b")) {
      let out: Buffer;
      if (method === 0) out = Buffer.from(data);
      else if (method === 8) out = inflateRawSync(data);
      else return null;
      return out.toString("latin1");
    }
    offset = dataStart + compSize;
  }
  return null;
}

function parseIt(v: string): number | null {
  const n = Number(String(v).replace(/\./g, "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

export async function buildD7b(): Promise<D7bData> {
  if (!isFeatureEnabled("demografia_mensile")) {
    return { anno: null, mesi: [], note: "Modulo spento (features.demografia_mensile)." };
  }
  const now = new Date().getFullYear();
  const years = [now, now - 1, now - 2];
  let lastErr = "";
  for (const year of years) {
    const url = `https://demo.istat.it/data/d7b/D7B${year}.csv.zip`;
    try {
      const res = await fetchUa(url, { timeoutMs: 30_000 });
      if (!res.ok) {
        lastErr = `${year}: HTTP ${res.status}`;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const csv = unzipFirstCsv(buf);
      if (!csv) {
        lastErr = `${year}: ZIP senza CSV`;
        continue;
      }
      const lines = csv.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) continue;
      const sep = lines[0].includes(";") ? ";" : ",";
      const header = lines[0].split(sep).map((h) => h.replace(/"/g, "").toLowerCase());
      const idx = (n: string) => header.findIndex((h) => h.includes(n));
      const iIstat = idx("istat") >= 0 ? idx("istat") : idx("codice");
      const iMese = idx("mese") >= 0 ? idx("mese") : idx("periodo");
      const iNati = idx("iscrizioni_nati") >= 0 ? idx("iscrizioni_nati") : idx("nati");
      const iMorti = idx("cancellazioni_morti") >= 0 ? idx("cancellazioni_morti") : idx("morti");
      const iIscr = idx("iscrizioni_altro") >= 0 ? idx("iscrizioni_altro") : idx("iscritti");
      const iCanc = idx("cancellazioni_altro") >= 0 ? idx("cancellazioni_altro") : idx("cancellati");
      const mesi: D7bMese[] = [];
      const code = ISTAT_CODE.replace(/^0+/, "");
      for (const line of lines.slice(1)) {
        const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
        const istat = (iIstat >= 0 ? cols[iIstat] : "").replace(/\D/g, "");
        if (istat !== ISTAT_CODE && istat !== code && istat.padStart(6, "0") !== ISTAT_CODE) {
          continue;
        }
        const mese = parseIt(iMese >= 0 ? cols[iMese] : "") ?? mesi.length + 1;
        const nati = parseIt(iNati >= 0 ? cols[iNati] : "");
        const morti = parseIt(iMorti >= 0 ? cols[iMorti] : "");
        const iscritti = parseIt(iIscr >= 0 ? cols[iIscr] : "");
        const cancellati = parseIt(iCanc >= 0 ? cols[iCanc] : "");
        mesi.push({
          anno: year,
          mese,
          nati,
          morti,
          iscritti,
          cancellati,
          saldoNaturale:
            nati != null && morti != null ? nati - morti : null,
          saldoMigratorio:
            iscritti != null && cancellati != null ? iscritti - cancellati : null,
        });
      }
      return {
        anno: year,
        mesi,
        note:
          year !== now
            ? `Anno ${now} non ancora pubblicato: usato ${year}.`
            : mesi.length === 0
              ? `Nessuna riga D7B per ISTAT ${ISTAT_CODE}.`
              : null,
      };
    } catch (err) {
      lastErr = `${year}: ${err instanceof Error ? err.message : "errore"}`;
    }
  }
  return {
    anno: null,
    mesi: [],
    note: `Nessuno ZIP D7B raggiungibile. ${lastErr} Configurazione ISTAT: ${COMUNE.istat_code}.`,
  };
}
