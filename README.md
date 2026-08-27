# Cruscotto Comune

Template Next.js per una **dashboard di dati aperti di un comune italiano**.
Nessun backend locale, nessun database, nessuna variabile d’ambiente obbligatoria.

Sito del progetto: **[www.cruscottocomune.it](https://www.cruscottocomune.it)**  
Repository: [github.com/magiaslab/cruscotto-comune](https://github.com/magiaslab/cruscotto-comune)

Questo repository è il **punto di fork pulito**: identità in
`config/comune.json`, moduli accendibili con `features.*`, niente dati
hardcoded di San Vincenzo.

Il primo esemplare in produzione resta
[Cruscotto San Vincenzo](https://www.cruscottosanvincenzo.it) — progetto finito
sul proprio dominio, non va «svuotato» per riusarlo.

Autore: [Alessandro Cipriani](mailto:cipriani.alessandro@gmail.com).
Progetto **indipendente e non ufficiale**, non affiliato ad AgID, al Governo
italiano o a un ente locale.

## Minisito

| Percorso | Contenuto |
| --- | --- |
| `/` | Cos’è, moduli nazionali vs opzionali, tre passi |
| `/progetto` | Storia, stack, cosa non è |
| `/fonti` | Catalogo fonti e licenze |
| `/riusa` | Guida fork → Vercel → config (`/riuso` reindirizza qui) |
| `/menzioni` | Testi da tenere nei fork |
| `/sostieni` | Supporto all’autore (Buy Me a Coffee) |
| `/cruscotto` | Dashboard (guida di avvio finché ISTAT è placeholder) |

## Avvio locale

```bash
npm install
cp config/comune.example.json config/comune.json   # poi compila ISTAT
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

Smoke dopo aver compilato l’ISTAT:

```bash
curl -s localhost:3000/api/kpi | head -c 400
```

## Identità comunale

File runtime: [`config/comune.json`](config/comune.json)  
Modello per un fork: [`config/comune.example.json`](config/comune.example.json)  
Guida: [`docs/riuso-fork.md`](docs/riuso-fork.md) e `/riusa`.

Crediti del progetto originale (**non modificare** nei fork):
[`src/lib/project-origin.ts`](src/lib/project-origin.ts).

`site.mode`:

- `landing` — homepage = questo minisito (template)
- `dashboard` — homepage = cruscotto (fork di un comune)

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Chart.js, Leaflet, Three.js
- MCP `https://cruscotto-italia-mcp.agid.workers.dev/mcp`

## Licenze dati

- KPI: Cruscotto Italia (AgID), prevalentemente CC BY 4.0
- Mappe: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL)

Vedi `/fonti` e `/menzioni`.
