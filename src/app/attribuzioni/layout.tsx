import type { Metadata } from "next";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";

const ATTRIBUZIONI_DESCRIPTION =
  `Fonti dati, licenze, attribuzioni e regole d'uso del ${SITE_NAME}: Cruscotto Italia (AgID), ARPAT, MIUR, OpenStreetMap e altre fonti open.`;

export const metadata: Metadata = {
  title: "Attribuzioni e regole",
  description: ATTRIBUZIONI_DESCRIPTION,
  alternates: {
    canonical: "/attribuzioni",
  },
  openGraph: {
    title: `Attribuzioni e regole | ${SITE_NAME}`,
    description: ATTRIBUZIONI_DESCRIPTION,
    url: absoluteUrl("/attribuzioni"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — attribuzioni e regole`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Attribuzioni e regole | ${SITE_NAME}`,
    description: ATTRIBUZIONI_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AttribuzioniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
