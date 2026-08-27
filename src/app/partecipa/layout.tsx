import type { Metadata } from "next";
import { COMUNE_NOME } from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";

const PAGE_DESCRIPTION =
  `Suggerimenti, segnalazioni e partecipazione al ${SITE_NAME}: come proporre miglioramenti sui dati aperti di ${COMUNE_NOME}.`;

export const metadata: Metadata = {
  title: "Partecipa",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/partecipa",
  },
  openGraph: {
    title: `Partecipa | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/partecipa"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — partecipa`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Partecipa | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PartecipaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
