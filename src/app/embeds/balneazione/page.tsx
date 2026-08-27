"use client";

import { useEffect, useState } from "react";
import { COMUNE_NOME } from "@/lib/constants";

type Area = { nome?: string; classificazione?: string; classe?: string };

export default function EmbedBalneazionePage() {
  const [aree, setAree] = useState<Area[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/arpat/balneazione")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((json) => {
        setAree(Array.isArray(json?.aree) ? json.aree : []);
      })
      .catch(() => setErr("Dati di balneazione non disponibili."));
  }, []);

  return (
    <main>
      <h1 className="m-0 mb-3 text-lg font-bold">
        Balneazione a {COMUNE_NOME}
      </h1>
      {err ? <p>{err}</p> : null}
      {aree.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0 text-sm">
          {aree.map((a) => (
            <li key={String(a.nome)}>
              <strong>{a.nome}</strong>: {a.classificazione ?? a.classe ?? "n.d."}
            </li>
          ))}
        </ul>
      ) : !err ? (
        <p>Caricamento…</p>
      ) : null}
    </main>
  );
}
