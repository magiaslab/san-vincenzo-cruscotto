"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useT } from "@/lib/i18n";
import {
  isProjectNavActive,
  visibleProjectNav,
} from "@/lib/project-pages";

export function ProjectNav() {
  const t = useT();
  const pathname = usePathname() || "/";
  const items = visibleProjectNav();

  return (
    <nav
      aria-label={t("Pagine del progetto")}
      className="project-nav sticky top-0 z-30 border-b border-[var(--pa-border)] bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-5xl list-none gap-1 overflow-x-auto px-3 py-2 sm:px-6">
        {items.map((item) => {
          const active = isProjectNavActive(item.href, pathname);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold no-underline transition ${
                  active
                    ? "bg-[var(--pa-primary)] text-white"
                    : "text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
                }`}
                style={active ? { color: "#ffffff" } : undefined}
              >
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Layout condiviso delle pagine di progetto (minisito). */
export function ProjectShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <ProjectNav />
      <main id="contenuto-principale" className="flex-1">
        <div
          className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 ${
            wide ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
