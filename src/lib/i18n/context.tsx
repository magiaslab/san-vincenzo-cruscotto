"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { detectLocale } from "@/lib/i18n/detect";
import { setFormatLocale } from "@/lib/i18n/locale-store";
import { translate, type TranslateVars } from "@/lib/i18n/translate";
import {
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslateVars) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");
  const [ready, setReady] = useState(false);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setFormatLocale(next);
    document.documentElement.lang = LOCALE_META[next].htmlLang;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const detected = detectLocale();
    if (detected !== "it") {
      // Scelta esplicita già salvata: passa da setLocale così lang resta
      // coerente. Con localStorage vuoto non si tocca l'attributo (resta it).
      setLocale(detected);
    }
    setReady(true);
  }, [setLocale]);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
