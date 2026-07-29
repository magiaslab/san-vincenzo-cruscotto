"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, type LucideIcon } from "lucide-react";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  STEMMA,
} from "@/lib/constants";

export type NavItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

type AppShellProps = {
  items: readonly NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  generatedAt?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export function AppShell({
  items,
  activeId,
  onNavigate,
  generatedAt,
  children,
  footer,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const active = items.find((i) => i.id === activeId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nav = (
    <nav aria-label="Sezioni del cruscotto" className="flex h-full flex-col">
      <div className="hidden border-b border-[#d9e6f2] px-4 py-4 lg:block">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src={STEMMA.src}
            alt={STEMMA.alt}
            width={40}
            height={50}
            className="h-10 w-auto"
            priority
          />
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold leading-tight text-[#17324d]">
              Cruscotto {COMUNE_NOME}
            </p>
            <p className="m-0 mt-0.5 text-xs text-[#5b6f82]">
              {COMUNE_PROVINCIA} · dati aperti
            </p>
          </div>
        </Link>
      </div>

      <ul className="m-0 flex-1 list-none space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.Icon;
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => go(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#0066CC] text-white"
                    : "text-[#17324d] hover:bg-[#e8f2fc]"
                }`}
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#d9e6f2] p-3 text-xs text-[#5b6f82]">
        <p className="m-0 mb-2">
          Progetto indipendente · non ufficiale
        </p>
        <Link
          href="/attribuzioni"
          className="font-semibold text-[#0066CC] underline underline-offset-2"
          onClick={() => setOpen(false)}
        >
          Attribuzioni e regole
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f2f7fb]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 border-r border-[#d9e6f2] bg-white lg:block">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            className="absolute inset-0 bg-[#17324d]/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#d9e6f2] px-3 py-3">
              <span className="text-sm font-bold text-[#17324d]">Menu</span>
              <button
                type="button"
                aria-label="Chiudi"
                className="rounded-lg p-2 text-[#17324d] hover:bg-[#e8f2fc]"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#d9e6f2] bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
            <button
              type="button"
              className="rounded-lg p-2 text-[#17324d] hover:bg-[#e8f2fc] lg:hidden"
              aria-label="Apri menu sezioni"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>

            <Link href="/" className="shrink-0 lg:hidden" aria-label="Home">
              <Image
                src={STEMMA.src}
                alt=""
                width={32}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-bold text-[#17324d] sm:text-base">
                <span className="lg:hidden">Cruscotto {COMUNE_NOME}</span>
                <span className="hidden lg:inline">
                  {active?.label ?? "Cruscotto"}
                </span>
              </p>
              <p className="m-0 truncate text-xs text-[#5b6f82]">
                {generatedAt
                  ? `Aggiornato ${new Date(generatedAt).toLocaleString("it-IT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
                  : "Dati Cruscotto Italia (AgID)"}
                {" · "}
                <a
                  href={`mailto:${AUTHOR.email}`}
                  className="text-[#0066CC] underline-offset-2 hover:underline"
                >
                  Contatti
                </a>
              </p>
            </div>
          </div>
          <div className="bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white sm:px-4">
            Progetto indipendente · non ufficiale · dati aperti
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </main>

        {footer}
      </div>
    </div>
  );
}
