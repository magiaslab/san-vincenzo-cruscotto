/**
 * Badge ufficiali Creative Commons (hotlink a licensebuttons.net, policy CC).
 * https://licensebuttons.net/
 */

type CcBadgeProps = {
  href: string;
  src: string;
  alt: string;
  label: string;
};

function CcBadge({ href, src, alt, label }: CcBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer license"
      className="inline-flex min-h-11 flex-col items-start gap-1.5 rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 no-underline transition hover:border-[var(--pa-primary)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- badge ufficiale CC hotlink */}
      <img src={src} alt={alt} width={88} height={31} className="h-[31px] w-[88px]" />
      <span className="text-xs font-semibold text-[var(--pa-ink)]">{label}</span>
    </a>
  );
}

/** CC BY 4.0 — licenza tipica dei dataset open del cruscotto. */
export function CcBy40Badge() {
  return (
    <CcBadge
      href="https://creativecommons.org/licenses/by/4.0/"
      src="https://licensebuttons.net/l/by/4.0/88x31.png"
      alt="Creative Commons Attribution 4.0 International"
      label="CC BY 4.0"
    />
  );
}

/** CC BY-NC-ND 3.0 IT — stemma comunale. */
export function CcByNcNd30ItBadge() {
  return (
    <CcBadge
      href="https://creativecommons.org/licenses/by-nc-nd/3.0/it/"
      src="https://licensebuttons.net/l/by-nc-nd/3.0/88x31.png"
      alt="Creative Commons Attribution-NonCommercial-NoDerivatives 3.0 Italy"
      label="CC BY-NC-ND 3.0 IT"
    />
  );
}

/** Riga badge usata in Attribuzioni. */
export function CreativeCommonsBadgeRow() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label="Licenze Creative Commons">
      <li>
        <CcBy40Badge />
      </li>
      <li>
        <CcByNcNd30ItBadge />
      </li>
    </ul>
  );
}
