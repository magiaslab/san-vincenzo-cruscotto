import type { Metadata } from "next";
import { COMUNE_NOME } from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";
import { isSostieniEnabled } from "@/lib/sostieni";

const PAGE_DESCRIPTION =
  `Come sostenere il Cruscotto ${COMUNE_NOME}: un caffè per hosting e dominio, o una segnalazione. Progetto indipendente, non ufficiale.`;

export const metadata: Metadata = {
  title: "Supporto",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/sostieni",
  },
  openGraph: {
    title: `Supporto | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/sostieni"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — supporto`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Supporto | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: isSostieniEnabled(),
    follow: true,
  },
};

export default function SostieniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
