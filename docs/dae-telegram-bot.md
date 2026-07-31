# Studio: bot Telegram per mappare nuovi DAE

Documento di analisi per integrare nel **Cruscotto San Vincenzo** un flusso
cittadino che segnala / mappa defibrillatori (DAE) mancanti, accessibile dalla
sezione Sanità e gestito via **Telegram**.

Stato: **MVP implementato** (webhook + overlay + CTA). Configurare env su Vercel
e `TELEGRAM_ADMIN_CHAT_IDS` dopo il primo `/start`.

---

## 1. Situazione attuale

### Cosa fa oggi il cruscotto

| Pezzo | Dove | Comportamento |
| --- | --- | --- |
| UI mappa | `src/components/DaeMap.tsx` | Leaflet, marker da GeoJSON statico |
| Dati | `public/data/dae-san-vincenzo.geojson` | Export locale OSM / OpenAEDMap |
| API | `GET /api/dae` | Serve lo stesso file (cache 24h) |
| Link esterno | `OPENAEDMAP_URL` | [openaedmap.org](https://openaedmap.org/it/#map=14/43.085/10.54) |

Il cruscotto è **read-only**: niente DB, niente auth, niente webhook
(vedi `AGENTS.md`). I DAE non arrivano da Cruscotto Italia / MCP AgID.

### Gap dati verificato (luglio 2026)

- File locale: **4** punti.
- OpenAEDMap `IT.geojson` filtrato sul comune (reverse Nominatim): **8** punti,
  tutti in San Vincenzo (LI).
- Quindi la mappa del cruscotto è **indietro** rispetto alla fonte che già usiamo.

Mitigazione immediata (fuori dal bot): script `npm run dae:sync` che riscarica
e filtra i DAE dal GeoJSON nazionale OpenAEDMap.

---

## 2. Cosa offre OpenAEDMap (API usata)

Documentazione live: [openapi](https://openaedmap.org/openapi.json) /
[Swagger UI](https://openaedmap.org/docs).

### Endpoint utili (sola lettura posizioni)

| Metodo | Path | Uso per noi |
| --- | --- | --- |
| `GET` | `/api/v1/countries/names` | Conteggi per paese |
| `GET` | `/api/v1/countries/{code}.geojson` | Export completo (IT ≈ 2 MB, ~7 600 DAE) |
| `GET` | `/api/v1/node/{id}` | Dettaglio + foto |
| `GET` | `/api/v1/tile/{z}/{x}/{y}.mvt` | Tiles vettoriali (mappa globale) |
| `POST` | `/api/v1/photos/upload` | Upload foto associate a un nodo OSM |

### Scrittura di nuovi DAE

**OpenAEDMap non espone un’API “crea DAE”.**  
Il frontend ([openaedmap-frontend](https://github.com/openstreetmap-polska/openaedmap-frontend))
scrive su **OpenStreetMap API 0.6** dopo login OAuth2 (`read_prefs write_api`):

1. `PUT /api/0.6/changeset/create`
2. `PUT /api/0.6/node/create` con tag `emergency=defibrillator` (+ location, access, indoor, phone, `check_date`, …)
3. Opzionale: upload foto sul backend OpenAEDMap

Conseguenza: un bot Telegram **non può “aggiornare OpenAEDMap” in modo diretto**
senza passare da OSM (e dalle regole della community OSM).

---

## 3. Obiettivo del bot

Dal cruscotto (sezione Sanità) chiunque possa:

1. Aprire un bot Telegram dedicato (deep link).
2. Segnalare un DAE visto sul territorio (posizione + foto + note).
3. Vedere le segnalazioni confluire nella mappa del cruscotto (subito o dopo moderazione).
4. Idealmente far sì che i punti validati finiscano anche su OSM → OpenAEDMap.

Vincoli di prodotto:

- Progetto indipendente / non ufficiale (disclaimer già presente).
- Dati sanitari sensibili: solo ubicazione pubblica del dispositivo, non dati personali di salute.
- OSM: no account condiviso che pubblica in automatico senza revisione (qualità + ToS / norme community).

---

## 4. Architetture possibili

### Opzione A — MVP consigliata: segnalazioni + moderazione + sync OSM manuale/assistito

```
[Cruscotto Sanità]
    │  CTA “Segnala un DAE su Telegram”
    ▼
[Bot Telegram] ──webhook──► [Worker (Modal o Vercel)]
    │                              │
    │  posizione / foto / testo     ├─ store segnalazioni (KV / Supabase / Modal Dict)
    │                              ├─ coda moderazione (chat admin Telegram)
    ▼                              ▼
[Overlay “Segnalazioni” sulla DaeMap]     [Admin approva]
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                     Overlay pubblicato   Deep-link OSM     Nota OSM
                     solo cruscotto       / OpenAEDMap      (issue tracker)
```

**Pro:** realizzabile senza DB complesso; rispetta OSM; utile subito.  
**Contro:** i punti “solo cruscotto” non compaiono su OpenAEDMap finché non editati su OSM.

### Opzione B — Bot come frontend OSM (OAuth per utente)

Ogni segnalatore collega il proprio account OSM dentro Telegram (login browser + token).

**Pro:** scrittura “pulita” su OSM con responsabilità individuale.  
**Contro:** UX pesante; pochi utenti completeranno il flusso; OAuth mobile/Telegram fragile.

### Opzione C — Account OSM del progetto che pubblica in automatico

**Sconsigliata** come default: rischio vandalismo, conflitti community, responsabilità legale/reputazionale sul progetto.

Usabile solo con **moderazione umana obbligatoria** e account dedicato chiaramente identificato (`created_by=cruscotto-san-vincenzo-dae-bot`), dopo prove su `master.apis.dev.openstreetmap.org`.

### Opzione D — Solo deep-link a OpenAEDMap (senza bot)

CTA che apre OpenAEDMap centrato su San Vincenzo; l’utente aggiunge da lì.

**Pro:** zero infrastruttura.  
**Contro:** non risolve “chiunque dal cruscotto”; richiede account OSM e UI esterna.

---

## 5. Flusso conversazionale bot (MVP)

Comandi:

| Comando | Azione |
| --- | --- |
| `/start` | Spiega scopo, privacy, link al cruscotto `#sanita` |
| `/nuovo` | Avvia wizard segnalazione |
| `/vicini` | Elenca DAE già noti entro N metri (da GeoJSON sync) |
| `/stato <id>` | Stato segnalazione |
| `/aiuto` | Guida breve |
| `/annulla` | Esce dal wizard |

Wizard `/nuovo`:

1. **Posizione** — `keyboard` Telegram `request_location` (GPS) oppure lat/lon testuali.
2. **Controllo duplicati** — se esiste un DAE entro ~40 m, avvisa e chiede conferma.
3. **Ubicazione testuale** — es. “ingresso municipio, a sinistra”.
4. **Accesso** — `yes` / `customers` / `private` / `unknown` (allineato ai tag OSM).
5. **Indoor** — sì/no + piano opzionale.
6. **Foto** — opzionale (Telegram file → storage nostro; su OSM solo dopo approvazione).
7. **Riepilogo + invio** → record `pending` + notifica canale moderatori.

Moderatore (chat privata / gruppo admin):

- `✅ Approva overlay` → visibile sulla mappa cruscotto come “segnalazione cittadina”.
- `🗺️ Prepara OSM` → messaggio con link iD / OpenAEDMap + XML/tag suggeriti.
- `❌ Rifiuta` + motivo.

---

## 6. Integrazione nel cruscotto

### UI (sezione Sanità / `DaeMap`)

- Pulsante **“Segnala un DAE”** → `https://t.me/<BOT_USERNAME>?start=sanita`
- Layer distinti sulla mappa:
  - **Confermati OSM** (rosso istituzionale attuale)
  - **Segnalazioni in revisione / pubblicate localmente** (altro colore + badge)
- Nota legale: “segnalazione volontaria; in emergenza chiama 118”.

### API Next.js proposte

| Route | Ruolo |
| --- | --- |
| `GET /api/dae` | DAE OSM syncati (come oggi, aggiornati da `dae:sync`) |
| `GET /api/dae/segnalazioni` | Overlay pubblico (solo `approved`) |
| `POST /api/telegram/webhook` | Webhook Bot API (se hostato su Vercel) |
| `POST /api/dae/segnalazioni` | Alternativa web-form (stesso schema del bot) |

### Hosting bot (due scelte allineate allo stack attuale)

1. **Modal** (già usato per il RAG in `modal_rag/`) — process lungo / Dict persistente, scale-to-zero.
2. **Vercel Route Handler** — webhook HTTP; persistenza su **Upstash Redis / Vercel KV** o **Supabase**.

Vercel da solo **non** basta per stato conversazionale senza store esterno.

### Variabili d’ambiente nuove

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ADMIN_CHAT_IDS=123,456
# store (una delle opzioni)
DAE_SEGNALAZIONI_KV_URL=
# oppure SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/<BOT_USERNAME>
```

---

## 7. Modello dati segnalazione

```ts
type DaeSegnalazione = {
  id: string;                 // ulid
  status: "pending" | "approved_overlay" | "published_osm" | "rejected";
  lat: number;
  lon: number;
  ubicazione?: string;
  accesso?: "yes" | "customers" | "private" | "unknown";
  indoor?: boolean;
  livello?: string;
  telefono?: string;
  foto_file_ids?: string[];   // Telegram / object storage
  telegram_user_id: number;
  telegram_username?: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_id?: number;
  osm_node_id?: number;
  note_moderazione?: string;
};
```

Tag OSM suggeriti in fase di pubblicazione:

```
emergency=defibrillator
defibrillator:location:it=<ubicazione>
access=<accesso>
indoor=yes|no
level=<piano>
phone=<tel>
check_date=<YYYY-MM-DD>
```

---

## 8. Aggiornamento continuo della mappa OSM

Indipendente dal bot, per non restare di nuovo indietro:

1. **`npm run dae:sync`** — scarica `IT.geojson`, filtra bbox/comune, scrive
   `public/data/dae-san-vincenzo.geojson`.
2. Opzionale: GitHub Action settimanale che fa sync + PR/commit.
3. Opzionale (fase 2): `GET /api/dae` che chiama Overpass o OpenAEDMap con
   cache ISR — oggi evitiamo Overpass in UI perché meno affidabile del file statico.

BBox di sync (ampia, poi filtro Nominatim opzionale):

```
lon 10.48–10.58 · lat 43.02–43.12
```

---

## 9. Privacy, sicurezza, moderazione

- Conservare solo `telegram_user_id` / username necessari alla moderazione.
- Non pubblicare username sulla mappa pubblica.
- Rate limit: max N segnalazioni / utente / giorno.
- Validazione geo: scarta punti fuori dal comune (poligono o bbox stretta).
- Webhook con `secret_token` Telegram.
- Foto: non esporre URL Telegram grezzi; proxy o storage proprio.
- Disclaimer: non sostituisce il censimento ufficiale 118 / Regione.

---

## 10. Roadmap tecnica (per fasi, senza stime di calendario)

### Fase 0 — Igiene dati (questa PR)

- Script `dae:sync` + GeoJSON aggiornato (4 → 8 punti).
- CTA UI verso OpenAEDMap (+ placeholder deep-link Telegram).
- Questo documento.

### Fase 1 — Bot MVP ✅ (in codice)

- Bot `@DaesanvincenzoBot` + `POST /api/telegram/webhook`.
- Store segnalazioni: GeoJSON `public/data/dae-segnalazioni.geojson` in **locale**;
  su **Vercel** la fonte di verità è lo stesso file via **GitHub Contents API**
  (`GITHUB_TOKEN` con `issues:write` (store Issues; `contents:write` opzionale)). Senza token, Approva fallisce con
  «non trovata nello store» perché il filesystem del deploy non persiste.
- Overlay sulla `DaeMap` + CTA Telegram.
- Polling locale: `npm run telegram:poll`.

### Fase 2 — Qualità

- Dedup spaziale, foto, export CSV per Protezione Civile / 118.
- Assistenza pubblicazione OSM (link iD precompilato / checklist).

### Fase 3 — (opzionale) Pubblicazione OSM assistita

- Account progetto + approvazione umana + dry-run su OSM dev API.
- Dopo merge OSM, `dae:sync` riporta il punto nel layer “confermati”.

---

## 11. Impatto sul codice esistente

| Area | Modifica |
| --- | --- |
| `DaeMap.tsx` | Layer segnalazioni + CTA Telegram |
| `DashboardTabs` / Sanità | Testo introduttivo “partecipa al censimento” |
| `src/app/api/dae/*` | Endpoint overlay + sync metadata |
| `src/app/api/telegram/webhook` | Nuovo (o app Modal dedicata) |
| `public/data/dae-*.geojson` | Aggiornato da script |
| `.env.example` | Token bot / store |
| Dipendenze | `grammy` o `telegraf` (se bot in-repo); altrimenti stack Modal Python |

Nessuna modifica obbligatoria all’MCP AgID.

---

## 12. Raccomandazione

Sì, **è fattibile e utile**, ma va pensato come:

1. **pipeline di segnalazione cittadina** (Telegram + overlay cruscotto), e  
2. **ponte verso OSM/OpenAEDMap** (sync automatico in lettura + pubblicazione assistita in scrittura),

non come “il bot scrive direttamente sull’API OpenAEDMap”, perché quell’API **non supporta la creazione di nodi**.

Ordine pratico: aggiornare i dati OSM già mancanti → CTA OpenAEDMap → bot MVP con moderazione → solo dopo eventuale push OSM.

---

## 13. Procedura passo passo (configurazione)

> **Stato codice:** oggi (PR studio) hai sync DAE + CTA sul sito.  
> Il **runtime del bot** (webhook, wizard, store, overlay segnalazioni) va ancora
> implementato (Fase 1). Qui sotto la procedura completa: cosa fare **ora** su
> Telegram/Vercel, e cosa attivare **dopo** che il codice MVP è deployato.

### A. Cosa puoi fare subito (senza bot)

1. Aggiorna i DAE OSM locali:
   ```bash
   npm run dae:sync
   git add public/data/dae-san-vincenzo.geojson
   git commit -m "Aggiorna DAE da OpenAEDMap"
   git push
   ```
2. Sul sito, in **Sanità**, usa già **Aggiungi su OpenAEDMap** (richiede account OSM).

### B. Crea il bot su Telegram

1. Apri Telegram e cerca **@BotFather**.
2. Invia `/newbot`.
3. Scegli un nome visualizzato, es. `DAE San Vincenzo`.
4. Scegli uno username che finisca con `bot`, es. `DaeSanVincenzoBot`.
5. Salva il **token** che BotFather ti dà (`123456:ABC-DEF...`). **Non** committarlo.
6. Opzionale ma utile:
   - `/setdescription` — es. «Segnala defibrillatori (DAE) a San Vincenzo per il cruscotto open data.»
   - `/setabouttext` — breve about
   - `/setuserpic` — icona (cuore/DAE)
   - `/setcommands` con:
     ```
     start - Avvia e leggi le istruzioni
     nuovo - Segnala un nuovo DAE
     vicini - DAE già mappati vicino a te
     stato - Stato di una segnalazione
     aiuto - Guida
     annulla - Annulla la procedura in corso
     ```
7. Annota l’URL pubblico del bot: `https://t.me/DaeSanVincenzoBot`  
   (sostituisci con il tuo username).

### C. Prepara la chat moderatori

1. Crea un **gruppo** Telegram (es. `DAE SV — moderazione`) oppure usa chat privata.
2. Aggiungi il bot al gruppo.
3. Per i gruppi: BotFather → `/setprivacy` → **Disable** (così il bot legge i comandi nel gruppo), oppure usa solo bottoni inline.
4. Scrivi qualcosa nel gruppo, poi apri in browser (con il token):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
5. Cerca `"chat":{"id": ...}` del gruppo/admin: è il valore per `TELEGRAM_ADMIN_CHAT_IDS`  
   (più id separati da virgola se servono più moderatori).

### D. Scegli dove gira il bot

Due strade allineate allo stack:

| Opzione | Quando usarla |
| --- | --- |
| **Vercel** (`POST /api/telegram/webhook`) + **Upstash Redis / Vercel KV** | Preferita se vuoi tutto sul dominio del cruscotto |
| **Modal** (come il RAG) | Se preferisci process dedicato Python e Dict persistente |

Serve comunque uno **store** (le Function Vercel sono stateless).

### E. Provisioning store (esempio Upstash)

1. Crea un database Redis su [Upstash](https://upstash.com/) (o Vercel KV dal marketplace).
2. Copia `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (o equivalenti).
3. Queste variabili andranno su Vercel insieme al token Telegram.

### F. Variabili d’ambiente sul sito (Vercel)

Nel progetto Vercel → **Settings → Environment Variables** (Production + Preview):

| Variabile | Esempio | Visibilità |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | token BotFather | solo server |
| `TELEGRAM_WEBHOOK_SECRET` | stringa lunga random | solo server |
| `TELEGRAM_ADMIN_CHAT_IDS` | `-100123...,987654` | solo server |
| `NEXT_PUBLIC_TELEGRAM_BOT_URL` | `https://t.me/DaeSanVincenzoBot` | pubblica (build) |
| `GITHUB_TOKEN` | PAT/fine-grained con **issues:write** (contents:write opzionale) | solo server (obbligatorio su Vercel) |
| `GITHUB_REPO` / `GITHUB_BRANCH` | default: repo del cruscotto / `master` | solo server |

Poi **Redeploy** (obbligatorio per `NEXT_PUBLIC_*`).

In locale, copia in `.env.local` da `.env.example` e riempi gli stessi campi.

### G. Collega il webhook Telegram (dopo il deploy del codice MVP)

1. Assicurati che l’app sia online in HTTPS, es. `https://www.cruscottosanvincenzo.it`.
2. Imposta il webhook (una tantum):
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://www.cruscottosanvincenzo.it/api/telegram/webhook",
       "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
       "allowed_updates": ["message", "callback_query"]
     }'
   ```
3. Verifica:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
4. Apri `t.me/<BOT>` → `/start` → deve rispondere.

Per rimuovere il webhook in debug:
```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### H. Configurazione sul sito (UI già predisposta)

1. Con `NEXT_PUBLIC_TELEGRAM_BOT_URL` valorizzata e redeploy fatto, in **Sanità → Mappa DAE** compare il pulsante **Segnala un DAE su Telegram**.
2. Senza quella variabile resta solo **Aggiungi su OpenAEDMap**.
3. Deep link consigliato dalla CTA:
   `https://t.me/<BOT_USERNAME>?start=sanita`  
   (il payload `sanita` permette analytics / messaggio contestuale).

### I. Checklist di collaudo end-to-end

1. Da smartphone: apri il cruscotto → Sanità → **Segnala un DAE su Telegram**.
2. `/nuovo` → invia posizione GPS → ubicazione → foto.
3. Controlla che il gruppo moderatori riceva la scheda.
4. Approva → il punto compare sull’overlay della mappa (quando il layer sarà implementato).
5. Opzionale: pubblica su OSM da OpenAEDMap / iD → poi `npm run dae:sync` per portare il punto nel layer “confermati”.

### J. Cosa manca ancora nel codice (prima che G–I funzionino del tutto)

Implementare Fase 1:

1. `POST /api/telegram/webhook` (verifica `X-Telegram-Bot-Api-Secret-Token`).
2. Wizard conversazionale (`/start`, `/nuovo`, …).
3. Persistenza segnalazioni sullo store.
4. `GET /api/dae/segnalazioni` + layer sulla `DaeMap`.
5. Pulsanti admin Approva / Rifiuta / Prepara OSM.

Finché questi pezzi non sono mergiati, i passi B–F puoi già completarli (bot creato, secret e URL pronti); il webhook (G) va impostato solo dopo il deploy dell’endpoint.

---

## Riferimenti

- OpenAEDMap backend: https://github.com/openstreetmap-polska/openaedmap-backend  
- OpenAEDMap frontend (scrittura OSM): https://github.com/openstreetmap-polska/openaedmap-frontend  
- OSM API 0.6: https://wiki.openstreetmap.org/wiki/API_v0.6  
- Telegram Bot API: https://core.telegram.org/bots/api  
- Tag AED: https://wiki.openstreetmap.org/wiki/Tag:emergency%3Ddefibrillator  
