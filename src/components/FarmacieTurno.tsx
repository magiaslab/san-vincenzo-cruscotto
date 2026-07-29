"use client";

import { useEffect, useState } from "react";
import { Phone, MapPin, ExternalLink, Clock, Pill } from "lucide-react";
import {
  DataUnavailable,
  LoadingBlock,
  PanelHeading,
  SolidButton,
} from "@/components/ui";
import { FARMACIE_DI_TURNO_URL } from "@/lib/constants";

type FarmaciaTurno = {
  nome: string;
  indirizzo: string;
  comune: string;
  cap: string;
  provincia: string;
  apertura: string;
  turno: string;
  distanza_km: number | null;
  telefono: string | null;
  url_scheda: string | null;
  url_orario: string | null;
};

type TurnoResponse = {
  giorno?: string | null;
  orario_riferimento?: string | null;
  farmacie?: FarmaciaTurno[];
  fonte?: { nome?: string; url?: string };
  fetched_at?: string;
  error?: string;
};

const DISPLAY_LIMIT = 12;

function formatKm(km: number | null): string {
  if (km == null || Number.isNaN(km)) return "n.d.";
  return `${km.toLocaleString("it-IT", { maximumFractionDigits: 1 })} km`;
}

export function FarmacieTurno() {
  const [data, setData] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/farmacie/turno?_=${Date.now()}`, { cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json()) as TurnoResponse;
        if (!r.ok && (!json.farmacie || json.farmacie.length === 0)) {
          throw new Error(json.error || "Errore caricamento");
        }
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setError(
          json.error && (!json.farmacie || json.farmacie.length === 0)
            ? String(json.error)
            : null,
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Farmacie di turno non disponibili",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const farmacie = Array.isArray(data?.farmacie) ? data.farmacie : [];
  const shown = farmacie.slice(0, DISPLAY_LIMIT);
  const fonteUrl = data?.fonte?.url || FARMACIE_DI_TURNO_URL;
  const fonteNome = data?.fonte?.nome || "FarmacieDiTurno.org";

  return (
    <div className="panel">
      <PanelHeading
        title="Farmacie di turno"
        description={
          [
            data?.giorno ? `Giorno: ${data.giorno}` : "Turni più vicini a San Vincenzo",
            data?.orario_riferimento
              ? `riferimento ore ${data.orario_riferimento}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        icon={Pill}
        actions={
          <SolidButton onClick={() => setTick((t) => t + 1)}>Aggiorna</SolidButton>
        }
      />

      {loading ? <LoadingBlock label="Caricamento farmacie di turno…" /> : null}

      {!loading && error && shown.length === 0 ? (
        <DataUnavailable message={error} />
      ) : null}

      {!loading && shown.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {shown.map((f) => (
            <li
              key={`${f.nome}-${f.comune}-${f.telefono ?? f.url_scheda}`}
              className="rounded-lg border border-[#d9e6f2] bg-[#f8fbff] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="m-0 text-base font-bold text-[#17324d]">
                  {f.nome}
                </p>
                <span className="shrink-0 rounded bg-[#e8f0fa] px-2 py-0.5 text-xs font-semibold text-[#0066CC]">
                  {formatKm(f.distanza_km)}
                </span>
              </div>
              <p className="m-0 mt-1 flex items-start gap-1.5 text-sm text-[#5b6f82]">
                <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  {f.indirizzo}
                  {f.indirizzo ? " — " : null}
                  {f.cap ? `${f.cap} ` : null}
                  {f.comune}
                  {f.provincia ? ` (${f.provincia})` : null}
                </span>
              </p>
              {f.apertura || f.turno ? (
                <p className="m-0 mt-2 flex items-start gap-1.5 text-sm text-[#17324d]">
                  <Clock size={14} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    {f.apertura ? <>Apertura: {f.apertura}</> : null}
                    {f.apertura && f.turno ? <br /> : null}
                    {f.turno ? <>Turno: {f.turno}</> : null}
                  </span>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {f.telefono ? (
                  <a
                    href={`tel:${f.telefono}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#0066CC] no-underline"
                  >
                    <Phone size={14} aria-hidden />
                    {f.telefono}
                  </a>
                ) : null}
                {f.url_scheda ? (
                  <a
                    href={f.url_scheda}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5b6f82] underline"
                  >
                    Scheda
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
                {f.url_orario ? (
                  <a
                    href={f.url_orario}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5b6f82] underline"
                  >
                    Orario
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && farmacie.length > DISPLAY_LIMIT ? (
        <p className="mb-0 mt-3 text-xs text-[#5b6f82]">
          Mostrate le {DISPLAY_LIMIT} più vicine su {farmacie.length}{" "}
          risultanti dalla ricerca.
        </p>
      ) : null}

      <p className="mb-0 mt-3 text-xs text-[#5b6f82]">
        Fonte:{" "}
        <a
          href={fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {fonteNome}
        </a>
        . Verificare sempre il cartello turni fuori dalla farmacia.
        {data?.fetched_at
          ? ` Aggiornato: ${new Date(data.fetched_at).toLocaleString("it-IT")}.`
          : null}
      </p>
    </div>
  );
}
