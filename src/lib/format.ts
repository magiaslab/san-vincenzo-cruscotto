export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n.d.";
  }
  return new Intl.NumberFormat("it-IT", options).format(value);
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
    return "n.d.";
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatEuroCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n.d.";
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
    return "n.d.";
  }
  return `${formatDecimal(value, digits)}%`;
}

export function isMissing(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value))
  );
}
