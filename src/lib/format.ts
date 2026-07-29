import { getFormatLocale } from "@/lib/i18n/locale-store";
import { LOCALE_META } from "@/lib/i18n/types";

function intlLocale(): string {
  return LOCALE_META[getFormatLocale()].intl;
}

function missingLabel(): string {
  return getFormatLocale() === "en" ? "n/a" : "n.d.";
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missingLabel();
  }
  return new Intl.NumberFormat(intlLocale(), options).format(value);
}

export function formatInteger(value: number | null | undefined): string {
  return formatNumber(value, { maximumFractionDigits: 0 });
}

export function formatDecimal(
  value: number | null | undefined,
  digits = 1,
): string {
  return formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missingLabel();
  }
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatEuroCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missingLabel();
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000, 2)} M€`;
  }
  if (abs >= 1_000) {
    return `${formatDecimal(value / 1_000, 1)} k€`;
  }
  return formatEuro(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missingLabel();
  }
  return `${formatDecimal(value, digits)}%`;
}

export function isMissing(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value)) ||
    value === "n.d." ||
    value === "n/a"
  );
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return missingLabel();
  return d.toLocaleString(intlLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  });
}
