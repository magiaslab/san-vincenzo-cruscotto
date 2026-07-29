# Cruscotto San Vincenzo

Dashboard Next.js dei dati aperti del **Comune di San Vincenzo (LI)** (ISTAT `049018`), alimentata dall’MCP pubblico [Cruscotto Italia (AgID)](https://cruscotto-italia.dati.gov.it/).

Progetto **indipendente e non ufficiale**, realizzato da [Alessandro Cipriani](mailto:cipriani.alessandro@gmail.com). Non è affiliato ad AgID, al Governo italiano o al Comune di San Vincenzo.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (layout dashboard a sidebar)
- Chart.js / react-chartjs-2
- Leaflet / react-leaflet (OpenStreetMap)
- Three.js (rilievo 3D stilizzato morfologia)
- `@modelcontextprotocol/sdk` verso `https://cruscotto-italia-mcp.agid.workers.dev/mcp`

## Avvio locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## API interne

| Route | Descrizione |
| --- | --- |
| `GET /api/kpi` | Proxy `comune_kpi`, cache 24h |
| `GET /api/dettaglio?sezioni=siope,anac,…` | Sotto-sezioni di `comune_dashboard` |
| `GET /api/mappa` | Layer GeoJSON (civici, EV, beni, sanità) |
| `GET /api/meteo` | Meteo live KPI (no-store) |
| `GET /api/meteo/forecast` | Previsioni Open-Meteo (48h + 7 giorni) |
| `GET /api/meteo/radar` | Metadati frame radar RainViewer |
| `GET /api/farmacie/turno` | Farmacie di turno (FarmacieDiTurno.org) |

## Deploy su Vercel

1. Collega il repository Git a un progetto Vercel.
2. Framework preset: Next.js (vedi `vercel.json`).
3. Nessuna variabile d’ambiente obbligatoria: l’MCP AgID è pubblico.
4. Deploy: push su `main` oppure `npx vercel --prod`.

## Stemma comunale

File: `public/stemma-san-vincenzo.png`.

> Stemma di San Vincenzo, disegno di Massimo Ghirardi, per gentile concessione di Araldicacivica.it — [CC BY-NC-ND 3.0 IT](https://creativecommons.org/licenses/by-nc-nd/3.0/it/)

Vincoli: uso non commerciale; nessuna opera derivata (solo ridimensionamento CSS/HTML).

## Licenze dati e mappe

- Dati: Cruscotto Italia (AgID) e fonti federate, prevalentemente CC-BY 4.0
- Mappe: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL)
