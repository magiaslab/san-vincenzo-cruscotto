# Cruscotto Comune

Template Next.js **da forkare** per una dashboard di dati aperti di un comune
italiano. Nessun backend locale, nessun database, nessuna env obbligatoria.

| Repo | Ruolo |
| --- | --- |
| **Questa** ([magiaslab/cruscotto-comune](https://github.com/magiaslab/cruscotto-comune)) | Template del cruscotto |
| [cruscottocomune.it](https://www.cruscottocomune.it) | Minisito di progetto (repo a parte) |
| [Cruscotto San Vincenzo](https://www.cruscottosanvincenzo.it) | Primo esemplare in produzione |
| Altri fork (es. Campiglia) | Cruscotti comunali |

Identità in `config/comune.json`, moduli con `features.*`, niente dati
hardcoded di San Vincenzo.

Autore: [Alessandro Cipriani](mailto:cipriani.alessandro@gmail.com).
Progetto **indipendente e non ufficiale**.

## Avvio locale

```bash
npm install
cp config/comune.example.json config/comune.json   # poi compila ISTAT
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Homepage = dashboard
(empty state finché l’ISTAT è placeholder).

```bash
curl -s localhost:3000/api/kpi | head -c 400
```

## Identità comunale

File runtime: [`config/comune.json`](config/comune.json)  
Modello: [`config/comune.example.json`](config/comune.example.json)  
Guida: [`docs/riuso-fork.md`](docs/riuso-fork.md) e `/riusa`.  
Aggiornamenti dal template: [`docs/aggiornamenti-upstream.md`](docs/aggiornamenti-upstream.md).

Crediti originali (**non modificare**): [`src/lib/project-origin.ts`](src/lib/project-origin.ts).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Chart.js, Leaflet, Three.js
- MCP `https://cruscotto-italia-mcp.agid.workers.dev/mcp`

## Licenze dati

- KPI: Cruscotto Italia (AgID), prevalentemente CC BY 4.0
- Mappe: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL)

Vedi tab Attribuzioni e [cruscottocomune.it/fonti](https://www.cruscottocomune.it/fonti).
