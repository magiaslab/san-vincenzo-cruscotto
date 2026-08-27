import {
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/types";

/**
 * Lingua UI: solo preferenza esplicita in localStorage, altrimenti italiano.
 * Non si legge `navigator.language`: Googlebot (en-US) deve restare su `it`.
 */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "it";

  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* ignore */
  }

  return "it";
}
