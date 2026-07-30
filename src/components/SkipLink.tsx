"use client";

import { useT } from "@/lib/i18n";

/** Skip link verso il main; usare con id="contenuto-principale" sul contenuto. */
export function SkipLink() {
  const t = useT();
  return (
    <a href="#contenuto-principale" className="skip-link">
      {t("Vai al contenuto")}
    </a>
  );
}
