"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Coffee,
  ExternalLink,
  HeartHandshake,
  Server,
} from "lucide-react";
import { AUTHOR, COMUNE_NOME } from "@/lib/constants";
import { getForkMaintainer, isUpstreamDeploy } from "@/lib/comune-config";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { LOCALE_META } from "@/lib/i18n/types";
import {
  getBuyMeACoffeeUrl,
  getSostegni,
  type SostegnoPubblico,
} from "@/lib/sostieni";
import { SectionIntro } from "@/components/ui";

function formatSostegnoDate(value: string): string | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const intl = LOCALE_META[getFormatLocale()].intl;
  return new Intl.DateTimeFormat(intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function ThanksCard({ item }: { item: SostegnoPubblico }) {
  const t = useT();
  const when = item.date ? formatSostegnoDate(item.date) : null;
  return (
    <li className="panel p-4">
      <p className="m-0 text-base font-bold text-[var(--pa-ink)]">{item.name}</p>
      <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
        {item.amount_label
          ? t("Sostegno su Buy Me a Coffee ({amount}).", {
              amount: item.amount_label,
            })
          : t("Sostegno su Buy Me a Coffee.")}
        {when ? ` · ${when}` : ""}
      </p>
      {item.message ? (
        <blockquote className="mb-0 mt-3 border-l-2 border-[var(--pa-primary)] pl-3 text-sm leading-relaxed text-[var(--pa-ink)]">
          «{item.message}»
        </blockquote>
      ) : null}
    </li>
  );
}

export function SostieniPanel({ asPage = false }: { asPage?: boolean }) {
  const t = useT();
  const bmcUrl = getBuyMeACoffeeUrl();
  const { updatedAt, items } = getSostegni();
  const fork = getForkMaintainer();
  const maintainerName =
    !isUpstreamDeploy() && fork?.name ? fork.name : AUTHOR.name;
  const SubHeading = asPage ? "h2" : "h3";

  if (!bmcUrl) {
    return (
      <section>
        <SectionIntro
          title={t("Sostieni il cruscotto")}
          description={t(
            "In questo deploy non è configurato un account Buy Me a Coffee.",
          )}
        />
      </section>
    );
  }

  const description = t(
    "Il cruscotto resta indipendente e open source. Un contributo volontario su Buy Me a Coffee aiuta a coprire hosting, dominio e compute. Non è una donazione al Comune e non influenza i dati pubblicati.",
  );

  return (
    <section>
      {asPage ? (
        <>
          <p className="mb-4">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--pa-primary)] underline-offset-2 hover:underline"
            >
              <ArrowLeft size={16} aria-hidden />
              {t("Torna al cruscotto")}
            </Link>
          </p>
          <h1 className="m-0 text-2xl font-bold text-[var(--pa-ink)] sm:text-3xl">
            {t("Sostieni il cruscotto")}
          </h1>
          <p className="m-0 mt-2 max-w-prose text-sm text-[var(--pa-muted)] sm:text-base">
            {description}
          </p>
        </>
      ) : (
        <SectionIntro
          title={t("Sostieni il cruscotto")}
          description={description}
        />
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="panel p-4 sm:p-5">
          <SubHeading className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
            <Coffee
              size={20}
              className="shrink-0 text-[var(--pa-primary)]"
              strokeWidth={2}
              aria-hidden
            />
            {t("Offri un caffè")}
          </SubHeading>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-[var(--pa-muted)]">
            {t(
              "Il sostegno va a {name}, che mantiene questo progetto nel tempo libero. Serve a pagare le spese tecniche, non a finanziare il Comune di {comune}.",
              { name: maintainerName, comune: COMUNE_NOME },
            )}
          </p>
          <a
            href={bmcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#FFDD00] px-4 py-2 text-sm font-bold text-[#0d0c22] no-underline shadow-sm hover:brightness-95"
          >
            <Coffee size={18} aria-hidden strokeWidth={2.25} />
            {t("Offri un caffè su Buy Me a Coffee")}
            <ExternalLink size={14} aria-hidden />
          </a>
          <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
            {t("Si apre la pagina ufficiale Buy Me a Coffee in una nuova scheda.")}
          </p>
        </article>

        <article className="panel p-4 sm:p-5">
          <SubHeading className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
            <Server
              size={20}
              className="shrink-0 text-[var(--pa-primary)]"
              strokeWidth={2}
              aria-hidden
            />
            {t("A cosa serve")}
          </SubHeading>
          <ul className="mb-0 mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--pa-ink)]">
            <li>{t("Hosting e dominio del cruscotto")}</li>
            <li>{t("Compute per build, cache e aggiornamenti dati")}</li>
            <li>{t("Tempo per tenere aperte le fonti open data")}</li>
          </ul>
          <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--pa-muted)]">
            {t(
              "Il contributo è libero: anche un caffè aiuta. I dati restano pubblici e il codice resta open source.",
            )}
          </p>
        </article>
      </div>

      <section className="mt-8" aria-labelledby="ringraziamenti-heading">
        <SubHeading
          id="ringraziamenti-heading"
          className="m-0 flex items-center gap-2 text-lg font-bold text-[var(--pa-ink)]"
        >
          <HeartHandshake
            size={22}
            className="shrink-0 text-[var(--pa-primary)]"
            strokeWidth={2}
            aria-hidden
          />
          {t("Chi ci sostiene")}
        </SubHeading>
        <p className="m-0 mt-2 max-w-prose text-sm text-[var(--pa-muted)]">
          {items.length === 1
            ? t(
                "Elenco aggiornato dai contributi pubblici su Buy Me a Coffee (1 nome). Il contributo resta volontario e non influenza i numeri pubblicati.",
              )
            : items.length > 1
              ? t(
                  "Elenco aggiornato dai contributi pubblici su Buy Me a Coffee ({count} nomi). Il contributo resta volontario e non influenza i numeri pubblicati.",
                  { count: items.length },
                )
              : t(
                  "Quando arrivano contributi pubblici su Buy Me a Coffee, i nomi (e l’eventuale messaggio) compaiono qui. Se hai già sostenuto il progetto e vuoi essere ringraziato, lascia il nome visibile su BMC oppure scrivi a {email}.",
                  { email: AUTHOR.email },
                )}
        </p>
        {updatedAt ? (
          <p className="m-0 mt-1 text-xs text-[var(--pa-muted)]">
            {t("Elenco aggiornato:")} {formatSostegnoDate(updatedAt) ?? updatedAt}
          </p>
        ) : null}

        {items.length > 0 ? (
          <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
            {items.map((item) => (
              <ThanksCard
                key={`${item.name}-${item.date ?? ""}-${item.amount_label}`}
                item={item}
              />
            ))}
          </ul>
        ) : (
          <div className="panel mt-4 p-4 sm:p-5">
            <p className="m-0 text-sm leading-relaxed text-[var(--pa-muted)]">
              {t(
                "Ancora nessun ringraziamento pubblico in elenco. Il primo caffè può essere il tuo.",
              )}
            </p>
            <a
              href={bmcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--pa-primary)] underline underline-offset-2"
            >
              {t("Apri Buy Me a Coffee")}
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        )}
      </section>
    </section>
  );
}
