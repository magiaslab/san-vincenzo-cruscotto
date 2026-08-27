"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  CircleHelp,
  Database,
  ExternalLink,
  Lightbulb,
  MessageSquarePlus,
} from "lucide-react";
import {
  AUTHOR,
  COMUNE_NOME,
  COMUNE_PROVINCIA,
  CRUSCOTTO_ITALIA_URL,
  GITHUB_FORK_REPO_URL,
  OPENAEDMAP_URL,
  TELEGRAM_DAE_BOT_HANDLE,
  TELEGRAM_DAE_BOT_URL,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { LoadingBlock, SectionIntro, SolidLink } from "@/components/ui";
import { isSostieniEnabled } from "@/lib/sostieni";

type PublicIssue = {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  labels: string[];
};

type FeedbackTipo = "miglioramento" | "bug" | "domanda" | "nuovo_dato";

const SEZIONI = [
  "Panoramica",
  "Sanità / DAE",
  "Mobilità",
  "Meteo",
  "Turismo",
  "Porto",
  "Ambiente",
  "Territorio",
  "Mappa",
  "Economia",
  "Istruzione",
  "Società",
  "Disabilità",
  "Finanza",
  "Assistente",
  "Altro",
] as const;

const STEPS = 4;

type TipoOption = {
  id: FeedbackTipo;
  title: string;
  hint: string;
  Icon: typeof Lightbulb;
};

export function PartecipaPanel({ asPage = false }: { asPage?: boolean }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<FeedbackTipo | null>(null);
  const [sezione, setSezione] = useState("");
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [contatto, setContatto] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    url: string;
    number?: number;
    mode: string;
  } | null>(null);
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIssuesLoading(true);
    fetch("/api/feedback?issues=1&limit=10")
      .then((r) => r.json())
      .then((json: { ok?: boolean; issues?: PublicIssue[]; error?: string }) => {
        if (cancelled) return;
        if (json.ok && Array.isArray(json.issues)) {
          setIssues(json.issues);
          setIssuesError(null);
        } else {
          setIssuesError(json.error || t("Elenco suggerimenti non disponibile"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIssuesError(t("Elenco suggerimenti non disponibile"));
        }
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, done?.number]);

  const tipi: TipoOption[] = useMemo(
    () => [
      {
        id: "miglioramento",
        title: t("Miglioramento"),
        hint: t("Un’idea per rendere il cruscotto più chiaro o utile"),
        Icon: Lightbulb,
      },
      {
        id: "bug",
        title: t("Problema"),
        hint: t("Qualcosa non funziona, è sbagliato o confonde"),
        Icon: Bug,
      },
      {
        id: "nuovo_dato",
        title: t("Nuovo dato"),
        hint: t("Una fonte open data o un indicatore da aggiungere"),
        Icon: Database,
      },
      {
        id: "domanda",
        title: t("Domanda"),
        hint: t("Chiarimento su dati, fonti o come usare il sito"),
        Icon: CircleHelp,
      },
    ],
    [t],
  );

  function resetWizard() {
    setStep(0);
    setTipo(null);
    setSezione("");
    setTitolo("");
    setMessaggio("");
    setContatto("");
    setHoneypot("");
    setError(null);
    setDone(null);
  }

  function canNext(): boolean {
    if (step === 0) return tipo != null;
    if (step === 1) return true;
    if (step === 2) return titolo.trim().length >= 5 && messaggio.trim().length >= 20;
    return true;
  }

  async function submit() {
    if (!tipo || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          sezione: sezione || undefined,
          titolo: titolo.trim(),
          messaggio: messaggio.trim(),
          contatto: contatto.trim() || undefined,
          pagina:
            typeof window !== "undefined" ? window.location.href : undefined,
          website: honeypot,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        url?: string;
        number?: number;
        mode?: string;
        message?: string;
      };
      if (!res.ok && !json.url) {
        setError(json.error || t("Invio non riuscito. Riprova."));
        return;
      }
      if (json.url) {
        setDone({
          url: json.url,
          number: json.number,
          mode: json.mode || "github_api",
        });
        setStep(STEPS);
        return;
      }
      setError(json.error || t("Invio non riuscito. Riprova."));
    } catch {
      setError(t("Errore di rete. Controlla la connessione e riprova."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <SectionIntro
        asPage={asPage}
        title={
          asPage ? `Partecipa al Cruscotto ${COMUNE_NOME}` : t("Partecipa")
        }
        description={t(
          "Come funziona il cruscotto e come puoi suggerire miglioramenti. I suggerimenti diventano issue su GitHub.",
        )}
      />

      {isSostieniEnabled() ? (
        <aside className="panel mb-5 flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
          <p className="m-0 text-sm leading-relaxed text-[var(--pa-muted)]">
            {t(
              "Il cruscotto è senza budget pubblico. Se ti è utile, puoi coprire hosting e compute con un caffè.",
            )}
          </p>
          <Link
            href="/sostieni"
            className="inline-flex min-h-11 shrink-0 items-center font-semibold text-[var(--pa-primary)] underline underline-offset-2"
          >
            {t("Sostieni il progetto")}
          </Link>
        </aside>
      ) : null}

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <article className="panel p-4 sm:p-5">
          <h3 className="m-0 text-base font-bold text-[var(--pa-ink)]">
            {t("Cos’è questo sito")}
          </h3>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-[var(--pa-muted)]">
            {t(
              "È un cruscotto indipendente e non ufficiale sui dati aperti di {comune} ({provincia}). Non è affiliato ad AgID, al Governo o al Comune: aggrega fonti pubbliche per consultarle in un unico posto.",
              { comune: COMUNE_NOME, provincia: COMUNE_PROVINCIA },
            )}
          </p>
          <ul className="mb-0 mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--pa-ink)]">
            <li>
              {t("Dati principali da")}{" "}
              <a
                href={CRUSCOTTO_ITALIA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Cruscotto Italia (AgID)
              </a>
            </li>
            <li>
              {t("Mappe e DAE da OpenStreetMap / OpenAEDMap")}
            </li>
            <li>
              {t("Altre fonti: Regione Toscana, ARPAT, MIUR, open data comunale")}
            </li>
          </ul>
          <p className="mb-0 mt-3 text-sm">
            <Link
              href="/come-funziona"
              className="font-semibold underline underline-offset-2"
            >
              {t("Come funziona lo stack e l’architettura")}
            </Link>
          </p>
        </article>

        <article className="panel p-4 sm:p-5">
          <h3 className="m-0 text-base font-bold text-[var(--pa-ink)]">
            {t("Come puoi aiutare")}
          </h3>
          <ul className="mb-0 mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--pa-ink)]">
            <li>
              {t("Segnala un DAE mancante su Telegram:")}{" "}
              <a
                href={TELEGRAM_DAE_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                {TELEGRAM_DAE_BOT_HANDLE}
              </a>
            </li>
            <li>
              {t("Aggiungi defibrillatori su")}{" "}
              <a
                href={OPENAEDMAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                OpenAEDMap
              </a>
            </li>
            <li>
              {t("Proponi miglioramenti al sito con il wizard qui sotto")}
            </li>
            <li>
              {t("Codice e issue su")}{" "}
              <a
                href={GITHUB_FORK_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                GitHub
              </a>
            </li>
          </ul>
          <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
            {t("Contatti:")}{" "}
            <a
              href={`mailto:${AUTHOR.email}`}
              className="font-semibold underline"
            >
              {AUTHOR.name}
            </a>
          </p>
        </article>
      </div>

      <div className="panel overflow-hidden p-0">
        <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
          <h3 className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
            <MessageSquarePlus
              size={18}
              className="text-[var(--pa-primary)]"
              aria-hidden
            />
            {t("Wizard suggerimenti")}
          </h3>
          <p className="m-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
            {t(
              "Quattro passi: tipo, sezione, messaggio, conferma. L’invio apre una issue pubblica su GitHub.",
            )}
          </p>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <ol className="m-0 mb-4 flex list-none flex-wrap gap-2 p-0" aria-label={t("Passi del wizard")}>
            {Array.from({ length: STEPS }, (_, i) => {
              const active = i === step || (done && i === STEPS - 1 && step === STEPS);
              const doneStep = i < step || step === STEPS;
              return (
                <li
                  key={i}
                  className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold ${
                    active
                      ? "bg-[var(--pa-primary)] text-white"
                      : doneStep
                        ? "bg-[color-mix(in_srgb,var(--pa-primary)_18%,white)] text-[var(--pa-primary)]"
                        : "bg-[var(--pa-surface-soft)] text-[var(--pa-muted)]"
                  }`}
                  style={active ? { color: "#ffffff" } : undefined}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i + 1}.{" "}
                  {i === 0
                    ? t("Tipo")
                    : i === 1
                      ? t("Sezione")
                      : i === 2
                        ? t("Messaggio")
                        : t("Invio")}
                </li>
              );
            })}
          </ol>

          {step === 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {tipi.map((opt) => {
                const selected = tipo === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTipo(opt.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-[var(--pa-primary)] bg-[color-mix(in_srgb,var(--pa-primary)_10%,white)]"
                        : "border-[var(--pa-border)] bg-white hover:bg-[var(--pa-surface-soft)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--pa-ink)]">
                      <opt.Icon
                        size={18}
                        className="text-[var(--pa-primary)]"
                        aria-hidden
                      />
                      {opt.title}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--pa-muted)]">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <label
                htmlFor="feedback-sezione"
                className="mb-1.5 block text-sm font-semibold text-[var(--pa-ink)]"
              >
                {t("Sezione del cruscotto (opzionale)")}
              </label>
              <select
                id="feedback-sezione"
                value={sezione}
                onChange={(e) => setSezione(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-[var(--pa-border)] bg-white px-3 text-sm text-[var(--pa-ink)]"
              >
                <option value="">{t("Nessuna / trasversale")}</option>
                {SEZIONI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mb-0 mt-2 text-xs text-[var(--pa-muted)]">
                {t(
                  "Serve solo a inquadrare meglio la richiesta. Puoi lasciare vuoto.",
                )}
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="relative grid gap-3">
              <div>
                <label
                  htmlFor="feedback-titolo"
                  className="mb-1.5 block text-sm font-semibold text-[var(--pa-ink)]"
                >
                  {t("Titolo breve")}
                </label>
                <input
                  id="feedback-titolo"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  maxLength={120}
                  className="min-h-11 w-full rounded-lg border border-[var(--pa-border)] bg-white px-3 text-sm text-[var(--pa-ink)]"
                  placeholder={t("Es. Aggiungere i dati sulle spiagge accessibili")}
                />
              </div>
              <div>
                <label
                  htmlFor="feedback-messaggio"
                  className="mb-1.5 block text-sm font-semibold text-[var(--pa-ink)]"
                >
                  {t("Descrizione")}
                </label>
                <textarea
                  id="feedback-messaggio"
                  value={messaggio}
                  onChange={(e) => setMessaggio(e.target.value)}
                  maxLength={4000}
                  rows={6}
                  className="w-full rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-sm text-[var(--pa-ink)]"
                  placeholder={t(
                    "Spiega cosa vorresti, perché è utile, e se hai un link o una fonte.",
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="feedback-contatto"
                  className="mb-1.5 block text-sm font-semibold text-[var(--pa-ink)]"
                >
                  {t("Contatto (opzionale)")}
                </label>
                <input
                  id="feedback-contatto"
                  value={contatto}
                  onChange={(e) => setContatto(e.target.value)}
                  maxLength={120}
                  className="min-h-11 w-full rounded-lg border border-[var(--pa-border)] bg-white px-3 text-sm text-[var(--pa-ink)]"
                  placeholder={t("Email o @telegram, solo se vuoi una risposta")}
                  autoComplete="email"
                />
              </div>
              {/* honeypot */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                <label htmlFor="feedback-website">Website</label>
                <input
                  id="feedback-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {step === 3 && !done ? (
            <div className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] p-4 text-sm text-[var(--pa-ink)]">
              <p className="m-0 font-bold">{t("Riepilogo")}</p>
              <dl className="mb-0 mt-3 grid gap-2">
                <div>
                  <dt className="text-xs text-[var(--pa-muted)]">{t("Tipo")}</dt>
                  <dd className="m-0 font-semibold">
                    {tipi.find((x) => x.id === tipo)?.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--pa-muted)]">{t("Sezione")}</dt>
                  <dd className="m-0 font-semibold">
                    {sezione || t("Nessuna / trasversale")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--pa-muted)]">{t("Titolo")}</dt>
                  <dd className="m-0 font-semibold">{titolo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--pa-muted)]">{t("Messaggio")}</dt>
                  <dd className="m-0 whitespace-pre-wrap">{messaggio}</dd>
                </div>
                {contatto ? (
                  <div>
                    <dt className="text-xs text-[var(--pa-muted)]">{t("Contatto")}</dt>
                    <dd className="m-0">{contatto}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
                {t(
                  "Inviando, il testo diventa una issue pubblica sul repository GitHub del progetto.",
                )}
              </p>
            </div>
          ) : null}

          {done ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,#008758_35%,var(--pa-border))] bg-[color-mix(in_srgb,#008758_8%,white)] p-4">
              <p className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
                <CheckCircle2 className="text-[#008758]" size={20} aria-hidden />
                {t("Grazie per il suggerimento")}
              </p>
              {done.number ? (
                <p className="mb-0 mt-2 text-sm font-semibold text-[var(--pa-ink)]">
                  {t("Ticket registrato:")}{" "}
                  <span className="text-[var(--pa-primary)]">#{done.number}</span>
                </p>
              ) : null}
              <p className="mb-0 mt-2 text-sm text-[var(--pa-muted)]">
                {done.mode === "fallback"
                  ? t(
                      "Per completare l’invio apri il link GitHub (serve un account). Il form ha già preparato titolo e testo.",
                    )
                  : t(
                      "La richiesta è stata pubblicata come issue. Puoi seguirla sul repository e nella lista qui sotto.",
                    )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SolidLink href={done.url}>
                  {done.number
                    ? t("Apri issue #{n}").replace("{n}", String(done.number))
                    : t("Apri su GitHub")}
                </SolidLink>
                <button
                  type="button"
                  onClick={resetWizard}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--pa-border)] bg-white px-3 text-sm font-semibold text-[var(--pa-ink)]"
                >
                  {t("Nuovo suggerimento")}
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 mb-0 rounded-lg border border-[#D9364F]/40 bg-[#D9364F]/8 px-3 py-2 text-sm text-[#D9364F]" role="alert">
              {error}
            </p>
          ) : null}

          {!done ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((s) => Math.max(0, s - 1));
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--pa-border)] bg-white px-4 text-sm font-semibold text-[var(--pa-ink)]"
                >
                  <ArrowLeft size={16} aria-hidden />
                  {t("Indietro")}
                </button>
              ) : null}
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!canNext()}
                  onClick={() => {
                    setError(null);
                    setStep((s) => s + 1);
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  style={{ color: "#ffffff" }}
                >
                  {t("Avanti")}
                  <ArrowRight size={16} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || !canNext()}
                  onClick={() => void submit()}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  style={{ color: "#ffffff" }}
                >
                  {submitting ? t("Invio in corso…") : t("Invia su GitHub")}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 panel overflow-hidden p-0">
        <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
          <h3 className="m-0 text-base font-bold text-[var(--pa-ink)]">
            {t("Suggerimenti recenti")}
          </h3>
          <p className="m-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
            {t(
              "Issue pubbliche aperte dal wizard. Lo stato (aperta/chiusa) si aggiorna su GitHub.",
            )}
          </p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          {issuesLoading ? <LoadingBlock label={t("Caricamento suggerimenti…")} /> : null}
          {!issuesLoading && issuesError ? (
            <p className="m-0 text-sm text-[var(--pa-muted)]">{issuesError}</p>
          ) : null}
          {!issuesLoading && !issuesError && issues.length === 0 ? (
            <p className="m-0 text-sm text-[var(--pa-muted)]">
              {t("Ancora nessun suggerimento pubblico. Sii il primo!")}
            </p>
          ) : null}
          {!issuesLoading && issues.length > 0 ? (
            <ul className="m-0 list-none space-y-2 p-0">
              {issues.map((issue) => (
                <li key={issue.number}>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2.5 no-underline transition hover:border-[var(--pa-primary)] hover:bg-[var(--pa-surface-soft)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--pa-ink)]">
                        <span className="text-[var(--pa-primary)]">#{issue.number}</span>{" "}
                        {issue.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--pa-muted)]">
                        {t("Aperta il")} {formatDateTime(issue.createdAt)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          issue.state === "open"
                            ? "bg-[color-mix(in_srgb,#008758_16%,white)] text-[#008758]"
                            : "bg-[var(--pa-surface-soft)] text-[var(--pa-muted)]"
                        }`}
                      >
                        {issue.state === "open" ? t("Aperta") : t("Chiusa")}
                      </span>
                      <ExternalLink
                        size={14}
                        className="text-[var(--pa-muted)]"
                        aria-hidden
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
            <a
              href={`${GITHUB_FORK_REPO_URL}/issues?q=is%3Aissue+%5BSuggerimento%5D`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              {t("Vedi tutte su GitHub")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
