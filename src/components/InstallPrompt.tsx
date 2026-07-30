"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useFocusTrap } from "@/lib/focus-trap";

const STORAGE_KEY = "sv-cruscotto-install-prompt";
const COOKIE_KEY = "sv-cruscotto-cookie-consent";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const criOS = /CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && !criOS;
}

function wasDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      dismissed?: boolean;
      installed?: boolean;
    };
    return Boolean(parsed.dismissed || parsed.installed);
  } catch {
    return false;
  }
}

function cookieSettled(): boolean {
  try {
    return Boolean(window.localStorage.getItem(COOKIE_KEY));
  } catch {
    return true;
  }
}

function persist(payload: { dismissed?: boolean; installed?: boolean }) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

/** Popup che invita a installare la PWA alla prima apertura. */
export function InstallPrompt() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const installBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const dismiss = useCallback(() => {
    persist({ dismissed: true });
    setVisible(false);
  }, []);

  useFocusTrap(dialogRef, visible, dismiss);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      maybeShow();
    };

    const maybeShow = () => {
      if (isStandalone() || wasDismissed()) return;
      if (!cookieSettled()) return;
      const canNative = Boolean(deferredRef.current);
      const ios = isIosSafari();
      if (!canNative && !ios) return;
      setIosHint(ios && !canNative);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("sv-cookie-consent", maybeShow);

    const timer = window.setTimeout(maybeShow, 1200);

    const poll = window.setInterval(() => {
      if (cookieSettled()) {
        maybeShow();
        window.clearInterval(poll);
      }
    }, 400);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("sv-cookie-consent", maybeShow);
      window.clearTimeout(timer);
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    installBtnRef.current?.focus();
  }, [visible]);

  async function install() {
    const evt = deferredRef.current;
    if (!evt) {
      return;
    }
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "accepted") {
        persist({ installed: true });
        setVisible(false);
      } else {
        persist({ dismissed: true });
        setVisible(false);
      }
    } catch {
      persist({ dismissed: true });
      setVisible(false);
    } finally {
      deferredRef.current = null;
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-[rgba(23,50,77,0.45)] p-3 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3">
          <div className="min-w-0">
            <p
              id={titleId}
              className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]"
            >
              <Download
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                aria-hidden
              />
              {t("Installa l’app")}
            </p>
            <p id={descId} className="m-0 mt-1 text-sm text-[var(--pa-muted)]">
              {t(
                "Aggiungi il Cruscotto San Vincenzo alla schermata Home per aprirlo subito, anche offline per le pagine già visitate.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--pa-border)] bg-white text-[var(--pa-ink)]"
            aria-label={t("Chiudi")}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="px-4 py-4">
          {iosHint ? (
            <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-[var(--pa-ink)]">
              <li>
                {t("Tocca")}{" "}
                <Share
                  size={16}
                  className="mx-0.5 inline text-[var(--pa-primary)]"
                  aria-hidden
                />{" "}
                <strong>{t("Condividi")}</strong> {t("in Safari")}
              </li>
              <li>
                {t("Scegli")} <strong>{t("Aggiungi a Home")}</strong>
              </li>
              <li>{t("Conferma con Aggiungi")}</li>
            </ol>
          ) : (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t(
                "L’app si apre a tutto schermo, senza barra del browser, come un’applicazione.",
              )}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!iosHint ? (
              <button
                ref={installBtnRef}
                type="button"
                onClick={() => void install()}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)]"
                style={{ color: "#ffffff" }}
              >
                <Download size={16} aria-hidden />
                {t("Installa")}
              </button>
            ) : (
              <button
                ref={installBtnRef}
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)]"
                style={{ color: "#ffffff" }}
              >
                {t("Ho capito")}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[var(--pa-border)] bg-white px-4 text-sm font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
            >
              {t("Non ora")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
