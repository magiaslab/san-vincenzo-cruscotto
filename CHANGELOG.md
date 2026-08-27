# Changelog

## 0.3.0 — 2026-08-27

Nuove fonti e funzioni sul cruscotto San Vincenzo (il template
`cruscotto-comune` resta da allineare a parte).

### Abitanti equivalenti
- Residenti + presenze turistiche / 365 come secondo denominatore.
- Mostrati insieme al dato per residente in rifiuti, farmacie/1000 e veicoli/1000.

### Fonti nazionali
- DAIT (chi amministra), INGV (terremoti), IPA (domicili digitali), ISTAT D7B
  (bilancio mensile), WMS EFFIS (incendi), alberi monumentali da GeoJSON locale.

### Adattatori (accesi su San Vincenzo)
- WFS stazioni SIR Toscana, ARRR da pagina indice, WMS Geoscopio, PGRA ArcGIS,
  refresh SIT ciclabili/pedonali via script.

### Pagine e export
- `/dati`, `/confronto`, `/chi-amministra`, `/eventi.ics`, `/api/pubblico/*`,
  embed `/embeds/farmacia-di-turno|meteo|balneazione`.
- Telegram: `/allerta`, `/farmacia`, `/balneazione`, `/incendi` (opt-in a comando).
- Snapshot GHA solo `workflow_dispatch`.

### Documentazione
- `docs/fonti-non-disponibili.md` (verifica 27/08/2026).
- `comuni_confronto`: Piombino, Campiglia, Castagneto, Cecina, Bibbona, Sassetta
  (`049017`), Suvereto (`049019`) — codici ISTAT ufficiali.
