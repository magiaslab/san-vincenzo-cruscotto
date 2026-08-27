import type { Metadata } from "next";
import { COMUNE_NOME } from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";

const PAGE_DESCRIPTION =
  `Come è fatto il Cruscotto ${COMUNE_NOME}: da dove arrivano i dati, cosa non è, domande frequenti. Progetto indipendente, non ufficiale.`;

export const metadata: Metadata = {
  title: "Come funziona",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/come-funziona",
  },
  openGraph: {
    title: `Come funziona | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/come-funziona"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — come funziona`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Come funziona | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ComeFunzionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
