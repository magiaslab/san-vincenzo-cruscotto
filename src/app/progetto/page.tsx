import type { Metadata } from "next";
import { ProgettoContent } from "@/components/landing/ProgettoContent";
import { SiteChrome } from "@/components/SiteChrome";
import { getProductName } from "@/lib/product";
import { SITE_NAME, absoluteUrl, buildOgImages } from "@/lib/seo";

const PAGE_DESCRIPTION = `Cos’è ${getProductName()}: template open source per dashboard di dati aperti comunali, indipendente e riusabile.`;

export const metadata: Metadata = {
  title: "Progetto",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/progetto" },
  openGraph: {
    title: `Progetto | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/progetto"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — il progetto`),
  },
};

export default function ProgettoPage() {
  return (
    <SiteChrome>
      <ProgettoContent />
    </SiteChrome>
  );
}
