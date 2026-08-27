import { isSostieniEnabled } from "@/lib/sostieni";

export type ProjectNavItem = {
  href: string;
  label: string;
  /** Voce visibile solo se il modulo Supporto è attivo. */
  sostieni?: boolean;
};

/** Navigazione del minisito (pagine di progetto, fuori dalla dashboard dati). */
export const PROJECT_NAV_ITEMS: ProjectNavItem[] = [
  { href: "/", label: "Cruscotto" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/esempi", label: "Cruscotti online" },
  { href: "/riusa", label: "Porta nel tuo comune" },
  { href: "/sostieni", label: "Supporto", sostieni: true },
  { href: "/partecipa", label: "Partecipa" },
  { href: "/attribuzioni", label: "Attribuzioni" },
];

export function visibleProjectNav(): ProjectNavItem[] {
  return PROJECT_NAV_ITEMS.filter((item) => !item.sostieni || isSostieniEnabled());
}

export function isProjectNavActive(href: string, pathname: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (href === "/") return clean === "/";
  return clean === href || clean.startsWith(`${href}/`);
}
