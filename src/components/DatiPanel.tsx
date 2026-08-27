"use client";

import { Database } from "lucide-react";
import { FONTI_NON_DISPONIBILI_DOC, fontiAttive } from "@/lib/fonti";
import { useT } from "@/lib/i18n";
import { OutlineLink, PanelHeading, SectionIntro } from "@/components/ui";

export function DatiPanel() {
  const t = useT();
  const fonti = fontiAttive();

  return (
    <section>
      <SectionIntro
        title={t("Dati aperti")}
        description={t(
          "Catalogo delle fonti usate dal cruscotto, con export JSON/CSV pubblici. Progetto indipendente, non ufficiale.",
        )}
      />
      <PanelHeading
        title={t("Dataset esportabili")}
        description={t(
          "Le route /api/pubblico/* sono indicizzabili. Il resto di /api/ resta in robots.txt.",
        )}
        icon={Database}
      />
      <div className="mb-4 overflow-x-auto panel">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <caption className="sr-only">{t("Catalogo fonti")}</caption>
          <thead className="bg-[#e8f2fc] text-[#17324d]">
            <tr>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Fonte")}
              </th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Ente")}
              </th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Ambito")}
              </th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Export")}
              </th>
            </tr>
          </thead>
          <tbody>
            {fonti.map((f) => (
              <tr key={f.id} className="border-t border-[#eef2f5]">
                <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.nome}
                    </a>
                  ) : (
                    f.nome
                  )}
                  <span className="mt-1 block text-xs font-normal text-[var(--pa-muted)]">
                    {f.nota}
                  </span>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">{f.ente}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {f.ambito === "nazionale" ? t("Nazionale") : t("Opzionale")}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {f.exportApi ? (
                    <span className="flex flex-wrap gap-2">
                      <a href={`${f.exportApi}?format=json`}>JSON</a>
                      <a href={`${f.exportApi}?format=csv`}>CSV</a>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <OutlineLink href="/eventi.ics" external={false}>
          {t("Calendario eventi (.ics)")}
        </OutlineLink>
        <OutlineLink href={FONTI_NON_DISPONIBILI_DOC} external={false}>
          {t("Fonti verificate ma non disponibili")}
        </OutlineLink>
      </div>
    </section>
  );
}
