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

      {/* Center: stemma + titolo */}
      <div className="border-b border-[#d9e6f2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start gap-4 px-4 py-5 sm:px-6">
          <Image
            src={STEMMA.src}
            alt={STEMMA.alt}
            width={48}
            height={60}
            priority
            className="mt-1 h-[60px] w-auto shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-2xl font-bold leading-tight text-[#17324d] md:text-3xl">
              Comune di {COMUNE_NOME}
            </h1>
            <p className="m-0 mt-1 text-sm text-[#5b6f82]">
              Provincia di Livorno ({COMUNE_PROVINCIA}) · {COMUNE_REGIONE} ·
              codice ISTAT {ISTAT_CODE}
            </p>
            {generatedAt ? (
              <p className="m-0 mt-1 text-xs text-[#5b6f82]">
                Dati aggiornati al{" "}
                {new Date(generatedAt).toLocaleString("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
            <p className="m-0 mt-2 max-w-3xl text-[11px] leading-snug text-[#5b6f82]">
              {STEMMA.attribution} —{" "}
              <a
                href={STEMMA.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                licenza
              </a>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
