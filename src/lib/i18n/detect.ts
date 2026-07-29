import {
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/types";

/** Preferenza salvata, altrimenti lingua del browser (en* → en, default it). */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "it";

  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* ignore */
  }

  const langs =
    navigator.languages?.length > 0
      ? [...navigator.languages]
      : [navigator.language];

  for (const lang of langs) {
    const code = (lang || "").toLowerCase();
    if (code.startsWith("en")) return "en";
    if (code.startsWith("it")) return "it";
  }

  return "it";
}
