"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "sv-cruscotto-cookie-consent";

type Consent = "accepted" | "essential";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(value: Consent) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-[#d9e6f2] bg-white p-4 shadow-[0_-8px_24px_rgba(23,50,77,0.12)] sm:p-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-[#17324d]">
            <Cookie size={20} className="shrink-0 text-[#0066CC]" aria-hidden />
            <h2 id="cookie-banner-title" className="m-0 text-base font-bold">
              Informativa cookie
            </h2>
          </div>
          <p id="cookie-banner-desc" className="m-0 text-sm leading-relaxed text-[#5b6f82]">
            Questo sito usa cookie tecnici e memoria locale del browser per
            salvare le tue preferenze (es. consenso). Per mappe e radar vengono
            caricati tile da servizi terzi (OpenStreetMap/CARTO, RainViewer). Non
            usiamo cookie di profilazione pubblicitaria. Continuando puoi
            accettare tutti i cookie tecnici necessari al funzionamento, oppure
            solo quelli essenziali.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save("essential")}
            className="rounded-full border border-[#0066CC] bg-white px-4 py-2 text-sm font-semibold text-[#0066CC] hover:bg-[#e8f2fc]"
          >
            Solo essenziali
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="rounded-full bg-[#0066CC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052a3]"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
