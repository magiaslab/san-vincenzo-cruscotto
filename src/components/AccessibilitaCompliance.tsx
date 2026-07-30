"use client";

import { useId } from "react";
import { Accessibility } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { OutlineLink } from "@/components/ui";

/**
 * Dichiarazione onesta di conformità del sito (WCAG 2.1 AA, parziale).
 * Usata in Disabilità e in Attribuzioni.
 */
export function AccessibilitaCompliance({
  className = "mb-4",
}: {
  className?: string;
}) {
  const t = useT();
  const titleId = useId();
  return (
    <aside
      className={`panel ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Accessibility
              size={22}
              strokeWidth={2}
              className="shrink-0 text-[var(--pa-primary)]"
              aria-hidden
            />
            <h3 id={titleId} className="m-0 text-base font-bold">
              {t("Accessibilità di questo sito")}
            </h3>
          </div>
          <p className="mb-0 mt-2 text-sm text-[var(--pa-muted)]">
            {t(
              "Obiettivo WCAG 2.1 livello AA sui flussi principali. Stato attuale: conformità parziale (in miglioramento). Non è ancora pubblicata una dichiarazione di accessibilità formale AGID: il cruscotto è un progetto indipendente.",
            )}
          </p>
          <ul className="mb-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            <li>
              <span className="inline-flex min-h-11 items-center rounded-lg bg-[var(--pa-surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--pa-ink)] sm:text-sm">
                WCAG 2.1 AA
              </span>
            </li>
            <li>
              <span className="inline-flex min-h-11 items-center rounded-lg border border-[color-mix(in_srgb,var(--pa-warning)_45%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-warning)_10%,white)] px-3 py-1.5 text-xs font-bold text-[var(--pa-ink)] sm:text-sm">
                {t("Conformità parziale")}
              </span>
            </li>
            <li>
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--pa-ink)] sm:text-sm">
                <Accessibility size={16} strokeWidth={2} aria-hidden />
                {t("Simbolo internazionale di accessibilità")}
              </span>
            </li>
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <OutlineLink href="https://designers.italia.it/design-system/fondamenti/accessibilita/">
            Designers Italia
          </OutlineLink>
          <OutlineLink href="https://www.w3.org/WAI/standards-guidelines/wcag/">
            W3C WCAG 2.1
          </OutlineLink>
          <OutlineLink
            href={`${GITHUB_REPO_URL}/blob/master/docs/a11y-checklist.md`}
          >
            {t("Checklist del progetto")}
          </OutlineLink>
        </div>
      </div>
    </aside>
  );
}
