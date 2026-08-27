/**
 * Sostegno al progetto (Buy Me a Coffee + ringraziamenti pubblici).
 * Lo slug è in `config/comune.json`; i nomi in `config/sostegni.json`.
 */
import raw from "../../config/sostegni.json";
import { COMUNE } from "@/lib/comune-config";

export type SostegnoPubblico = {
  name: string;
  amount_label: string;
  message: string;
  date: string | null;
};

export type SostegniList = {
  updatedAt: string | null;
  items: SostegnoPubblico[];
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

export function getBuyMeACoffeeSlug(): string {
  return COMUNE.sostieni.buymeacoffee_slug.trim();
}

export function isSostieniEnabled(): boolean {
  return getBuyMeACoffeeSlug().length > 0;
}

/** URL pagina creatore BMC, o null se il modulo è spento. */
export function getBuyMeACoffeeUrl(): string | null {
  const slug = getBuyMeACoffeeSlug();
  if (!slug) return null;
  return `https://www.buymeacoffee.com/${encodeURIComponent(slug)}`;
}

export function getSostegni(): SostegniList {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const updatedAt = str(data.updated_at) || null;
  const rawList = Array.isArray(data.supporters) ? data.supporters : [];
  const items: SostegnoPubblico[] = [];
  for (const row of rawList) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = str(r.name);
    if (!name) continue;
    items.push({
      name,
      amount_label: str(r.amount_label),
      message: str(r.message),
      date: str(r.date) || null,
    });
  }
  return { updatedAt, items };
}
