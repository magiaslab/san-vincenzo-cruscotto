"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Menu, X, type LucideIcon } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SkipLink } from "@/components/SkipLink";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_REGIONE,
  STEMMA,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { scrollToTopSmooth } from "@/lib/motion";

export type NavItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

type AppShellProps = {
  groups: readonly NavGroup[];
  activeId: string;
  onNavigate: (id: string) => void;
  generatedAt?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export function AppShell({
  groups,
  activeId,
  onNavigate,
  generatedAt,
  children,
  footer,
}: AppShellProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const flat = groups.flatMap((g) => g.items);
  const active = flat.find((i) => i.id === activeId);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function go(id: string) {
    onNavigate(id);
    setOpen(false);
    scrollToTopSmooth();
  }

  function goHome() {
    go("panoramica");
  }

  const brandBlock = (
    <button
      type="button"
      onClick={goHome}
      className="flex h-[var(--shell-topbar-h)] w-full items-center gap-3 px-4 text-left no-underline"
      aria-label={t("Torna alla home")}
    >
      <Image
        src={STEMMA.src}
        alt={STEMMA.alt}
        width={36}
        height={45}
        className="h-9 w-auto shrink-0"
        priority
      />
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold leading-tight text-[var(--pa-ink)]">
          Cruscotto {COMUNE_NOME}
        </p>
        <p className="m-0 mt-0.5 text-xs leading-tight text-[var(--pa-muted)]">
          {COMUNE_REGIONE} · {t("dati aperti")}
        </p>
      </div>
    </button>
  );

  const nav = (
    <nav
      aria-label={t("Sezioni del cruscotto")}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="hidden shrink-0 border-b border-[var(--pa-border)] lg:block">
        {brandBlock}
      </div>

      {/* min-h-0: senza, il flex non restringe e overflow-y non arriva alle ultime voci */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="m-0 px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--pa-muted)]">
              {t(group.label)}
            </p>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {group.items.map((item) => {
                const Icon = item.Icon;
                const isActive = item.id === activeId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-[var(--pa-primary)] text-white"
                          : "text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} className="shrink-0" />
                      <span>{t(item.label)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <SkipLink />

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-0 z-30 hidden h-dvh max-h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--pa-border)] bg-[var(--pa-surface)] lg:flex">
          {nav}
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <button
              type="button"
              aria-label={t("Chiudi menu")}
              className="absolute inset-0 bg-[color-mix(in_srgb,var(--pa-ink)_50%,transparent)]"
              onClick={() => setOpen(false)}
            />
            <aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("Menu sezioni")}
              className="absolute inset-y-0 left-0 flex max-h-dvh w-[min(18rem,88vw)] flex-col overflow-hidden bg-[var(--pa-surface)] shadow-xl"
            >
              <div className="flex h-[var(--shell-topbar-h)] shrink-0 items-center justify-between border-b border-[var(--pa-border)] px-3">
                <span className="text-sm font-bold text-[var(--pa-ink)]">{t("Menu")}</span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label={t("Chiudi")}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
                  onClick={() => {
                    setOpen(false);
                    menuBtnRef.current?.focus();
                  }}
                >
                  <X size={22} />
                </button>
              </div>
              {nav}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--pa-border)] bg-white/95 backdrop-blur">
            <div className="flex h-[var(--shell-topbar-h)] items-center gap-3 px-3 sm:px-4">
              <button
                ref={menuBtnRef}
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)] lg:hidden"
                aria-label={t("Apri menu sezioni")}
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <Menu size={22} />
              </button>

              <button
                type="button"
                onClick={goHome}
                className="inline-flex h-9 shrink-0 items-center lg:hidden"
                aria-label={t("Home Cruscotto San Vincenzo")}
              >
                <Image
                  src={STEMMA.src}
                  alt=""
                  width={32}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </button>

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 lg:max-w-[14rem] xl:max-w-none">
                <h1
                  id={titleId}
                  className="m-0 truncate text-base font-bold leading-tight text-[var(--pa-ink)]"
                >
                  <button
                    type="button"
                    onClick={goHome}
                    className="m-0 truncate bg-transparent p-0 text-left text-base font-bold leading-tight text-[var(--pa-ink)] lg:hidden"
                    aria-label={t("Torna alla home")}
                  >
                    Cruscotto {COMUNE_NOME}
                  </button>
                  <span className="hidden lg:inline">
                    {active?.label ?? `Cruscotto ${COMUNE_NOME}`}
                  </span>
                </h1>
                <p className="m-0 truncate text-xs leading-tight text-[var(--pa-muted)]">
                  {generatedAt
                    ? `${t("Aggiornato")} ${formatDateTime(generatedAt)}`
                    : t("Dati Cruscotto Italia (AgID)")}
                  {" · "}
                  <a
                    href={`mailto:${AUTHOR.email}`}
                    className="text-[var(--pa-primary)] underline-offset-2 hover:underline"
                  >
                    {t("Contatti")}
                  </a>
                </p>
              </div>
              <GlobalSearch onNavigate={go} />
              <LanguageSelector compact />
            </div>
            <div className="border-t border-[var(--pa-border)] px-3 py-2 sm:hidden">
              <GlobalSearch onNavigate={go} mobile />
            </div>
            <div className="bg-[var(--pa-primary)] px-3 py-2 text-xs font-semibold leading-snug text-white sm:px-4 sm:text-sm">
              {t(
                "Progetto non ufficiale: non affiliato ad AgID, al Governo italiano o al Comune di San Vincenzo.",
              )}
            </div>
          </header>

          <main
            id="contenuto-principale"
            className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
            aria-labelledby={titleId}
          >
            {children}
          </main>
        </div>
      </div>

      {footer}
    </div>
  );
}
