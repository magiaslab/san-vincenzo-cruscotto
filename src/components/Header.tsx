import Image from "next/image";
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
};

export function Header({ generatedAt }: HeaderProps) {
  return (
    <header className="site-header relative z-40 bg-white shadow-sm">
      {/* Slim bar */}
      <div className="bg-[#0066CC] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
          <span className="font-semibold tracking-wide">
            Progetto indipendente · dati Cruscotto Italia (AgID)
          </span>
          <a
            className="text-white underline-offset-2 hover:underline"
            href={`mailto:${AUTHOR.email}`}
          >
            Contatti
          </a>
        </div>
      </div>

      {/* Center: stemma + titolo (senza attribuzione logo, spostata in footer) */}
      <div className="border-b border-[#d9e6f2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Image
            src={STEMMA.src}
            alt={STEMMA.alt}
            width={44}
            height={55}
            priority
            className="h-[55px] w-auto shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-2xl font-bold leading-tight text-[#17324d] md:text-3xl">
              Cruscotto {COMUNE_NOME}
            </h1>
            <p className="m-0 mt-1 text-sm text-[#5b6f82]">
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
