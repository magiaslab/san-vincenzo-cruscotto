import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#d9e6f2] bg-[#003366] text-white" role="contentinfo">
      <div className="px-3 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="m-0 text-sm font-bold">
              Cruscotto {COMUNE_NOME} ({COMUNE_PROVINCIA})
            </p>
            <p className="mb-0 mt-1 text-xs opacity-90 sm:text-sm">
              Progetto indipendente su dati{" "}
              <a
                className="text-white underline"
                href={CRUSCOTTO_ITALIA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cruscotto Italia (AgID)
              </a>
              . Realizzato da{" "}
              <a className="text-white underline" href={`mailto:${AUTHOR.email}`}>
                {AUTHOR.name}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
            <Link
              href="/attribuzioni"
              className="font-semibold text-white underline underline-offset-2"
            >
              Attribuzioni e regole
            </Link>
            <a
              href={`mailto:${AUTHOR.email}`}
              className="text-white underline underline-offset-2"
            >
              Contatti
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#00264d] px-3 py-2.5 text-xs opacity-90 sm:px-5 lg:px-6">
        <strong>Progetto non ufficiale:</strong> non affiliato ad AgID, al
        Governo italiano o al Comune di San Vincenzo.
      </div>
    </footer>
  );
}
