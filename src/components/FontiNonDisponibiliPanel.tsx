"use client";

import Link from "next/link";
import { COMUNE_NOME } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { SectionIntro } from "@/components/ui";

const RIGHE: Array<{ tema: string; esito: string }> = [
  {
    tema: "Pronto soccorso / liste d’attesa",
    esito: "Nessun open data comunale. MDS non elenca ospedali in comune.",
  },
  {
    tema: "LaMMA mare",
    esito: "Nessun endpoint pubblico stabile riusabile.",
  },
  {
    tema: "Erosione costiera",
    esito: "Il flag esiste; manca una fonte aggiornata. Non rimosso.",
  },
  {
    tema: "Temperatura del mare Copernicus",
    esito: "Nessun prodotto puntuale comunale senza account/script batch.",
  },
  {
    tema: "Mareografo ISPRA",
    esito: "Nessuna stazione nel comune.",
  },
  {
    tema: "Bandiera Blu (PDF FEE)",
    esito: "Solo PDF nazionale, non filtrabile per ISTAT.",
  },
  {
    tema: "OpenCoesione",
    esito: "Endpoint 403 al momento della verifica (27/08/2026).",
  },
  {
    tema: "GSE / Soldipubblici / WiFi Italia",
    esito: "Nessun dataset comunale riusabile.",
  },
  {
    tema: "BDSR / CIN",
    esito: "Non esposto in open data filtrabile.",
  },
  {
    tema: "Eligendo",
    esito: "Nessuna API stabile per il cruscotto.",
  },
  {
    tema: "Imposta di soggiorno / spiagge accessibili / aree PC",
    esito: "Pagine HTML comunali, non catalogo.",
  },
  {
    tema: "Beni culturali MiC",
    esito: "0 punti con coordinate: empty pulito sulla mappa.",
  },
  {
    tema: "Aria ISPRA",
    esito: "Nessuna centralina in comune: resta ARPAT.",
  },
];

export function FontiNonDisponibiliPanel() {
  const t = useT();

  return (
    <section>
      <SectionIntro
        title={t("Fonti verificate e non disponibili")}
        description={t(
          "Verifica del 27 agosto 2026. Queste fonti sono state cercate e non hanno un dataset riusabile a scala comunale. I flag in configurazione restano dove già esistono: il pannello resta vuoto, non in errore.",
        )}
      />
      <div className="overflow-x-auto panel">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <caption className="sr-only">
            {t("Fonti non collegate al cruscotto")}
          </caption>
          <thead className="bg-[#e8f2fc] text-[#17324d]">
            <tr>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Tema")}
              </th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Esito")}
              </th>
            </tr>
          </thead>
          <tbody>
            {RIGHE.map((r) => (
              <tr key={r.tema} className="border-t border-[#eef2f5]">
                <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                  {r.tema}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">{r.esito}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-[var(--pa-muted)]">
        {t("Catalogo delle fonti attive:")}{" "}
        <Link href="/dati" className="font-semibold text-[var(--pa-primary)] underline underline-offset-2">
          /dati
        </Link>
        {` · ${COMUNE_NOME}.`}
      </p>
    </section>
  );
}
