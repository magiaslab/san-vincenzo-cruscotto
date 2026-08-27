# RAG Assistente (Modal + Hugging Face)

Piccolo **RAG** sui contenuti del cruscotto del **tuo** comune.
Non riusare l’indice di San Vincenzo: genera il corpus dopo aver compilato
`config/comune.json`.

## Idea

| Pezzo | Modello HF | Dove gira |
| --- | --- | --- |
| Embedding | [`paraphrase-multilingual-MiniLM-L12-v2`](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) | CPU Modal |
| Generazione | [`HuggingFaceTB/SmolLM2-360M-Instruct`](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) | CPU Modal (opz. T4) |
| Indice | cosine similarity NumPy sul corpus in `corpus/` | in memoria al boot |

Niente OpenAI / Anthropic / Inference API a consumo token: scarichi i pesi da Hugging Face e li esegui sui **crediti compute gratis** di Modal (Starter ≈ $30/mese, scale-to-zero).

> Non è “addestramento”: è retrieval + generazione. Per aggiornare le conoscenze, aggiorni il corpus e rideployi.

## Deploy

```bash
pip install modal
modal setup
npm run rag:corpus
modal deploy modal_rag/app.py
```

Copia l’URL POST `…-web-ask.modal.run` in `ASSISTENTE_MODAL_URL`.
Non lasciare l’endpoint di un altro comune.

## Test

```bash
modal run modal_rag/app.py --question "Qual è la copertura FTTH?"

curl -X POST "$ASSISTENTE_MODAL_URL" \
  -H 'content-type: application/json' \
  -d '{"question":"Qual è la copertura FTTH?"}'
```

## Aggiornare il corpus

```bash
node modal_rag/build_corpus.mjs
modal deploy modal_rag/app.py
```

## Costi / performance

- **CPU (default)**: lento al cold start (download modelli) ma economico; ok per demo.
- **GPU T4**: in `app.py` metti `USE_GPU = True` — più veloce, consuma i crediti GPU.
- A idle il container scala a zero → non paghi quando nessuno chiede.

## Limiti onesti

- SmolLM2-360M è piccolo: risposte brevi, a volte grezze; resta ancorato al contesto RAG.
- Per qualità migliore (sempre open e self-host): `Qwen/Qwen2.5-1.5B-Instruct` su T4.
- Domande note: risposta **FAQ locale** (dato o link `#sezione`) in `/api/assistente`, senza passare dal LLM.
- Contratto risposta: **solo il dato richiesto** oppure **link alla sezione del cruscotto**. Niente testi inventati.
- Il corpus attuale è un estratto KPI/dashboard + testi del sito; non sostituisce i dataset grezzi di `dati.toscana.it`.
