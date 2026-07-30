# Riusare / forkare il Cruscotto

Guida breve per duplicare questo progetto per un altro comune italiano.
La stessa guida è pubblicata in-app su [`/riusa`](../src/app/riusa/page.tsx) → `/riusa`.

## Cosa si ottiene dal fork

- Stack Next.js 15 + TypeScript + Tailwind già pronto
- Proxy `/api/*` verso MCP **Cruscotto Italia (AgID)** e altre fonti open
- Shell dashboard (sidebar, KPI, mappe, grafici)
- **Non** è un multi-tenant: un deploy = un comune

## Come duplicare

1. **Fork** su GitHub: <https://github.com/magiaslab/san-vincenzo-cruscotto/fork>
2. Oppure **nuovo repo** vuoto + mirror:
   ```bash
   git clone --depth 1 https://github.com/magiaslab/san-vincenzo-cruscotto.git mio-cruscotto
   cd mio-cruscotto
   rm -rf .git
   git init
   git remote add origin git@github.com:TUO_USER/mio-cruscotto.git
   git add -A && git commit -m "Fork iniziale cruscotto comunale"
   git push -u origin main
   ```
3. Deploy su Vercel collegando il nuovo repo (preset Next.js).

Riferimento checklist dati: [`config/comune.example.json`](../config/comune.example.json).

## Minimo per cambiare comune

In `src/lib/constants.ts` (e SEO correlato):

| Campo | Esempio SV | Dove |
| --- | --- | --- |
| `ISTAT_CODE` | `049018` | constants + MCP |
| `COMUNE_NOME` / `PROVINCIA` / `REGIONE` | San Vincenzo / LI / Toscana | UI + SEO |
| `MAP_CENTER`, `METEO_LAT/LON` | 43.085, 10.54 | mappe / meteo |
| `MIUR_COMUNE_CATASTALE` | `I390` | scuole |
| `FARMACIE_DI_TURNO_COD` | `49018` (= ISTAT senza 0) | farmacie |
| Stemma | `public/stemma-*.png` | header |
| `NEXT_PUBLIC_SITE_URL` | URL del tuo dominio | SEO / PWA |

Poi: `npm install && npm run dev` → smoke test `curl -s localhost:3000/api/kpi`.

## Moduli personalizzati (opzionali)

Non obbligatori per un MVP. Cercare e adattare o disattivare:

| Area | Cosa guardare |
| --- | --- |
| Allerte | `ALLERTA_METEO_*`, `src/app/api/meteo/allerte` |
| Trasporti / treni | `scripts/build-trasporti-gtfs.mjs`, `FS_STAZIONE_*`, `/api/trasporti/treni` |
| DAE | `scripts/sync-dae-geojson.mjs`, `public/data/dae-*.geojson`, bot Telegram |
| Open data comunale | URL `ldpgis` / eventi / webcam porto |
| Ambiente regionale | ARPAT, turismo Regione, GTFS regionale |
| Assistente | `modal_rag/`, `ASSISTENTE_MODAL_URL` |
| Copy | stringhe con il nome del comune in `src/lib/i18n/en.ts` e pannelli |

## Licenza e disclaimer

Progetto indipendente non ufficiale. Mantieni attribuzioni AgID / fonti open e il disclaimer “non affiliato”. Vedi `/attribuzioni`.
