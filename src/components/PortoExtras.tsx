"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Camera, Ship } from "lucide-react";
import {
  DataUnavailable,
  LoadingBlock,
  PanelHeading,
  SolidButton,
  SolidLink,
} from "@/components/ui";

type CameraItem = { id: string; nome: string; url: string };

export function PortoWebcams() {
  const t = useT();
  const [camere, setCamere] = useState<CameraItem[]>([]);
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
      <PanelHeading
        title={t("Webcam porto")}
        icon={Camera}
        actions={
          <SolidButton onClick={() => setTick((t) => t + 1)}>Aggiorna</SolidButton>
        }
      />
      {loading ? <LoadingBlock label={t("Caricamento webcam…")} /> : null}
      {error && camere.length === 0 ? <DataUnavailable message={error} /> : null}
      {camere.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {camere.map((c) => (
            <figure key={c.id} className="m-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${c.url}?t=${tick}`}
                alt={c.nome}
                className="h-56 w-full rounded-md bg-[var(--pa-surface-soft)] object-cover"
                loading="lazy"
              />
              <figcaption className="mt-2 text-sm text-[var(--pa-muted)]">
                {c.nome}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
        Fonte:{" "}
        <a href={fonteUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Webcam ufficiali del Comune
        </a>{" "}
        (aggiornamento circa ogni 5 minuti).
      </p>
    </div>
  );
}

export function VesselFinderEmbed() {
  const t = useT();
  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Traffico nautico AIS (VesselFinder)")}
          description={t("Mappa embed gratuita centrata sul porto. Non richiede API key; i dati AIS raw via API VesselFinder sono invece a pagamento.")}
          icon={Ship}
          actions={
            <SolidLink href="https://www.vesselfinder.com/">VesselFinder</SolidLink>
          }
          className="mb-0"
        />
      </div>
      <div className="relative z-0 overflow-hidden">
        <iframe
          title={t("VesselFinder — Porto di San Vincenzo")}
          src="/embeds/vesselfinder-porto.html"
          className="h-[480px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
        ©{" "}
        <a
          href="https://www.vesselfinder.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          VesselFinder.com
        </a>{" "}
        ·{" "}
        <a
          href="https://www.vesselfinder.com/embed"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          Informazioni sull&apos;embed
        </a>
      </p>
    </div>
  );
}
