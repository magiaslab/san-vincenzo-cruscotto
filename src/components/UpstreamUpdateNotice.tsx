"use client";

import { useEffect, useState } from "react";
import {
  compareSemver,
  fetchUpstreamVersion,
  getUpstreamChangelogUrl,
  getUpstreamReleasesUrl,
  LOCAL_TEMPLATE_VERSION,
  shouldCheckUpstreamUpdates,
} from "@/lib/upstream";

/**
 * Avviso per i maintainer del fork: il template upstream ha una versione più nuova.
 * Non si vede sul template stesso (`fork.is_template`).
 */
export function UpstreamUpdateNotice() {
  const [remote, setRemote] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldCheckUpstreamUpdates()) return;
    let cancelled = false;
    fetchUpstreamVersion().then((v) => {
      if (!cancelled) setRemote(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!shouldCheckUpstreamUpdates() || !remote) return null;
  if (compareSemver(LOCAL_TEMPLATE_VERSION, remote) >= 0) return null;

  return (
    <aside
      className="mb-6 rounded-xl border border-[color-mix(in_srgb,var(--pa-warning)_45%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-warning)_10%,white)] px-4 py-3 text-sm text-[var(--pa-ink)]"
      role="status"
    >
      <p className="m-0 font-bold">Aggiornamento del template disponibile</p>
      <p className="mb-0 mt-1 text-[var(--pa-muted)]">
        Questo cruscotto è alla versione <code>{LOCAL_TEMPLATE_VERSION}</code>,
        il template è a <code>{remote}</code>. I KPI AgID si aggiornano da soli;
        il codice no. Vedi il{" "}
        <a href={getUpstreamChangelogUrl()} target="_blank" rel="noopener noreferrer">
          CHANGELOG
        </a>{" "}
        e le{" "}
        <a href={getUpstreamReleasesUrl()} target="_blank" rel="noopener noreferrer">
          release
        </a>
        . Merge selettivo:{" "}
        <code>git fetch upstream && git merge upstream/main</code> — tieni il tuo{" "}
        <code>config/comune.json</code>.
      </p>
    </aside>
  );
}
