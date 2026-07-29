import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
  OSM_COPYRIGHT_URL,
  STEMMA,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="it-footer mt-auto" role="contentinfo">
      <div className="it-footer-main bg-[#003366] text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <h3 className="h5 text-white mb-3">
                Cruscotto {COMUNE_NOME} ({COMUNE_PROVINCIA})
              </h3>
              <p className="small mb-2 opacity-90">
                Progetto indipendente che riaggrega dati aperti del{" "}
                <a
                  className="text-white text-decoration-underline"
                  href={CRUSCOTTO_ITALIA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cruscotto Italia (AgID)
                </a>
                .
              </p>
              <p className="small mb-0">
                Realizzato da{" "}
                <a
                  className="text-white text-decoration-underline"
                  href={`mailto:${AUTHOR.email}`}
                >
                  {AUTHOR.name}
                </a>
              </p>
            </div>
            <div className="col-12 col-md-6">
              <h3 className="h5 text-white mb-3">Attribuzioni</h3>
              <ul className="list-unstyled small opacity-90 space-y-2">
                <li>
                  ©{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={OSM_COPYRIGHT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenStreetMap contributors
                  </a>
                </li>
                <li>
                  {STEMMA.attribution} —{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={STEMMA.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    CC BY-NC-ND 3.0 IT
                  </a>
                </li>
                <li>Licenza contenuti dati: CC-BY 4.0 (ove non diversamente indicato).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="it-footer-small-prints bg-[#00264d] text-white">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 text-sm opacity-90 sm:px-6">
          <p className="mb-0">
            <strong>Dati:</strong> Cruscotto Italia (AgID) — fonti ANAC, BDAP-MOP,
            SIOPE, Italia Domani, ISTAT, ISPRA, MIUR, ACI, MEF, GSE/MASE, AGCOM,
            MIMIT, Ministero del Lavoro, Ministero della Salute, Agenzia delle
            Entrate, Protezione Civile, ItaliaMeteo/Cineca. Licenza contenuti
            CC-BY 4.0.{" "}
            <a
              className="text-white text-decoration-underline"
              href={CRUSCOTTO_ITALIA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              cruscotto-italia.dati.gov.it
            </a>
          </p>
          <p className="mb-0">
            <strong>Progetto non ufficiale:</strong> Questo sito è un progetto
            indipendente, non affiliato ad AgID, al Governo italiano o al Comune
            di San Vincenzo. Utilizza dati pubblici aperti riaggregati dal
            progetto Cruscotto Italia.
          </p>
          <p className="mb-0">
            <strong>Accuratezza dei dati:</strong> I dati sono riportati così
            come pubblicati dalle fonti ufficiali al momento dell&apos;ultima
            estrazione, senza garanzia di completezza, correttezza o
            aggiornamento in tempo reale. Per usi ufficiali o legali fare sempre
            riferimento alle fonti primarie citate.
          </p>
          <p className="mb-0">
            <strong>Tassa di soggiorno:</strong> La tassa/imposta di soggiorno
            non è inclusa: non fa parte delle fonti federate da Cruscotto
            Italia, in quanto tariffa deliberata autonomamente dal comune. Per
            informazioni ufficiali consultare il sito istituzionale del comune.
          </p>
          <p className="mb-0">
            <strong>Licenza stemma:</strong> {STEMMA.attribution} —{" "}
            <a
              className="text-white text-decoration-underline"
              href={STEMMA.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              https://creativecommons.org/licenses/by-nc-nd/3.0/it/
            </a>
          </p>
          <p className="mb-0">
            Realizzato da{" "}
            <a
              className="text-white text-decoration-underline"
              href={`mailto:${AUTHOR.email}`}
            >
              {AUTHOR.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
