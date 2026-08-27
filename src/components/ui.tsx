"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ExternalLink,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { isMissing } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { resolveKpiIcon } from "@/lib/kpi-icons";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  unavailable?: boolean;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  /** Destinazione del dettaglio (es. etichetta tab). */
  detailLabel?: string;
  onDetail?: () => void;
};

export function KpiCard({
  label,
  value,
  hint,
  unavailable,
  icon,
  trend,
  trendValue,
  variant = "default",
  detailLabel,
  onDetail,
}: KpiCardProps) {
  const t = useT();
  const Icon = resolveKpiIcon(label, icon);
  const empty =
    unavailable ||
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      (value === "n.d." || value === "n/a" || value === ""));

  const variantStyles = {
    default: "border-[var(--pa-border)] bg-white",
    success: "border-[color-mix(in_srgb,var(--pa-success)_35%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-success)_8%,white)]",
    warning: "border-[color-mix(in_srgb,var(--pa-warning)_35%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-warning)_8%,white)]",
    danger: "border-[color-mix(in_srgb,var(--pa-danger)_35%,var(--pa-border))] bg-[color-mix(in_srgb,var(--pa-danger)_8%,white)]",
    info: "border-[color-mix(in_srgb,var(--pa-primary)_35%,var(--pa-border))] bg-[var(--pa-surface-soft)]",
  };

  const iconColor = {
    default: "text-[var(--pa-primary)]",
    success: "text-[var(--pa-success)]",
    warning: "text-[var(--pa-warning)]",
    danger: "text-[var(--pa-danger)]",
    info: "text-[var(--pa-primary)]",
  };

  const clickable = typeof onDetail === "function";
  const className = `rounded-lg border p-3 shadow-sm sm:p-4 text-left w-full ${variantStyles[variant]} ${
    clickable
      ? "cursor-pointer transition hover:border-[var(--pa-primary)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-primary)]"
      : ""
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--pa-muted)]">
          {label}
        </p>
        <Icon
          size={20}
          className={`shrink-0 ${iconColor[variant]}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex items-end justify-between sm:mt-2">
        <p className="m-0 text-xl font-bold text-[var(--pa-ink)] sm:text-2xl">
          {empty ? (
            <span className="flex items-center gap-1 text-base text-[var(--pa-muted)]">
              <AlertCircle size={16} aria-hidden />
              <span>{t("dato non disponibile")}</span>
            </span>
          ) : (
            value
          )}
        </p>
        {trend && !empty ? (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend === "up"
                ? "text-[var(--pa-success)]"
                : trend === "down"
                  ? "text-[var(--pa-danger)]"
                  : "text-[var(--pa-muted)]"
            }`}
          >
            {trend === "up" ? <TrendingUp size={14} aria-hidden /> : null}
            {trend === "down" ? <TrendingDown size={14} aria-hidden /> : null}
            {trendValue ? <span>{trendValue}</span> : null}
          </div>
        ) : null}
      </div>
      {hint ? (
        <p className="m-0 mt-1.5 text-xs text-[var(--pa-muted)] sm:mt-2">{hint}</p>
      ) : null}
      {clickable ? (
        <p className="m-0 mt-2 text-xs font-semibold text-[var(--pa-primary)]">
          {detailLabel
            ? `${t("Vai a")} ${detailLabel} →`
            : t("Vai al dettaglio →")}
        </p>
      ) : null}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className={className}
        onClick={onDetail}
        aria-label={
          detailLabel
            ? `${label}: ${t("vai alla sezione")} ${detailLabel}`
            : `${label}: ${t("vai al dettaglio")}`
        }
      >
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

export function SectionIntro({
  title,
  description,
  updatedAt,
  sourceNote,
  asPage = false,
}: {
  title: string;
  description?: string;
  /** ISO o testo già formattato sulla freschezza dei dati della sezione. */
  updatedAt?: string | null;
  /** Nota breve sulla fonte o sul perché un dato manca. */
  sourceNote?: string | null;
  /** Pagina SEO isolata: H1 proprio invece di H2 da tab. */
  asPage?: boolean;
}) {
  const t = useT();
  const Heading = asPage ? "h1" : "h2";
  const headingClass = asPage
    ? "m-0 text-2xl font-bold text-[var(--pa-ink)] sm:text-3xl"
    : "m-0 text-lg font-bold text-[var(--pa-ink)] sm:text-xl";
  return (
    <div className="mb-4 sm:mb-5">
      <Heading className={headingClass}>{title}</Heading>
      {description ? (
        <p className="m-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--pa-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
      {updatedAt || sourceNote ? (
        <p className="m-0 mt-2 max-w-prose text-xs text-[var(--pa-muted)]">
          {updatedAt ? (
            <span>
              <span className="font-semibold text-[var(--pa-ink)]">
                {t("Freschezza dati:")}
              </span>{" "}
              {updatedAt}
            </span>
          ) : null}
          {updatedAt && sourceNote ? " · " : null}
          {sourceNote ? <span>{sourceNote}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

/** Intestazione pannello con icona e azioni a destra. */
export function PanelHeading({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 ${className ?? "mb-3"}`}
    >
      <div className="min-w-0 flex-1">
        <h3 className="m-0 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
          {Icon ? (
            <Icon
              size={20}
              className="shrink-0 text-[var(--pa-primary)]"
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
          <span>{title}</span>
        </h3>
        {description ? (
          <p className="m-0 mt-1 text-sm text-[var(--pa-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

const linkBtnBase =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold no-underline transition";

/** Link/CTA pieno: testo sempre bianco (evita override globale `a { color }`). */
export function SolidLink({
  href,
  children,
  external = true,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${linkBtnBase} bg-[var(--pa-primary)] text-white hover:bg-[var(--pa-primary-hover)]`}
      style={{ color: "#ffffff" }}
    >
      {children}
      {external ? <ExternalLink size={14} aria-hidden /> : null}
    </a>
  );
}

export function OutlineLink({
  href,
  children,
  external = true,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${linkBtnBase} border border-[var(--pa-primary)] bg-white text-[var(--pa-primary)] hover:bg-[var(--pa-surface-soft)]`}
    >
      {children}
      {external ? <ExternalLink size={14} aria-hidden /> : null}
    </a>
  );
}

export function SolidButton({
  children,
  onClick,
  disabled,
  tone = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "ink";
}) {
  const tones = {
    primary:
      "bg-[var(--pa-primary)] text-white hover:bg-[var(--pa-primary-hover)] disabled:opacity-50",
    ink: "bg-[var(--pa-ink)] text-white hover:opacity-90 disabled:opacity-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${linkBtnBase} ${tones[tone]}`}
      style={{ color: "#ffffff" }}
    >
      {children}
    </button>
  );
}

export function DataUnavailable({
  message,
  hint,
  action,
}: {
  message?: string;
  hint?: string;
  action?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-[var(--pa-border)] bg-[var(--pa-surface-soft)] p-4">
      <p className="m-0 flex items-start gap-2 text-sm font-semibold text-[var(--pa-ink)]">
        <AlertCircle
          size={16}
          className="mt-0.5 shrink-0 text-[var(--pa-muted)]"
          aria-hidden
        />
        <span>{message ?? t("dato non disponibile")}</span>
      </p>
      {hint ? (
        <p className="mb-0 mt-2 text-xs leading-relaxed text-[var(--pa-muted)] sm:text-sm">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  const t = useT();
  return (
    <div
      className="motion-safe:animate-pulse rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6 text-sm text-[var(--pa-muted)]"
      role="status"
      aria-live="polite"
    >
      {label ?? t("Caricamento…")}
    </div>
  );
}

export function valueOrMissing(
  value: unknown,
  formatter: (v: number) => string,
): string {
  if (isMissing(value) || typeof value !== "number") {
    return getFormatLocale() === "en" ? "n/a" : "n.d.";
  }
  return formatter(value);
}
