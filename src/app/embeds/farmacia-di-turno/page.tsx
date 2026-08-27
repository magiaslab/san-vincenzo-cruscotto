import type { Metadata } from "next";
import { FarmacieTurno } from "@/components/FarmacieTurno";
import { COMUNE_NOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Farmacia di turno — ${COMUNE_NOME}`,
  robots: { index: false, follow: false },
};

export default function EmbedFarmaciaPage() {
  return (
    <main>
      <h1 className="m-0 mb-3 text-lg font-bold">
        Farmacie di turno a {COMUNE_NOME}
      </h1>
      <FarmacieTurno />
    </main>
  );
}
