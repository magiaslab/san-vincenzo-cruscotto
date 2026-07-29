import Link from "next/link";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="it-footer mt-auto" role="contentinfo">
      <div className="it-footer-main bg-[#003366] text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h3 className="mb-2 text-base font-bold text-white sm:text-lg">
                Cruscotto {COMUNE_NOME} ({COMUNE_PROVINCIA})
              </h3>
              <p className="mb-0 text-sm opacity-90">
                Progetto indipendente che riaggrega dati aperti da{" "}
                <a
                  className="text-white underline"
                  href={CRUSCOTTO_ITALIA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cruscotto Italia (AgID)
                </a>{" "}
                e altre fonti pubbliche. Realizzato da{" "}
                <a
                  className="text-white underline"
                  href={`mailto:${AUTHOR.email}`}
                >
                  {AUTHOR.name}
                </a>
                .
              </p>
            </div>
            <nav aria-label="Informazioni legali" className="shrink-0">
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm sm:flex-row sm:gap-4">
                <li>
                  <Link
                    href="/attribuzioni"
                    className="font-semibold text-white underline underline-offset-2"
                  >
                    Attribuzioni e regole
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${AUTHOR.email}`}
                    className="text-white underline underline-offset-2"
                  >
                    Contatti
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="it-footer-small-prints bg-[#00264d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm opacity-90 sm:px-6">
          <p className="mb-0">
            <strong>Progetto non ufficiale:</strong> questo sito è indipendente
            e non è affiliato ad AgID, al Governo italiano o al Comune di San
            Vincenzo. Usa solo dati pubblici aperti.
          </p>
        </div>
      </div>
    </footer>
  );
}
