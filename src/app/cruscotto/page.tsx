import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";
import { getProductName } from "@/lib/product";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Dashboard | ${getProductName()}`,
  description:
    "Anteprima della dashboard comunale. Senza ISTAT configurato mostra la guida di avvio, non i dati di un altro ente.",
  alternates: { canonical: "/cruscotto" },
};

export default async function CruscottoPage() {
  return <DashboardView />;
}
