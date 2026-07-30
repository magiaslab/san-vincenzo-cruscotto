# Design system — Cruscotto San Vincenzo

Mode: **Operate** (dashboard open-data comunale).

## Identity

- PA / Design Italia: blu primario `#0066CC`, inchiostro `#17324d`, muted `#5b6f82`
- Font: Titillium Web (Google Fonts)
- Stemma comunale (CC BY-NC-ND 3.0 IT) — brand signal in shell
- Disclaimer persistente: progetto indipendente / non ufficiale

## Tokens (`globals.css` `:root`)

| Token | Uso |
| --- | --- |
| `--pa-primary` | Azioni, link, nav attiva |
| `--pa-ink` | Testo principale |
| `--pa-muted` | Hint, meta |
| `--pa-border` / `--pa-surface` | Pannelli e card |
| `--background` | Fondo app `#f2f7fb` |

Preferire `var(--pa-*)` o classi Tailwind che le referenziano rispetto a hex ripetuti.

## Layout

- Shell: sidebar desktop + drawer mobile (`AppShell`)
- Nav raggruppata: In evidenza · Territorio e mare · Economia e società · Progetto
  (Partecipa, Come funziona, Riusa/fork, Attribuzioni)
- Deep link sezione: `#sanita`, `#infra`, …
- Panoramica: hub a compiti cittadini, poi instantanea KPI, resto in `<details>`

## Components

- `.panel` — contenitore dati
- `KpiCard` — metrica; clickable solo con `onDetail`
- `SectionIntro` — `h2` sotto `h1` di pagina (shell)

## A11y floor

- Un `h1` per vista; skip link; `aria-modal` + focus trap su dialog/drawer
- Touch target min ~44px; `prefers-reduced-motion` rispettato
- Contrasto AA su testo muted e primary
