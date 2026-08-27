import type { Metadata } from "next";
import { MenzioniContent } from "@/components/landing/MenzioniContent";
import { SiteChrome } from "@/components/SiteChrome";
import { SITE_NAME, absoluteUrl, buildOgImages } from "@/lib/seo";

const PAGE_DESCRIPTION =
  "Come citare Cruscotto Comune nei fork: crediti all’autore, disclaimer non ufficiale, testi per README e footer.";

export const metadata: Metadata = {
  title: "Menzioni",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/menzioni" },
  openGraph: {
    title: `Menzioni | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/menzioni"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — guida alle menzioni`),
  },
};

export default function MenzioniPage() {
  return (
    <SiteChrome>
      <MenzioniContent />
    </SiteChrome>
  );
}
