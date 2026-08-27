import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { COMUNE_NOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Fonti non disponibili",
  description: `Fonti open data cercate e non collegate al Cruscotto ${COMUNE_NOME}. Verifica 27 agosto 2026.`,
  alternates: { canonical: "/fonti-non-disponibili" },
};

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

export default function FontiNonDisponibiliPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <h1 className="m-0 text-2xl font-bold text-[var(--pa-ink)]">
            Fonti verificate e non disponibili
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--pa-muted)] sm:text-base">
            Verifica del 27 agosto 2026 su {COMUNE_NOME} (ISTAT 049018). Queste
            fonti sono state cercate e non hanno un dataset riusabile a scala
            comunale. I flag in configurazione restano dove già esistono: il
            pannello resta vuoto, non in errore.
          </p>
          <div className="mt-6 overflow-x-auto panel">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <caption className="sr-only">
                Fonti non collegate al cruscotto
              </caption>
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                    Tema
                  </th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                    Esito
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
          <p className="mt-4 text-sm">
            Catalogo delle fonti attive: <Link href="/dati">/dati</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
