"use client";

import { useEffect, useState } from "react";
import { DataUnavailable, LoadingBlock } from "@/components/ui";

type Camera = { id: string; nome: string; url: string };

export function PortoWebcams() {
  const [camere, setCamere] = useState<Camera[]>([]);
  const [fonteUrl, setFonteUrl] = useState(
    "https://lnx.comune.sanvincenzo.li.it/webcam/",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/porto/webcam?_=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCamere(Array.isArray(data.camere) ? data.camere : []);
        if (data?.fonte?.url) setFonteUrl(String(data.fonte.url));
        if (data.error && (!data.camere || data.camere.length === 0)) {
          setError(String(data.error));
        } else {
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Webcam non disponibili");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0">Webcam porto</h3>
        <button
          type="button"
          className="rounded-full bg-[#0066CC] px-3 py-1 text-sm font-semibold text-white"
          onClick={() => setTick((t) => t + 1)}
        >
          Aggiorna
        </button>
      </div>
      {loading ? <LoadingBlock label="Caricamento webcam…" /> : null}
      {error && camere.length === 0 ? <DataUnavailable message={error} /> : null}
      {camere.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {camere.map((c) => (
            <figure key={c.id} className="m-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${c.url}?t=${tick}`}
                alt={c.nome}
                className="h-56 w-full rounded-md object-cover bg-[#e8eef4]"
                loading="lazy"
              />
              <figcaption className="mt-2 text-sm text-[#5b6f82]">
                {c.nome}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      <p className="mt-3 mb-0 text-xs text-[#5b6f82]">
        Fonte:{" "}
        <a
          href={fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Comune di San Vincenzo — WebCam
        </a>{" "}
        (aggiornamento circa ogni 5 minuti).
      </p>
    </div>
  );
}

export function VesselFinderEmbed() {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[#d9e6f2] px-4 py-3">
        <h3 className="m-0 text-base font-bold text-[#17324d]">
          Traffico nautico AIS (VesselFinder)
        </h3>
        <p className="m-0 mt-1 text-sm text-[#5b6f82]">
          Mappa embed gratuita centrata sul porto. Non richiede API key; i dati
          AIS raw via API VesselFinder sono invece a pagamento.
        </p>
      </div>
      <iframe
        title="VesselFinder — Porto di San Vincenzo"
        src="/embeds/vesselfinder-porto.html"
        className="h-[480px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="m-0 border-t border-[#d9e6f2] bg-[#f5f8fc] px-4 py-2 text-xs text-[#5b6f82]">
        ©{" "}
        <a
          href="https://www.vesselfinder.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          VesselFinder.com
        </a>{" "}
        ·{" "}
        <a
          href="https://www.vesselfinder.com/embed"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Informazioni sull&apos;embed
        </a>
      </p>
    </div>
  );
}
