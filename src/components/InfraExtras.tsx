"use client";

type OfficialMapEmbedProps = {
  title: string;
  description: string;
  src: string;
  sourceLabel: string;
  sourceUrl: string;
  height?: number;
};

export function OfficialMapEmbed({
  title,
  description,
  src,
  sourceLabel,
  sourceUrl,
  height = 480,
}: OfficialMapEmbedProps) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#d9e6f2] px-4 py-3">
        <div>
          <h3 className="m-0 text-base font-bold text-[#17324d]">{title}</h3>
          <p className="m-0 mt-1 text-sm text-[#5b6f82]">{description}</p>
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-[#0066CC] px-3 py-1.5 text-sm font-semibold text-white no-underline"
        >
          Apri mappa ufficiale
        </a>
      </div>
      <iframe
        title={title}
        src={src}
        className="w-full border-0 bg-[#e8eef4]"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allow="geolocation; fullscreen"
      />
      <p className="m-0 border-t border-[#d9e6f2] bg-[#f5f8fc] px-4 py-2 text-xs text-[#5b6f82]">
        Fonte:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {sourceLabel}
        </a>
        . Se la mappa non si visualizza nell&apos;embed (alcuni siti bloccano
        l&apos;iframe), usa il pulsante per aprirla in una nuova scheda.
      </p>
    </div>
  );
}

export function PunIdrMap() {
  return (
    <OfficialMapEmbed
      title="Mappa colonnine di ricarica (PUN / IDR)"
      description="Piattaforma Unica Nazionale — Infrastruttura di Ricarica. Mappa ufficiale dei punti di ricarica per veicoli elettrici."
      src="https://www.piattaformaunicanazionale.it/idr"
      sourceLabel="piattaformaunicanazionale.it/idr"
      sourceUrl="https://www.piattaformaunicanazionale.it/idr"
      height={520}
    />
  );
}

export function BandaUltralargaMap() {
  return (
    <OfficialMapEmbed
      title="Mappa banda ultralarga / fibra"
      description="Mappa ufficiale nazionale della copertura banda ultralarga (include Open Fiber e altri operatori) — cerca San Vincenzo sulla mappa."
      src="https://bandaultralarga.italia.it/mappa/"
      sourceLabel="bandaultralarga.italia.it"
      sourceUrl="https://bandaultralarga.italia.it/mappa/"
      height={520}
    />
  );
}
