"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SkipLink } from "@/components/SkipLink";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  ISTAT_CODE,
  STEMMA,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

type HeaderProps = {
  generatedAt?: string | null;
  /** Se false, il titolo brand non usa h1 (pagine con h1 proprio). */
  brandAsHeading?: boolean;
};

export function Header({ generatedAt, brandAsHeading = true }: HeaderProps) {
  const t = useT();
  const BrandTag = brandAsHeading ? "h1" : "p";
  return (
    <header className="site-header relative z-40 bg-white shadow-sm">
      <SkipLink />
      <div className="bg-[var(--pa-primary)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-1.5 px-4 py-2 text-xs sm:flex-row sm:items-center sm:gap-2 sm:text-sm sm:px-6">
          <span className="font-semibold leading-snug tracking-wide">
            {t(
              "Progetto non ufficiale: non affiliato ad AgID, al Governo italiano o al Comune di San Vincenzo.",
            )}
          </span>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <a
              className="inline-flex min-h-11 shrink-0 items-center text-white underline-offset-2 hover:underline"
              href={`mailto:${AUTHOR.email}`}
            >
              {t("Contatti")}
            </a>
            <LanguageSelector
              className="[&_button]:border-white/40 [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/20"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--pa-border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label={t("Torna alla home")}>
            <Image
              src={STEMMA.src}
              alt={STEMMA.alt}
              width={44}
              height={55}
              priority
              className="h-[44px] w-auto sm:h-[55px]"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <BrandTag className="m-0 text-xl font-bold leading-tight text-[var(--pa-ink)] sm:text-2xl md:text-3xl">
              <Link href="/" className="text-inherit no-underline hover:underline">
                Cruscotto {COMUNE_NOME}
              </Link>
            </BrandTag>
            <p className="m-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {t("Provincia di")} {COMUNE_PROVINCIA} · {COMUNE_REGIONE} ·
              ISTAT {ISTAT_CODE}
              {generatedAt
                ? ` · ${t("agg.")} ${formatDateTime(generatedAt)}`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
