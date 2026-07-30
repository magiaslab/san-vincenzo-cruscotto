# Checklist accessibilità (manuale, leggera)

Allineata ai fondamenti [Designers Italia — Accessibilità](https://designers.italia.it/design-system/fondamenti/accessibilita/) e al floor in `DESIGN.md`.
Obiettivo operativo: WCAG 2.1 A/AA sui flussi principali, senza audit formale completo.

Eseguire dopo cambi UI rilevanti (shell, dialog, form, tabelle).

## Automatico (CI)

- `npm run lint` — include regole `jsx-a11y` via `eslint-config-next`

## Tastiera

- [ ] Tab / Shift+Tab: ordine logico nella sidebar e nella topbar
- [ ] Drawer mobile: Escape chiude, focus trap, focus ripristinato
- [ ] Assistente: Escape chiude, Tab resta nel dialog
- [ ] Install prompt: Escape chiude, Tab resta nel dialog
- [ ] Skip link «Vai al contenuto» visibile al focus (dashboard e pagine info)

## Screen reader (smoke)

Combinazione consigliata in sviluppo: NVDA + Chrome (o VoiceOver + Safari).

- [ ] Landmark: banner / navigation / main / contentinfo
- [ ] Un solo `h1` per vista; sezioni con `h2`/`h3`
- [ ] Form Partecipa: errori annunciati (`role="alert"`)
- [ ] Pulsanti icona hanno nome accessibile

## Ingrandimento

- [ ] Zoom browser 200% (idealmente fino a 400% a 1280px): niente perdita di controlli principali, no scroll orizzontale indesiderato sulla shell

## Fuori scope (per ora)

- Alternative complete a Chart.js / Leaflet
- Migrazione a Bootstrap Italia / componenti .italia
- Dichiarazione di accessibilità formale AGID
