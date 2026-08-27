"use client";

import Link from "next/link";
import {
  Coffee,
  ExternalLink,
  GitFork,
  HeartHandshake,
  MessageSquarePlus,
  Server,
  Star,
} from "lucide-react";
import { AUTHOR, COMUNE_NOME, GITHUB_REPO_URL } from "@/lib/constants";
import { getForkMaintainer, isUpstreamDeploy } from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";
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
    <li className="guide-card">
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
      <section className="guide-prose">
        <SectionIntro
          asPage={asPage}
          title={t("Supporto")}
          description={t(
            "In questo sito non è configurato un account Buy Me a Coffee.",
          )}
        />
        <p>
          {t(
            "Puoi comunque segnalare errori da Partecipa o scrivere a {email}.",
            { email: AUTHOR.email },
          )}
        </p>
      </section>
    );
  }

  const description = t(
    "Il cruscotto non ha un budget pubblico. Un caffè volontario aiuta a pagare hosting e dominio. Non è una donazione al Comune e non cambia i numeri che leggi.",
  );

  return (
    <section className="guide-prose">
      <SectionIntro
        asPage={asPage}
        title={t("Supporto")}
        description={description}
      />

      <div className="not-prose mt-5 grid gap-4 lg:grid-cols-2">
        <article className="guide-card">
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
              "Il sostegno va a {name}, che tiene in vita il progetto nel tempo libero. Serve a coprire le spese tecniche, non il Comune di {comune}.",
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

        <article className="guide-card">
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
              "L’importo è libero: anche un caffè conta. I dati restano pubblici e il codice resta aperto.",
            )}
          </p>
        </article>
      </div>

      <h2 className="guide-h2">{t("Altri modi per aiutare")}</h2>
      <ul className="not-prose m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        <li className="guide-card">
          <p className="m-0 flex items-center gap-2 font-bold">
            <Star size={18} className="text-[var(--pa-primary)]" aria-hidden />
            {t("Lascia una stella su GitHub")}
          </p>
          <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
            {t("Aiuta altre persone a trovare il progetto.")}
          </p>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold"
          >
            {PROJECT_ORIGIN.github_repo_url.replace("https://", "")}
          </a>
        </li>
        <li className="guide-card">
          <p className="m-0 flex items-center gap-2 font-bold">
            <GitFork size={18} className="text-[var(--pa-primary)]" aria-hidden />
            {t("Portalo in un altro comune")}
          </p>
          <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
            {t("La guida è scritta anche per chi non programma.")}
          </p>
          <Link
            href="/riusa"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold"
          >
            {t("Porta nel tuo comune")}
          </Link>
        </li>
        <li className="guide-card">
          <p className="m-0 flex items-center gap-2 font-bold">
            <MessageSquarePlus
              size={18}
              className="text-[var(--pa-primary)]"
              aria-hidden
            />
            {t("Segnala un errore")}
          </p>
          <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
            {t("Un dato sbagliato o una pagina rotta si sistemano prima se lo dici.")}
          </p>
          <Link
            href="/partecipa"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold"
          >
            {t("Apri Partecipa")}
          </Link>
        </li>
        <li className="guide-card">
          <p className="m-0 flex items-center gap-2 font-bold">
            <HeartHandshake
              size={18}
              className="text-[var(--pa-primary)]"
              aria-hidden
            />
            {t("Scrivi due righe")}
          </p>
          <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
            {t("Un messaggio all’autore vale quanto un caffè, e a volte di più.")}
          </p>
          <a
            href={`mailto:${AUTHOR.email}`}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold"
          >
            {AUTHOR.email}
          </a>
        </li>
      </ul>

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
                "Nomi resi pubblici su Buy Me a Coffee (1 persona). Il contributo è volontario e non cambia i numeri.",
              )
            : items.length > 1
              ? t(
                  "Nomi resi pubblici su Buy Me a Coffee ({count} persone). Il contributo è volontario e non cambia i numeri.",
                  { count: items.length },
                )
              : t(
                  "Quando qualcuno lascia il nome visibile su Buy Me a Coffee, compare qui. Se hai già offerto un caffè e vuoi essere ringraziato, scrivi a {email}.",
                  { email: AUTHOR.email },
                )}
        </p>
        {updatedAt ? (
          <p className="m-0 mt-1 text-xs text-[var(--pa-muted)]">
            {t("Elenco aggiornato:")} {formatSostegnoDate(updatedAt) ?? updatedAt}
          </p>
        ) : null}

        {items.length > 0 ? (
          <ul className="not-prose mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
            {items.map((item) => (
              <ThanksCard
                key={`${item.name}-${item.date ?? ""}-${item.amount_label}`}
                item={item}
              />
            ))}
          </ul>
        ) : (
          <div className="guide-card mt-4">
            <p className="m-0 text-sm leading-relaxed text-[var(--pa-muted)]">
              {t(
                "Ancora nessuno in elenco. Il primo caffè può essere il tuo.",
              )}
            </p>
            <a
              href={bmcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-2"
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
