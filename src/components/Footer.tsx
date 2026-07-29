import {
  ARPAT_BALNEAZIONE_URL,
  ARPAT_OPENDATA_URL,
  AUTHOR,
  CARTO_ATTRIBUTION_URL,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
  MINISTERO_CULTURA_URL,
  OPEN_METEO_ATTRIBUTION_URL,
  OSM_COPYRIGHT_URL,
  RAINVIEWER_ATTRIBUTION_URL,
  REGIONE_TOSCANA_OPENDATA_URL,
  STEMMA,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="it-footer mt-auto" role="contentinfo">
      <div className="it-footer-main bg-[#003366] text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-base font-bold text-white sm:text-lg">
                Cruscotto {COMUNE_NOME} ({COMUNE_PROVINCIA})
              </h3>
              <p className="mb-2 text-sm opacity-90">
                Progetto indipendente che riaggrega dati aperti del{" "}
                <a
                  className="text-white text-decoration-underline"
                  href={CRUSCOTTO_ITALIA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cruscotto Italia (AgID)
                </a>{" "}
                e altre fonti open data regionali e nazionali.
              </p>
              <p className="mb-0 text-sm">
                Realizzato da{" "}
                <a
                  className="text-white text-decoration-underline"
                  href={`mailto:${AUTHOR.email}`}
                >
                  {AUTHOR.name}
                </a>
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-base font-bold text-white sm:text-lg">
                Attribuzioni
              </h3>
              <ul className="list-none space-y-2 p-0 text-sm opacity-90">
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
                  {" · "}
                  Basemap{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={CARTO_ATTRIBUTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    CARTO
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
                <li>
                  Previsioni:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={OPEN_METEO_ATTRIBUTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open-Meteo
                  </a>
                  {" · "}
                  Radar:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={RAINVIEWER_ATTRIBUTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RainViewer
                  </a>
                </li>
                <li>
                  Ambiente:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={ARPAT_OPENDATA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ARPAT
                  </a>{" "}
                  (balneazione, aria)
                </li>
                <li>
                  Eventi e portualità:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={REGIONE_TOSCANA_OPENDATA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Regione Toscana Open Data
                  </a>
                </li>
                <li>
                  Cultura:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href={MINISTERO_CULTURA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ministero della Cultura
                  </a>
                </li>
                <li>
                  Traffico nautico:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href="https://www.vesselfinder.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VesselFinder
                  </a>{" "}
                  (embed mappa AIS) · Webcam porto:{" "}
                  <a
                    className="text-white text-decoration-underline"
                    href="https://lnx.comune.sanvincenzo.li.it/webcam/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Comune di San Vincenzo
                  </a>
                </li>
                <li>
                  Licenza contenuti dati: CC-BY 4.0 (ove non diversamente
                  indicato).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="it-footer-small-prints bg-[#00264d] text-white">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 text-sm opacity-90 sm:px-6">
          <p className="mb-0">
            <strong>Dati Cruscotto Italia (AgID):</strong> fonti ANAC, BDAP-MOP,
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
            <strong>Fonti aggiuntive:</strong>{" "}
            <a
              className="text-white text-decoration-underline"
              href={ARPAT_BALNEAZIONE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              ARPAT
            </a>{" "}
            — acque di balneazione e qualità dell&apos;aria;{" "}
            <a
              className="text-white text-decoration-underline"
              href={REGIONE_TOSCANA_OPENDATA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Regione Toscana Open Data
            </a>{" "}
            — eventi culturali e portualità turistica;{" "}
            <a
              className="text-white text-decoration-underline"
              href={MINISTERO_CULTURA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ministero della Cultura
            </a>{" "}
            — luoghi e beni culturali;{" "}
            <a
              className="text-white text-decoration-underline"
              href={OPEN_METEO_ATTRIBUTION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>{" "}
            — previsioni;{" "}
            <a
              className="text-white text-decoration-underline"
              href={RAINVIEWER_ATTRIBUTION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              RainViewer
            </a>{" "}
            — radar precipitazioni;{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://www.vesselfinder.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              VesselFinder
            </a>{" "}
            — traffico AIS (embed);{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://lnx.comune.sanvincenzo.li.it/webcam/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Comune di San Vincenzo
            </a>{" "}
            — webcam porto;{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://www.piattaformaunicanazionale.it/idr"
              target="_blank"
              rel="noopener noreferrer"
            >
              PUN / IDR
            </a>{" "}
            — punti ricarica EV;{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://www.mimit.gov.it/it/open-data/elenco-dataset/osservatorio-prezzi-carburanti"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIMIT
            </a>{" "}
            — impianti carburanti;{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://geo.agcom.it/agcomapps/BB4/BB4_BBwired_na_app16_4/"
              target="_blank"
              rel="noopener noreferrer"
            >
              AGCOM Broadband Map
            </a>{" "}
            — copertura FTTH; OpenStreetMap — cartografia di base.
          </p>
          <p className="mb-0">
            <strong>Cruscotto Italia:</strong> Progettato e sviluppato da{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://github.com/piersoft"
              target="_blank"
              rel="noopener noreferrer"
            >
              Francesco Piero Paolicelli (Piersoft)
            </a>{" "}
            per AgID - Agenzia per l&apos;Italia Digitale. Codice sorgente{" "}
            <a
              className="text-white text-decoration-underline"
              href="https://github.com/AgID/cruscotto-italia"
              target="_blank"
              rel="noopener noreferrer"
            >
              disponibile su GitHub
            </a>{" "}
            con licenza AGPL-3.0.
          </p>
          <p className="mb-0">
            <strong>Progetto non ufficiale:</strong> Questo sito è un progetto
            indipendente, non affiliato ad AgID, al Governo italiano o al Comune
            di San Vincenzo. Utilizza dati pubblici aperti riaggregati dal
            progetto Cruscotto Italia e dalle fonti citate.
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
