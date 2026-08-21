# Cruscotto San Vincenzo

Dashboard Next.js dei dati aperti del **Comune di San Vincenzo (LI)** (ISTAT `049018`), alimentata dall’MCP pubblico [Cruscotto Italia (AgID)](https://cruscotto-italia.dati.gov.it/).

Progetto **indipendente e non ufficiale**, realizzato da [Alessandro Cipriani](mailto:cipriani.alessandro@gmail.com). Non è affiliato ad AgID, al Governo italiano o al Comune di San Vincenzo.

## Riuso / fork

Guida completa (GitHub → Vercel → dominio, account esterni, Telegram, Modal/HF,
env, Cursor/Claude): [`docs/riuso-fork.md`](docs/riuso-fork.md).

In-app: tab **Progetto → Riusa / fork** (`/#riusa`). Identità comunale a
runtime: [`config/comune.json`](config/comune.json) (template:
[`config/comune.example.json`](config/comune.example.json)). Crediti progetto
originale (non modificare nei fork): [`src/lib/project-origin.ts`](src/lib/project-origin.ts).
Env: [`.env.example`](.env.example).

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
| `GET /api/trasporti` | GTFS TPL + ciclabili/pedonali |
| `GET /api/trasporti/treni` | Partenze/arrivi live FS + ritardi (ViaggiaTreno) |
| `GET /api/meteo` | Meteo live KPI (no-store) |
| `GET /api/meteo/forecast` | Previsioni Open-Meteo (48h + 7 giorni) |
| `GET /api/meteo/radar` | Metadati frame radar RainViewer |
| `GET /api/farmacie/turno` | Farmacie di turno (FarmacieDiTurno.org) |
| `GET /api/dae` | DAE comunali da GeoJSON locale (OpenAEDMap / OSM) |
| `GET /api/dae/segnalazioni` | Overlay segnalazioni Telegram approvate |
| `POST /api/telegram/webhook` | Webhook bot @DaesanvincenzoBot |
| `POST /api/feedback` | Form Partecipa → GitHub Issues |
| `POST /api/assistente` | Proxy RAG su Modal (HF self-host) |

## Mappa DAE (defibrillatori)

I punti arrivano da un export OpenStreetMap via [OpenAEDMap](https://openaedmap.org/).
Per aggiornare il file locale:

```bash
npm run dae:sync
```

Studio per un bot Telegram di segnalazione cittadina: [`docs/dae-telegram-bot.md`](docs/dae-telegram-bot.md).

## Assistente RAG (Modal + Hugging Face)

Piccolo RAG sui dati del cruscotto, **senza API LLM a pagamento**:

- embedding [`paraphrase-multilingual-MiniLM-L12-v2`](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
- generazione [`SmolLM2-360M-Instruct`](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)
- deploy su Modal (crediti starter, scale-to-zero)
- app: [san-vincenzo-rag](https://modal.com/apps/magiaslab/main/deployed/san-vincenzo-rag)

Vedi `modal_rag/README.md`. Su Vercel / `.env.local`:

```bash
# su Vercel / .env.local
ASSISTENTE_MODAL_URL=https://magiaslab--san-vincenzo-rag-ragservice-web-ask.modal.run
```

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
