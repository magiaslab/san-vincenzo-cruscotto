# Riusare / forkare il Cruscotto — guida completa

Guida passo-passo per duplicare questo progetto su un **altro comune italiano**,
dall’account GitHub alla messa online su Vercel, con i servizi esterni opzionali
(Telegram, Modal, Hugging Face, OpenWeather, …) e indicazioni per usare
Cursor o Claude ad adattare il fork.

La stessa guida è riassunta in-app su [`/#riusa`](https://www.cruscottosanvincenzo.it/#riusa)
(tab **Progetto → Riusa / fork**). Redirect legacy: `/riusa`.

Checklist dati: [`config/comune.example.json`](../config/comune.example.json)  
Env di esempio: [`.env.example`](../.env.example)

---

## Indice

1. [Due percorsi: principiante vs esperto](#1-due-percorsi-principiante-vs-esperto)
2. [Cosa ottieni (e cosa no)](#2-cosa-ottieni-e-cosa-no)
3. [Account e tool esterni](#3-account-e-tool-esterni)
4. [Passo A — Account GitHub](#4-passo-a--account-github)
5. [Passo B — Fork o mirror del repository](#5-passo-b--fork-o-mirror-del-repository)
6. [Passo C — Ambiente locale](#6-passo-c--ambiente-locale)
7. [Passo D — Identità del comune (minimo)](#7-passo-d--identità-del-comune-minimo)
8. [Passo E — Deploy su Vercel](#8-passo-e--deploy-su-vercel)
9. [Passo F — Dominio e SEO](#9-passo-f--dominio-e-seo)
10. [Catalogo variabili d’ambiente](#10-catalogo-variabili-dambiente)
11. [Moduli opzionali](#11-moduli-opzionali)
12. [Usare Cursor o Claude sul fork](#12-usare-cursor-o-claude-sul-fork)
13. [Checklist finale e troubleshooting](#13-checklist-finale-e-troubleshooting)
14. [Licenza e disclaimer](#14-licenza-e-disclaimer)

---

## 1. Due percorsi: principiante vs esperto

### Percorso rapido (MVP, ~mezz’ora di lavoro attivo)

Obiettivo: sito online con KPI AgID del tuo comune, senza bot né AI.

1. Crea account **GitHub** e **Vercel** (gratis).
2. **Fork** di questo repo.
3. Su Vercel: Import Project → repo forkato → Deploy (nessuna env obbligatoria).
4. In locale o su GitHub: adatta `config/comune.json` (ISTAT, nome, coordinate,
   `features`, `fork.maintainer_*`). Non modificare `src/lib/project-origin.ts`.
5. Push → Vercel ridistribuisce → apri l’URL `*.vercel.app`.
6. Smoke test: `https://TUO-PROGETTO.vercel.app/api/kpi` deve mostrare
   demografia del tuo codice ISTAT.

Fine. Il resto di questa guida è opzionale.

### Percorso completo (esperto / produzione)

Dopo l’MVP: dominio custom, OpenWeather, bot Telegram DAE, assistente RAG
(Modal + Hugging Face), token GitHub per feedback/segnalazioni, Wheelmap,
adattamento moduli regionali (ARPAT, GTFS, allerte).

---

## 2. Cosa ottieni (e cosa no)

| Incluso | Non incluso |
| --- | --- |
| Next.js 15 + TypeScript + Tailwind | Multi-tenant runtime (un deploy = un comune) |
| Proxy `/api/*` → MCP Cruscotto Italia (AgID) | Backend/DB/auth locali |
| Shell dashboard (sidebar, KPI, mappe, grafici) | Parità automatica di ogni pannello “costa / Toscana” |
| **`config/comune.json` a runtime** + `features.*` per spegnere moduli | — |

Non serve costruire un MCP proprio per il fork: i KPI comunali arrivano già
dal **MCP pubblico AgID** (`src/lib/mcp.ts` + codice ISTAT).

**Nucleo nazionale (funziona ovunque in Italia con codice ISTAT):** demografia,
economia, scuole MIUR (catastale), finanza, meteo (Open-Meteo / RainViewer /
OpenWeather), allerte via allertameteo.app, ecc.

**Moduli opzionali** (porto, balneazione, GTFS locale, eventi scrape, SIR Toscana,
bot DAE…): si **spengono** con `features` in `config/comune.json` oppure si
ricollegano agli URL della tua Regione.

**Crediti:** non modificare `src/lib/project-origin.ts` (Alessandro Cipriani /
magiaslab). Nei fork indica te stesso in `config/comune.json` → `fork`.

---

## 3. Account e tool esterni

Nessuno di questi (tranne GitHub + Vercel per pubblicare) è obbligatorio per l’MVP.

| Servizio | Serve a | Obbligatorio? | Registrazione |
| --- | --- | --- | --- |
| **GitHub** | Codice, fork, Issues (Partecipa), commit GeoJSON DAE | Sì per fork/deploy | [github.com/signup](https://github.com/signup) |
| **Vercel** | Hosting Next.js (regione `fra1`) | Sì per online | [vercel.com/signup](https://vercel.com/signup) (login con GitHub) |
| **AgID Cruscotto Italia MCP** | KPI comunali | No account: endpoint pubblico | `https://cruscotto-italia-mcp.agid.workers.dev/mcp` |
| **OpenWeather** | Meteo current/forecast/AQI | Opzionale | [API keys](https://home.openweathermap.org/api_keys) |
| **Telegram + BotFather** | Bot segnalazione DAE | Opzionale | App Telegram → chat [@BotFather](https://t.me/BotFather) |
| **Modal** | Hosting RAG (modelli HF) | Opzionale (assistente) | [modal.com](https://modal.com) → `modal setup` |
| **Hugging Face** | Download pesi modelli (pubblici) | Di solito no token | [huggingface.co](https://huggingface.co) (account utile; modelli usati sono pubblici) |
| **Wheelmap / Sozialhelden** | Embed iframe accessibilità | Opzionale | Contatta [info@sozialhelden.de](mailto:info@sozialhelden.de) — [widget](https://news.wheelmap.org/wheelmap-widget/) |
| **Cursor** (opzionale) | IDE AI / Agent per adattare il fork | No | [cursor.com](https://cursor.com) |
| **Claude** (opzionale) | Chat o Claude Code per adattare il fork | No | [claude.ai](https://claude.ai) |

Fonti open **senza registrazione** usate dal progetto: Open-Meteo, RainViewer,
ItaliaMeteo (via MCP), OpenStreetMap/Overpass, OpenAEDMap, ViaggiaTreno,
farmaciediturno.org, MIUR, ecc. — i relativi pannelli falliscono in modo
indipendente se la fonte è giù.

---

## 4. Passo A — Account GitHub

1. Vai su [github.com/signup](https://github.com/signup) e crea un account
   (o usa un’organizzazione).
2. Abilita **2FA** (Settings → Password and authentication): consigliato
   prima di creare token.
3. (Opzionale, più avanti) Personal Access Token:
   - Settings → Developer settings → Personal access tokens
   - Per **Partecipa** (crea issue): scope `issues` (write) sul tuo repo
   - Per **persistenza DAE** su Vercel: scope `contents` (write) sul tuo repo
   - Non committare mai il token: solo env su Vercel / `.env.local`

---

## 5. Passo B — Fork o mirror del repository

### Opzione A — Fork (consigliata)

1. Apri <https://github.com/magiaslab/san-vincenzo-cruscotto>
2. Pulsante **Fork** → scegli account/org → Create fork
3. Otterrai `https://github.com/TUO_USER/san-vincenzo-cruscotto` (o rinominalo)

### Opzione B — Mirror in un repo nuovo

```bash
git clone --depth 1 https://github.com/magiaslab/san-vincenzo-cruscotto.git mio-cruscotto
cd mio-cruscotto
rm -rf .git
git init
git remote add origin git@github.com:TUO_USER/mio-cruscotto.git
git add -A && git commit -m "Fork iniziale cruscotto comunale"
git branch -M main
git push -u origin main
```

Poi clona in locale il **tuo** remote e lavora lì.

---

## 6. Passo C — Ambiente locale

Prerequisiti: **Node.js 20+** e npm (o pnpm/yarn).

```bash
git clone https://github.com/TUO_USER/TUO-REPO.git
cd TUO-REPO
npm install
cp .env.example .env.local   # opzionale: lascia vuoto per l’MVP
npm run dev
```

Apri <http://localhost:3000>. Smoke test nucleo:

```bash
curl -s localhost:3000/api/kpi | head -c 400
```

Deve rispondere JSON con anagrafica/demografia (dopo il cambio ISTAT:
il tuo comune).

Comandi utili: `npm run build`, `npm run lint` (unico quality gate oltre al build).

---

## 7. Passo D — Identità del comune (minimo)

### File principale: `config/comune.json` (runtime)

1. Copia [`config/comune.example.json`](../config/comune.example.json) sopra
   `config/comune.json` (o modifica quello esistente).
2. Compila almeno: `istat_code`, `nome`, `provincia`, `regione`,
   `geo.map_center`, `geo.meteo`, `geo.terrain_sea_side`,
   `miur_codice_catastale`, `farmacie_di_turno_cod`, `brand.*`, `fork.*`.
3. Spegnere ciò che non hai: `"porto": false`, `"balneazione": false`,
   `"erosione_costiera": false`, `"treni": false`,
   `"allerte_toscana_sir": false`, ecc.
4. **Non toccare** `src/lib/project-origin.ts` (crediti e link al progetto
   originale). In `fork` metti `is_upstream: false` e i tuoi contatti.

`src/lib/constants.ts` legge da `comune.json`: mappe, meteo, allerte,
farmacie, stemma, URL eventi/turismo puntano al **tuo** comune, non restano
su San Vincenzo.

Dopo l’identità, rigenera i dataset **locali** (non arrivano dal MCP AgID):

```bash
npm run dae:sync          # DAE OSM sul bbox / raggio
npm run omi:update        # quotazioni immobiliari ISTAT
npm run trasporti:gtfs    # fermate/linee GTFS intorno al centro
```

Senza questi file l’UI non resta su San Vincenzo: DAE e TPL degradano
(Overpass / collection vuota); OMI prova il mirror ondata.

**Percorsi ciclabili/pedonali** arrivano da OpenStreetMap (relazioni `route=bicycle|hiking`
nel bbox). `features.ciclabili_pedonali` è **true** di default. Gli URL
`ciclabili_geojson` / `pedonali_geojson` restano un overlay opzionale (DBT
comunale); lasciali vuoti se non hai un GIS locale.

### Come trovare i dati

| Campo | Dove cercarlo |
| --- | --- |
| Codice ISTAT (6 cifre) | ISTAT / Wikipedia / Cruscotto Italia `search_comune` |
| Codice catastale MIUR | Portale Unico Scuola / CSV anagrafe scuole |
| Farmacie di turno | ISTAT senza lo zero iniziale su farmaciediturno.org |
| Stazione FS | `https://www.viaggiatreno.it/.../autocompletaStazione/NOME` |
| Allerte | `https://allertameteo.app/api/alert/NomeComune` (nazionale) |
| Open data regionali | [dati.gov.it](https://www.dati.gov.it/) → organizzazioni Regioni; spesso CKAN `https://dati.<regione>.it/api/3/action` |
| Turismo / GTFS / eventi | Dataset della tua Regione (non copiare i path Toscana se non sei in Toscana) |

### Checklist moduli (`features`)

| Feature | Se `false` |
| --- | --- |
| `porto` | Nasconde tab Porto e API webcam |
| `balneazione` | Nasconde card mare e API ARPAT balneazione |
| `erosione_costiera` | Nasconde WFS IdroGEO «dinamica litoranea» (comuni interni) |
| `treni` | Disattiva board ViaggiaTreno |
| `eventi_comune` / `eventi_regionali` | Niente scrape calendario / CKAN eventi |
| `allerte_toscana_sir` | Solo allertameteo.app (ok fuori Toscana) |
| `gtfs_locale` | Niente estratto GTFS locale (restano fermate OSM) |
| `ciclabili_pedonali` | Nasconde lista/mappa percorsi OSM e overlay GeoJSON comunale |

Dopo le modifiche: commit + push sul tuo repo.

---

## 8. Passo E — Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New… → Project**
   (oppure usa il [Deploy Button](https://vercel.com/new/clone?repository-url=https://github.com/magiaslab/san-vincenzo-cruscotto)
   sul repo / fork)
2. Importa il repository forkato (autorizza GitHub se richiesto)
3. Framework Preset: **Next.js** (già in `vercel.json`, region `fra1`)
4. **Environment Variables**: per l’MVP lascia vuoto
5. Deploy → attendi build → apri l’URL `https://….vercel.app`
6. Verifica: `https://….vercel.app/api/kpi` e navigazione sidebar

Ogni push su `main`/`master` (branch di produzione) ridistribuisce.
CI GitHub: solo lint (`.github/workflows/lint.yml`), non il deploy.

CLI alternativa:

```bash
npx vercel          # preview
npx vercel --prod   # produzione
```

---

## 9. Passo F — Dominio e SEO

1. In Vercel → Project → **Settings → Domains** → aggiungi `tuodominio.it`
   e/o `www.tuodominio.it`
2. Configura DNS come indicato da Vercel (A / CNAME)
3. Imposta su Vercel (Production):

   ```bash
   NEXT_PUBLIC_SITE_URL=https://www.tuodominio.it
   ```

   Le variabili `NEXT_PUBLIC_*` richiedono **redeploy** dopo il salvataggio.
4. Imposta `brand.site_url` in `config/comune.json` (i fork senza questo campo
   non ereditano più `www.cruscottosanvincenzo.it`).
5. Controlla `/manifest.webmanifest`, Open Graph e che il footer punti al
   tuo dominio/contatti

---

## 10. Catalogo variabili d’ambiente

Vedi anche [`.env.example`](../.env.example). Su Vercel: Settings → Environment Variables.

| Variabile | Obbligatoria | Servizio | Effetto se assente |
| --- | --- | --- | --- |
| _(nessuna)_ | — | AgID MCP | KPI funzionano comunque |
| `NEXT_PUBLIC_SITE_URL` | Consigliata in prod | SEO / PWA / bot | Fallback a URL Vercel o host hardcoded |
| `OPENWEATHER_API_KEY` | No | OpenWeather | `/api/meteo/openweather` in errore; restano Open-Meteo / ItaliaMeteo |
| `ASSISTENTE_MODAL_URL` | No | Modal RAG | Usa default magiaslab (non adatto a un altro comune) |
| `TELEGRAM_BOT_TOKEN` | Per bot DAE | Telegram | Webhook rifiuta; CTA poco utile |
| `TELEGRAM_WEBHOOK_SECRET` | Consigliata | Auth webhook | Meno sicuro |
| `TELEGRAM_ADMIN_CHAT_IDS` | Per moderazione | Telegram | Nessuna approvazione admin |
| `NEXT_PUBLIC_TELEGRAM_BOT_URL` | No | Deep link CTA | Default bot SV |
| `GITHUB_TOKEN` / `GH_TOKEN` | Per DAE su Vercel | GitHub Contents | Approvazioni DAE non persistono (filesystem efimero) |
| `GITHUB_REPO` / `GITHUB_BRANCH` | No | GitHub | Default repo originale — **cambiali nel fork** |
| `GITHUB_FEEDBACK_TOKEN` | No | GitHub Issues | Form Partecipa: fallback “apri issue” manuale |
| `NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN` | No | Wheelmap | Solo mappa OSM locale |
| `TURISMO_CSV_FALLBACK_URL` | No | Turismo | Solo se CKAN in ritardo |

**Non committare** `.env.local` né token. Mai in screenshot o issue pubbliche.

---

## 11. Moduli opzionali

### 11.1 OpenWeather

1. Registrati su OpenWeather → crea API key (piano free)
2. Vercel: `OPENWEATHER_API_KEY=…` → Redeploy
3. Verifica sezione Meteo / endpoint `/api/meteo/openweather`

### 11.2 Bot Telegram DAE

Dettaglio storico/analisi: [`docs/dae-telegram-bot.md`](dae-telegram-bot.md).
Persistenza attuale: GeoJSON `public/data/dae-segnalazioni.geojson` + commit
GitHub (non Upstash).

1. In Telegram: [@BotFather](https://t.me/BotFather) → `/newbot` → salva il token
2. Avvia il bot, scrivi `/start`, poi chiama
   `https://api.telegram.org/bot<TOKEN>/getUpdates` e copia il tuo `chat.id`
3. Env Vercel:

   ```bash
   TELEGRAM_BOT_TOKEN=…
   TELEGRAM_WEBHOOK_SECRET=stringa-casuale-lunga
   TELEGRAM_ADMIN_CHAT_IDS=123456789
   NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/NomeDelTuoBot
   GITHUB_TOKEN=ghp_…          # issues:write sul TUO repo
   GITHUB_REPO=TUO_USER/TUO-REPO
   GITHUB_BRANCH=master        # o main
   ```

4. Dopo il deploy, imposta il webhook:

   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H 'content-type: application/json' \
     -d '{
       "url": "https://TUO-DOMINIO/api/telegram/webhook",
       "secret_token": "STESSO_DI_TELEGRAM_WEBHOOK_SECRET"
     }'
   ```

5. Locale senza webhook: `npm run telegram:poll` (serve `TELEGRAM_BOT_TOKEN`)
6. Sync base DAE OSM: `npm run dae:sync` (bbox da `geo.bbox` / raggio intorno
   a `map_center`; output in `urls.dae_geojson`)

### 11.3 Assistente RAG (Modal + Hugging Face)

Vedi [`modal_rag/README.md`](../modal_rag/README.md).

1. Account [Modal](https://modal.com) → `pip install modal` → `modal setup`
2. Adatta/rigenera il corpus per il tuo comune:

   ```bash
   npm run rag:corpus    # o: node modal_rag/build_corpus.mjs
   ```

3. Deploy:

   ```bash
   modal deploy modal_rag/app.py
   ```

4. Copia l’URL POST `…-web-ask.modal.run` in Vercel:

   ```bash
   ASSISTENTE_MODAL_URL=https://TUO_WORKSPACE--….modal.run
   ```

5. Aggiorna FAQ in `src/lib/assistente-faq.ts` (nome comune, link `#sezione`)
6. **Non** lasciare il default che punta all’app Modal di San Vincenzo

Hugging Face: i modelli (`paraphrase-multilingual-MiniLM-L12-v2`,
`SmolLM2-360M-Instruct`) sono pubblici; Modal li scarica al cold start.
Account HF opzionale; eventuale token HF solo se usi modelli gated.

### 11.4 Partecipa (GitHub Issues)

1. Token con `issues:write` sul tuo repo
2. `GITHUB_TOKEN` o `GITHUB_FEEDBACK_TOKEN` + `GITHUB_REPO=TUO_USER/TUO-REPO`
3. Senza token il form propone di aprire l’issue a mano sul browser

### 11.5 Wheelmap

1. Richiedi embed token a Sozialhelden
2. `NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN=…` → Redeploy
3. Senza token resta la mappa accessibilità OSM locale

### 11.6 Trasporti / treni / GTFS / allerte / turismo

| Area | Cosa adattare |
| --- | --- |
| Treni | `ferrovie.stazione_viaggiatreno` in `comune.json`; board `/api/trasporti/treni` |
| GTFS bus | `npm run trasporti:gtfs` (centro/raggio dal JSON). Senza file: fermate OSM |
| Allerte | `allerte.*` in `comune.json`, `/api/meteo/allerte` |
| ARPAT / turismo / eventi | URL regionali in `comune.json`; CKAN Toscana non è universale |
| Porto / webcam / erosione | `features.porto`, `balneazione`, `erosione_costiera` |
| Rilievo 3D | `geo.terrain_sea_side` (`none` se non costiero) |
| Rifiuti | `features.rifiuti_ispra` (CSV ISPRA nazionale). `gestori.rifiuti.*` per SEI/ARRR (HTML, non API) |
| Acqua / SII | `features.acqua_sii` + `gestori.acqua.geoserver_wfs` (WFS ASA). AIT RQTII è link, non scrape |
| Sostieni / BMC | `sostieni.buymeacoffee_slug` (vuoto = pagina e tab nascosti). Ringraziamenti in `config/sostegni.json` |

### 11.7 Rifiuti (ISPRA) e acqua (gestore SII)

**Rifiuti.** Né SEI Toscana né gli altri gestori ATO pubblicano un catalogo CKAN/API.
La fonte machine-readable è il **Catasto nazionale ISPRA**
(`GET /api/rifiuti`, CSV per anno, filtro ISTAT). Opzionale: pagina HTML del
gestore (`gestori.rifiuti.url`) per RD% in corso d’anno (provvisorie).
I file ARRR sono XLS, non parsati a runtime.

**Acqua.** ASA non ha open data: etichette e fontanelle arrivano dal **WFS
GeoServer** della mappa pubblica (`asamap.it`, layer `etichette` /
`fontanelle_aq`). Qualità tecnica (RQTII) e contrattuale (RQSII) sono CSV
dell’Autorità Idrica Toscana a **scala di gestore**, con WAF che spesso
blocca i download automatici — in UI restano i link.

MVP onesto: **KPI nazionali + mappa + 1–2 fonti locali**.

---

## 12. Usare Cursor o Claude sul fork

Cursor e Claude aiutano a **personalizzare il codice** (constants, asset, moduli).
Non serve costruire un MCP del cruscotto: i KPI arrivano già dal MCP AgID.

### Cursor

1. Installa [Cursor](https://cursor.com) e apri la cartella del tuo fork
2. `npm install && npm run dev`
3. In chat Agent, esempi utili:
   - *«Aggiorna `src/lib/constants.ts` per il comune X, ISTAT Y, coordinate lat/lon Z»*
   - *«Sostituisci stemma e riferimenti a San Vincenzo con …»*
   - *«Disattiva o adatta i pannelli porto / ARPAT / GTFS Toscana»*
4. Il file [`AGENTS.md`](../AGENTS.md) orienta gli agent: progetto read-only lato
   dati, smoke `curl localhost:3000/api/kpi`, niente database locale

### Claude (chat o Claude Code)

1. Apri il repo in Claude Code, oppure carica/incolla i file chiave in un Project
2. Usa un brief fisso (Custom instructions / Project instructions), ad esempio:

   > Fork del Cruscotto San Vincenzo per il Comune di …. ISTAT ….
   > Stack Next.js 15 App Router. Identità in `src/lib/constants.ts`.
   > Nessun DB. KPI da MCP AgID. Non rimuovere disclaimer e attribuzioni.
   > Checklist: `config/comune.example.json` e `docs/riuso-fork.md`.

3. Chiedi le stesse modifiche elencate per Cursor; verifica sempre con
   `npm run lint` e lo smoke `/api/kpi`

### Opzionale: MCP AgID nell’IDE

Se vuoi interrogare i KPI **direttamente** da Cursor/Claude (oltre al sito),
puoi aggiungere come server MCP l’URL pubblico AgID:

`https://cruscotto-italia-mcp.agid.workers.dev/mcp`

Tool tipici: `comune_kpi` / `comune_dashboard` con il tuo `istat_code`.
Il formato dipende dal client (URL HTTP o bridge stdio). **Non** è necessario
per far funzionare il cruscotto online.

---

## 13. Checklist finale e troubleshooting

### Prima di dichiarare “online”

- [ ] Fork/mirror sul tuo GitHub
- [ ] `ISTAT_CODE` e anagrafica aggiornati; smoke `/api/kpi` corretto
- [ ] `npm run dae:sync`, `omi:update`, `trasporti:gtfs` (o feature spente)
- [ ] `geo.terrain_sea_side` e `features.erosione_costiera` coerenti col territorio
- [ ] Stemma e nome in header/footer
- [ ] Deploy Vercel verde
- [ ] `NEXT_PUBLIC_SITE_URL` (e dominio) se non usi solo `*.vercel.app`
- [ ] `GITHUB_REPO` aggiornato se usi Partecipa o bot DAE
- [ ] Disclaimer “progetto non ufficiale” e tab Attribuzioni ancora presenti
- [ ] Moduli SV non pertinenti: nascosti, adattati o lasciati degradare in modo chiaro
- [ ] Nessun secret in git

### Problemi frequenti

| Sintomo | Cosa controllare |
| --- | --- |
| Fermate bus / TPL vuoti | File GTFS di un altro comune, o path vuoto. L’API ora usa Overpass sul centro; per gli orari `npm run trasporti:gtfs`. Svuota `urls.ciclabili_geojson` se resta ldpgis SV |
| OMI prezzi «sbagliati» | Snapshot `src/data/omi/049018.json` ignorato se l’ISTAT non coincide. Esegui `npm run omi:update` |
| DAE errore / altro comune | `urls.dae_geojson` + `geo.bbox`. File assente → mappa vuota, non 500. `npm run dae:sync` |
| Rilievo 3D ancora «costa ovest» | Imposta `geo.terrain_sea_side` (`none` se interno) |
| KPI vuoti / errore | Egress rete; endpoint MCP AgID; `ISTAT_CODE` valido |
| Meteo OpenWeather ko | Chiave attiva (attivazione a volte ritardata) |
| Assistente risponde di San Vincenzo | Hai lasciato `ASSISTENTE_MODAL_URL` di default → deploy Modal tuo + corpus |
| Approvazione DAE “non trovata” / sparisce | Manca `GITHUB_TOKEN` con `issues:write` su Vercel |
| Webhook Telegram 401 | `TELEGRAM_WEBHOOK_SECRET` ≠ `secret_token` di `setWebhook` |
| Wheelmap iframe bianco | Token embed assente/bloccato |
| SEO / OG sbagliati | `NEXT_PUBLIC_SITE_URL` + redeploy; cache social debugger |

---

## 14. Licenza e disclaimer

Progetto **indipendente e non ufficiale**. Nel fork:

- Mantieni attribuzioni AgID / fonti open (tab **Attribuzioni e regole**)
- Mantieni il disclaimer di non affiliazione al Comune / AgID / Governo
- Non presentare il sito come canale ufficiale dell’ente senza accordo

Contatti riuso (autore originale): vedi footer del sito o repository GitHub.
