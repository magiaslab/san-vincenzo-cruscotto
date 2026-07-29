# RAG Assistente San Vincenzo (Modal + Hugging Face)

Piccolo **RAG** (non un fine-tune a pagamento) sui contenuti/dati del cruscotto.

## Idea

| Pezzo | Modello HF | Dove gira |
| --- | --- | --- |
| Embedding | [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | CPU Modal |
| Generazione | [`HuggingFaceTB/SmolLM2-360M-Instruct`](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) | CPU Modal (opz. T4) |
| Indice | cosine similarity NumPy sul corpus in `corpus/` | in memoria al boot |

Niente OpenAI / Anthropic / Inference API a consumo token: scarichi i pesi da Hugging Face e li esegui sui **crediti compute gratis** di Modal (Starter ≈ $30/mese, scale-to-zero).

> Non è “addestramento”: è retrieval + generazione. Per aggiornare le conoscenze, aggiorni il corpus e rideployi.

## Deploy sul workspace `magiaslab`

```bash
pip install modal
modal setup   # login browser sul tuo account magiaslab
modal deploy modal_rag/app.py
```

Dopo il deploy, Modal stampa URL tipo:

- `https://magiaslab--san-vincenzo-rag-ragservice-web-ask.modal.run` (POST JSON)
- `...-health.modal.run` (GET)

Nel progetto Next.js (Vercel):

```bash
ASSISTENTE_MODAL_URL=https://magiaslab--san-vincenzo-rag-ragservice-web-ask.modal.run
```

## Test

```bash
modal run modal_rag/app.py --question "Quante colonnine EV ci sono a San Vincenzo?"

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
- Il corpus attuale è un estratto KPI/dashboard + testi del sito; non sostituisce i dataset grezzi di `dati.toscana.it`.
