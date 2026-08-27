"use client";

import { AllerteMeteoPanel } from "@/components/AllerteMeteoPanel";
import { COMUNE_NOME } from "@/lib/constants";

export default function EmbedMeteoPage() {
  return (
    <main>
      <h1 className="m-0 mb-3 text-lg font-bold">Meteo e allerte a {COMUNE_NOME}</h1>
      <AllerteMeteoPanel />
    </main>
  );
}
