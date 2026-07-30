"use client";

import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
} from "@/lib/constants";
import { useT } from "@/lib/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer
      className="mt-auto w-full border-t border-[color-mix(in_srgb,white_15%,transparent)] bg-[var(--pa-footer)] text-white"
      role="contentinfo"
    >
      <div className="px-3 py-5 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="max-w-2xl">
            <p className="m-0 text-sm font-bold tracking-tight">
              Cruscotto {COMUNE_NOME} ({COMUNE_PROVINCIA})
            </p>
            <p className="mb-0 mt-1.5 text-xs leading-relaxed text-[var(--pa-footer-muted)] sm:text-sm">
              {t("Progetto indipendente su dati")}{" "}
              <a
                className="font-semibold text-white underline underline-offset-2"
                href={CRUSCOTTO_ITALIA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cruscotto Italia (AgID)
              </a>
              . {t("Realizzato da")}{" "}
              <a
                className="font-semibold text-white underline underline-offset-2"
                href={`mailto:${AUTHOR.email}`}
              >
                {AUTHOR.name}
              </a>
              .
            </p>
          </div>
          <nav
            aria-label={t("Link di piè di pagina")}
            className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
          >
            <Link
              href="/attribuzioni"
              className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-2"
            >
              {t("Attribuzioni e regole")}
            </Link>
            <Link
              href="/#partecipa"
              className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-2"
            >
              {t("Suggerimenti")}
            </Link>
            <a
              href={`mailto:${AUTHOR.email}`}
              className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-2"
            >
              {t("Contatti")}
            </a>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/15 bg-[var(--pa-footer-deep)] px-3 py-3 text-xs leading-relaxed text-[var(--pa-footer-muted)] sm:px-5 lg:px-6">
        <strong className="text-white">{t("Progetto non ufficiale:")}</strong>{" "}
        {t(
          "non affiliato ad AgID, al Governo italiano o al Comune di San Vincenzo.",
        )}
      </div>
    </footer>
  );
}
