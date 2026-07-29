import Image from "next/image";
import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  COMUNE_REGIONE,
  ISTAT_CODE,
  STEMMA,
} from "@/lib/constants";

type HeaderProps = {
  generatedAt?: string | null;
  /** Se false, il titolo brand non usa h1 (pagine con h1 proprio). */
  brandAsHeading?: boolean;
};

export function Header({ generatedAt, brandAsHeading = true }: HeaderProps) {
  const BrandTag = brandAsHeading ? "h1" : "p";
  return (
    <header className="site-header relative z-40 bg-white shadow-sm">
      {/* Slim bar */}
      <div className="bg-[var(--pa-primary)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-1.5 px-4 py-2 text-xs sm:flex-row sm:items-center sm:gap-2 sm:text-sm sm:px-6">
          <span className="font-semibold leading-snug tracking-wide">
            Progetto non ufficiale: non affiliato ad AgID, al Governo italiano o
            al Comune di San Vincenzo.
          </span>
          <a
            className="inline-flex min-h-11 shrink-0 items-center text-white underline-offset-2 hover:underline"
            href={`mailto:${AUTHOR.email}`}
          >
            Contatti
          </a>
        </div>
      </div>

      {/* Center: stemma + titolo (senza attribuzione logo, spostata in footer) */}
      <div className="border-b border-[var(--pa-border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Torna alla home">
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
              Provincia di Livorno ({COMUNE_PROVINCIA}) · {COMUNE_REGIONE} ·
              ISTAT {ISTAT_CODE}
              {generatedAt
                ? ` · agg. ${new Date(generatedAt).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
