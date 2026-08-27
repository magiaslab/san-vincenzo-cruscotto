import type { Metadata } from "next";
import { COMUNE_NOME } from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";
import { isSostieniEnabled } from "@/lib/sostieni";

const PAGE_DESCRIPTION =
  `Sostieni il ${SITE_NAME}: contributo volontario su Buy Me a Coffee per hosting e compute, e ringraziamenti pubblici. Progetto indipendente, non affiliato al Comune di ${COMUNE_NOME}.`;

export const metadata: Metadata = {
  title: "Sostieni il cruscotto",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/sostieni",
  },
  openGraph: {
    title: `Sostieni | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/sostieni"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — sostieni il progetto`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Sostieni | ${SITE_NAME}`,
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
