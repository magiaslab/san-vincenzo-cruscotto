import Link from "next/link";
import { COMUNE } from "@/lib/comune-config";
import { getProductName } from "@/lib/product";

/** Schermata dashboard quando ISTAT/nome sono ancora i placeholder del template. */
export function DashboardSetup() {
  const product = getProductName();
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--pa-primary)]">
        Template
      </p>
      <h1 className="mb-3 mt-1 text-3xl font-bold text-[var(--pa-ink)]">
        Nessun comune configurato
      </h1>
      <p className="mb-6 text-base leading-relaxed text-[var(--pa-muted)]">
        {product} è pronto, ma <code>config/comune.json</code> contiene ancora i
        placeholder (<strong>{COMUNE.nome}</strong>, ISTAT{" "}
        <strong>{COMUNE.istat_code}</strong>). Non mostriamo i dati di un altro
        ente.
      </p>
      <ol className="mb-8 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[var(--pa-ink)] sm:text-base">
        <li>
          Copia <code>config/comune.example.json</code> sopra{" "}
          <code>config/comune.json</code>.
        </li>
        <li>
          Compila almeno <code>istat_code</code>, <code>nome</code>,{" "}
          <code>provincia</code>, <code>regione</code>,{" "}
          <code>geo.map_center</code>, <code>miur_codice_catastale</code>,{" "}
          <code>fork.*</code>.
        </li>
        <li>
          Imposta <code>site.mode</code> su <code>&quot;dashboard&quot;</code> se
          vuoi la dashboard in homepage (fork comunale).
        </li>
        <li>
          Spegni in <code>features</code> ciò che non hai (porto, balneazione,
          treni, ARPA, …).
        </li>
        <li>
          <code>npm run dae:sync</code> · <code>npm run omi:update</code> ·
          smoke <code>/api/kpi</code>.
        </li>
      </ol>
      <p className="flex flex-wrap gap-3">
        <Link
          href="/riusa"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-bold text-white no-underline"
        >
          Guida al riuso
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-4 text-sm font-semibold text-[var(--pa-ink)] no-underline"
        >
          Torna al minisito
        </Link>
      </p>
    </section>
  );
}
