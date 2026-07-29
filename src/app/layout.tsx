import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { AUTHOR, COMUNE_NOME } from "@/lib/constants";
import "./globals.css";

const titillium = Titillium_Web({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: `Cruscotto ${COMUNE_NOME} | Dati aperti`,
  description:
    "Dashboard indipendente dei dati aperti del Comune di San Vincenzo (LI), alimentata da Cruscotto Italia (AgID).",
  authors: [{ name: AUTHOR.name, url: `mailto:${AUTHOR.email}` }],
  other: {
    author: AUTHOR.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <meta name="author" content={AUTHOR.name} />
      </head>
      <body className={`${titillium.variable} flex min-h-screen flex-col antialiased`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
