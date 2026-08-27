import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl, buildOgImages } from "@/lib/seo";

const PAGE_DESCRIPTION =
  "I cruscotti comunali già online (San Vincenzo, Campiglia Marittima) e quelli in lavorazione. Progetto indipendente, non ufficiale.";

export const metadata: Metadata = {
  title: "Cruscotti online",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/esempi" },
  openGraph: {
    title: `Cruscotti online | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/esempi"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — cruscotti online`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Cruscotti online | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: { index: true, follow: true },
};

export default function EsempiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
