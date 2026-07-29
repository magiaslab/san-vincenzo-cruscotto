import type { Locale } from "@/lib/i18n/types";

/** Locale usata da formatters non-React (lib/format). */
let current: Locale = "it";

export function getFormatLocale(): Locale {
  return current;
}

export function setFormatLocale(locale: Locale): void {
  current = locale;
}
