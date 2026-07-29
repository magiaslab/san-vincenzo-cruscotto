export type Locale = "it" | "en";

export const LOCALES: readonly Locale[] = ["it", "en"] as const;

export const LOCALE_STORAGE_KEY = "sv-cruscotto-locale";

export const LOCALE_META: Record<
  Locale,
  { flag: string; name: string; htmlLang: string; intl: string }
> = {
  it: { flag: "🇮🇹", name: "Italiano", htmlLang: "it", intl: "it-IT" },
  en: { flag: "🇬🇧", name: "English", htmlLang: "en", intl: "en-GB" },
};

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "it" || v === "en";
}
