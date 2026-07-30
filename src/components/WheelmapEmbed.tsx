"use client";

import { Accessibility } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  WHEELMAP_URL,
  WHEELMAP_WIDGET_INFO_URL,
  buildWheelmapEmbedSrc,
} from "@/lib/accessibilita";
import { OutlineLink, PanelHeading, SolidLink } from "@/components/ui";

/**
 * Iframe ufficiale Wheelmap.
 * Richiede NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN (widget Sozialhelden / accessibility.cloud):
 * senza token il sito risponde con X-Frame-Options: SAMEORIGIN e l’embed non funziona.
 */
export default function WheelmapEmbed({
  embedToken,
}: {
  embedToken: string | null;
}) {
  const t = useT();

  if (!embedToken) {
    return (
      <div className="panel overflow-hidden p-0">
        <div className="border-b border-[var(--pa-border)] px-4 py-3">
          <PanelHeading
            title={t("Mappa Wheelmap")}
            description={t(
              "L’iframe ufficiale richiede un embedToken da Sozialhelden (Wheelmap Widget). Sotto trovi già la mappa OSM con gli stessi dati wheelchair.",
            )}
            icon={Accessibility}
            actions={
              <div className="flex flex-wrap gap-2">
                <SolidLink href={WHEELMAP_URL}>Apri Wheelmap</SolidLink>
                <OutlineLink href={WHEELMAP_WIDGET_INFO_URL}>
                  {t("Info widget")}
                </OutlineLink>
              </div>
            }
            className="mb-0"
          />
        </div>
        <div className="space-y-2 px-4 py-3 text-xs text-[var(--pa-muted)] sm:text-sm">
          <p className="m-0">
            {t(
              "Per attivare l’embed: richiedi il widget a info@sozialhelden.de, poi imposta su Vercel la variabile NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN.",
            )}
          </p>
          <p className="m-0 font-mono text-[11px] text-[var(--pa-ink)]">
            NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN=…
          </p>
        </div>
      </div>
    );
  }

  const src = buildWheelmapEmbedSrc(embedToken);

  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Mappa Wheelmap")}
          description={t(
            "Widget ufficiale centrato su San Vincenzo (semaforo accessibilità).",
          )}
          icon={Accessibility}
          actions={<SolidLink href={WHEELMAP_URL}>Apri a schermo intero</SolidLink>}
          className="mb-0"
        />
      </div>
      <div className="relative z-0 h-[420px] w-full overflow-hidden sm:h-[520px]">
        <iframe
          title={t("Mappa Wheelmap")}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="geolocation"
        />
      </div>
      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
        ©{" "}
        <a
          href={WHEELMAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          Wheelmap.org
        </a>{" "}
        / Sozialhelden e.V. · OpenStreetMap
      </p>
    </div>
  );
}
