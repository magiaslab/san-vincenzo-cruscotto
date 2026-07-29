import { en } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/types";

export type TranslateVars = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: string,
  vars?: TranslateVars,
): string {
  let out = locale === "en" ? (en[key] ?? key) : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}
