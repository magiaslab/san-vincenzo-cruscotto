import type { Metadata } from "next";
import { FontiContent } from "@/components/landing/FontiContent";
import { SiteChrome } from "@/components/SiteChrome";
import { SITE_NAME, absoluteUrl, buildOgImages } from "@/lib/seo";

const PAGE_DESCRIPTION =
  "Catalogo delle fonti open data del cruscotto: nucleo nazionale (ISTAT/AgID) e moduli opzionali regionali o locali.";

export const metadata: Metadata = {
  title: "Fonti",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/fonti" },
  openGraph: {
    title: `Fonti | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/fonti"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — fonti open data`),
  },
};

export default function FontiPage() {
  return (
    <SiteChrome>
      <FontiContent />
    </SiteChrome>
  );
}
