"""
RAG Assistente San Vincenzo — deploy su Modal con modelli Hugging Face gratuiti.

Stack:
  - Embeddings: paraphrase-multilingual-MiniLM-L12-v2 (CPU, IT-friendly)
  - LLM:       HuggingFaceTB/SmolLM2-360M-Instruct (CPU di default; opz. T4)

Non usa API LLM a pagamento. Consuma solo i crediti compute di Modal (~$30/mese starter).

Deploy:
  modal setup
  modal deploy modal_rag/app.py

Test locale (remote container):
  modal run modal_rag/app.py --question "Quante colonnine EV ci sono?"
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import modal

APP_NAME = "san-vincenzo-rag"
# Multilingue: migliore retrieval su domande in italiano
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
# Piccolo, Apache-2.0, gira su CPU; per risposte più rapide: USE_GPU=True + T4
GEN_MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct"
USE_GPU = False  # True + gpu="T4" se vuoi più velocità (consuma crediti GPU)

CORPUS_DIR = Path(__file__).parent / "corpus"

_base = modal.Image.debian_slim(python_version="3.11")
if USE_GPU:
    _base = _base.pip_install("torch")
else:
    # Wheel CPU: immagine più leggera, cold start più rapido sui crediti free
    _base = _base.pip_install(
        "torch==2.6.0+cpu",
        extra_options="--index-url https://download.pytorch.org/whl/cpu",
    )

image = (
    _base.pip_install(
        "fastapi[standard]",
        "numpy",
        "transformers==4.51.3",
        "sentence-transformers==3.4.1",
        "accelerate",
        "safetensors",
        "hf-transfer",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .add_local_dir(str(CORPUS_DIR), remote_path="/corpus")
)

app = modal.App(APP_NAME, image=image)


def _chunk_text(text: str, max_chars: int = 700) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text.strip())
    if len(text) <= max_chars:
        return [text] if text else []
    parts: list[str] = []
    buf = ""
    for para in text.split("\n\n"):
        if len(buf) + len(para) + 2 <= max_chars:
            buf = f"{buf}\n\n{para}".strip()
        else:
            if buf:
                parts.append(buf)
            if len(para) <= max_chars:
                buf = para
            else:
                for i in range(0, len(para), max_chars):
                    parts.append(para[i : i + max_chars])
                buf = ""
    if buf:
        parts.append(buf)
    return parts


def _load_docs() -> list[dict[str, str]]:
    docs: list[dict[str, str]] = []
    root = Path("/corpus")
    for path in sorted(root.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        title = path.stem
        m = re.match(r"^#\s+(.+)$", raw, re.M)
        if m:
            title = m.group(1).strip()
        for i, chunk in enumerate(_chunk_text(raw)):
            docs.append(
                {
                    "id": f"{path.name}#{i}",
                    "title": title,
                    "source": path.name,
                    "text": chunk,
                }
            )
    return docs


_STOP = {
    "a",
    "ad",
    "al",
    "alla",
    "alle",
    "che",
    "ci",
    "come",
    "con",
    "da",
    "dei",
    "del",
    "della",
    "delle",
    "di",
    "e",
    "è",
    "gli",
    "i",
    "il",
    "in",
    "la",
    "le",
    "lo",
    "ma",
    "mi",
    "non",
    "o",
    "per",
    "quale",
    "quali",
    "quanto",
    "quante",
    "quanti",
    "sono",
    "su",
    "un",
    "una",
}


def _tokens(text: str) -> set[str]:
    out: set[str] = set()
    for t in re.findall(r"[a-z0-9àèéìòù]+", text.lower()):
        if t in _STOP:
            continue
        # tiene acronimi corti (ev, ftth) e parole > 2
        if len(t) > 2 or t in {"ev", "ai", "kw"}:
            out.add(t)
    return out


def _topk(
    query: str,
    query_vec: Any,
    matrix: Any,
    docs: list[dict[str, str]],
    k: int = 4,
) -> list[dict[str, Any]]:
    """Hybrid: cosine embedding + boost lessicale (utile su domande IT corte)."""
    import numpy as np

    q = np.asarray(query_vec, dtype=np.float32)
    q = q / (np.linalg.norm(q) + 1e-9)
    dense = matrix @ q
    q_tok = _tokens(query)
    scores = dense.copy()
    if q_tok:
        for i, d in enumerate(docs):
            hay = _tokens(f"{d['title']} {d['text']}")
            overlap = len(q_tok & hay) / max(1, len(q_tok))
            # preferisci match su titolo
            title_hit = len(q_tok & _tokens(d["title"])) / max(1, len(q_tok))
            scores[i] = float(dense[i]) + 0.35 * overlap + 0.25 * title_hit
    idx = np.argsort(-scores)[:k]
    out = []
    for i in idx:
        d = dict(docs[int(i)])
        d["score"] = float(scores[int(i)])
        out.append(d)
    return out


def _clean_answer(text: str) -> str:
    text = text.strip().strip('"').strip("'")
    # Taglia ripetizioni / leak del contesto o di altri turni
    for stop in ("<|im_end|>", "<|im_start|>", "\nCONTESTO:", "\nDOMANDA:", "\n# "):
        if stop in text:
            text = text.split(stop, 1)[0].strip()
    # Evita dump JSON grezzo lunghissimi
    if text.count("```") >= 2 and len(text) > 600:
        text = text.split("```", 2)[0].strip() or text[:400]
    return text.strip()


def _extractive_fallback(contexts: list[dict[str, Any]]) -> str:
    """Risposta affidabile: 1-2 frasi dal chunk migliore, niente dump lungo."""
    if not contexts:
        return "Non ho trovato il dato nel cruscotto. Usa il menu per aprire la sezione pertinente."
    best = contexts[0]
    body = re.sub(r"^#\s+.+\n+", "", best["text"]).strip()
    body = re.sub(r"```json[\s\S]*?```", "", body)
    body = re.sub(r"```\s*", "", body)
    # preferisci righe con numeri (KPI)
    lines = [ln.strip(" -•\t") for ln in body.splitlines() if ln.strip()]
    numeric = [ln for ln in lines if re.search(r"\d", ln)]
    pick = numeric[:2] if numeric else lines[:2]
    text = " ".join(pick) if pick else re.sub(r"\s+", " ", body)[:220]
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 280:
        text = text[:280].rstrip() + "…"
    return text or f"Vedi il documento «{best['title']}» nel cruscotto."


def _link_for_source(source: str) -> dict[str, str] | None:
    name = (source or "").lower()
    mapping = [
        ("porto", "/#porto", "Apri sezione Porto"),
        ("carburant", "/#infra", "Apri sezione Mobilità"),
        ("banda", "/#infra", "Apri sezione Mobilità"),
        ("ev_pun", "/#infra", "Apri sezione Mobilità"),
        ("veicol", "/#infra", "Apri sezione Mobilità"),
        ("meteo", "/#meteo", "Apri sezione Meteo"),
        ("sanita", "/#sanita", "Apri sezione Sanità"),
        ("turism", "/#turismo", "Apri sezione Turismo"),
        ("ambient", "/#ambiente", "Apri sezione Ambiente"),
        ("aria", "/#ambiente", "Apri sezione Ambiente"),
        ("siope", "/#finanza", "Apri sezione Finanza"),
        ("pnrr", "/#finanza", "Apri sezione Finanza"),
        ("redditi", "/#finanza", "Apri sezione Finanza"),
        ("scuol", "/#istruzione", "Apri sezione Istruzione"),
        ("istruz", "/#istruzione", "Apri sezione Istruzione"),
    ]
    for key, href, label in mapping:
        if key in name:
            return {"href": href, "label": label}
    return None


_FAQ: list[tuple[str, list[str], str, str, str]] = [
    (
        "porto-capienza",
        [r"capienza.*porto", r"posti\s*barca", r"porto.*posti", r"ormeggi"],
        "Capienza del porto di San Vincenzo: circa 140 posti barca.",
        "/#porto",
        "Apri sezione Porto",
    ),
    (
        "carburanti",
        [r"carburant", r"benzina", r"gasolio"],
        "Prezzi e impianti carburanti (MIMIT) sono in cima alla sezione Mobilità.",
        "/#infra",
        "Apri sezione Mobilità",
    ),
    (
        "ev",
        [r"colonnin", r"ricarica\s*ev", r"punti\s*di\s*ricarica"],
        "I punti di ricarica EV sono nella sezione Mobilità (KPI e mappa).",
        "/#infra",
        "Apri sezione Mobilità",
    ),
]


def _match_faq(question: str) -> dict[str, Any] | None:
    q = (question or "").strip()
    if not q:
        return None
    for _id, patterns, answer, href, label in _FAQ:
        for pat in patterns:
            if re.search(pat, q, re.I):
                return {
                    "answer": answer,
                    "link": {"href": href, "label": label},
                    "mode": "faq",
                    "model": "local-faq",
                    "sources": [
                        {
                            "title": _id,
                            "source": f"faq:{_id}",
                            "score": 1.0,
                            "excerpt": answer,
                        }
                    ],
                }
    return None


def _is_bad_answer(text: str) -> bool:
    low = text.lower()
    refusal = (
        "non ho informazioni sufficienti" in low
        or "non ho trovato elementi" in low
        or "don't have sufficient" in low
        or "do not have sufficient" in low
        or "i don't know" in low
        or "no information" in low
    )
    return (
        not text
        or len(text) < 8
        or text.count("{") > 2
        or "sezione kpi" in low
        or low.startswith("contesto")
        or refusal
    )


@app.cls(
    cpu=2,
    memory=4096,
    timeout=600,
    scaledown_window=120,
    gpu="T4" if USE_GPU else None,
)
class RagService:
    @modal.enter()
    def load(self) -> None:
        import numpy as np
        import torch
        from sentence_transformers import SentenceTransformer
        from transformers import AutoModelForCausalLM, AutoTokenizer

        self.docs = _load_docs()
        if not self.docs:
            raise RuntimeError("Corpus vuoto in /corpus")

        self.embedder = SentenceTransformer(EMBED_MODEL, device="cpu")
        emb = self.embedder.encode(
            [d["text"] for d in self.docs],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        self.matrix = np.asarray(emb, dtype=np.float32)

        device = "cuda" if USE_GPU and torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(GEN_MODEL)
        dtype = torch.float16 if device == "cuda" else torch.float32
        self.model = AutoModelForCausalLM.from_pretrained(
            GEN_MODEL,
            torch_dtype=dtype,
        ).to(device)
        self.model.eval()
        self.device = device

    def _generate(self, question: str, contexts: list[dict[str, Any]]) -> str:
        import torch

        ctx = "\n\n".join(
            f"Fonte: {c['title']}\n{c['text']}" for c in contexts
        )
        # Limita contesto: modello piccolo, meglio pochi chunk mirati
        if len(ctx) > 2200:
            ctx = ctx[:2200]
        system = (
            "Sei l'assistente del Cruscotto San Vincenzo. "
            "Rispondi SOLO in italiano. "
            "Formato obbligatorio: (1) il dato richiesto in UNA frase, oppure "
            "(2) indica la sezione del cruscotto (es. Porto, Mobilità, Meteo). "
            "Usa SOLO numeri presenti nel CONTESTO. Non inventare. "
            "Vietato: elenchi lunghi, storie, markdown, ripetere il contesto. "
            "Se manca il dato: scrivi esattamente "
            '"Dato non in indice: apri la sezione corrispondente del cruscotto."'
        )
        user = (
            f"CONTESTO:\n{ctx}\n\n"
            f"DOMANDA: {question}\n\n"
            "Risposta (solo dato o sezione):"
        )
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        if hasattr(self.tokenizer, "apply_chat_template"):
            prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        else:
            prompt = (
                f"<|im_start|>system\n{system}<|im_end|>\n"
                f"<|im_start|>user\n{user}<|im_end|>\n"
                f"<|im_start|>assistant\n"
            )
        inputs = self.tokenizer(
            prompt, return_tensors="pt", truncation=True, max_length=2048
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.inference_mode():
            out = self.model.generate(
                **inputs,
                max_new_tokens=64,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )
        gen = out[0][inputs["input_ids"].shape[-1] :]
        text = _clean_answer(self.tokenizer.decode(gen, skip_special_tokens=True))
        if _is_bad_answer(text):
            return _extractive_fallback(contexts)
        return text

    @modal.method()
    def ask(self, question: str, k: int = 3) -> dict[str, Any]:
        q = (question or "").strip()
        if not q:
            return {"error": "Domanda vuota", "answer": "", "sources": [], "link": None}
        faq = _match_faq(q)
        if faq:
            return faq
        q_vec = self.embedder.encode([q], normalize_embeddings=True)[0]
        contexts = _topk(q, q_vec, self.matrix, self.docs, k=max(1, min(k, 4)))
        answer = self._generate(q, contexts)
        link = None
        for c in contexts:
            link = _link_for_source(c.get("source", ""))
            if link:
                break
        return {
            "answer": answer,
            "link": link,
            "mode": "rag",
            "model": GEN_MODEL,
            "embed_model": EMBED_MODEL,
            "sources": [
                {
                    "title": c["title"],
                    "source": c["source"],
                    "score": round(c["score"], 4),
                    "excerpt": c["text"][:220],
                }
                for c in contexts
            ],
        }

    @modal.fastapi_endpoint(method="POST")
    def web_ask(self, body: dict[str, Any]) -> dict[str, Any]:
        return self.ask.local(
            str(body.get("question") or body.get("q") or ""),
            int(body.get("k") or 4),
        )

    @modal.fastapi_endpoint(method="GET")
    def health(self) -> dict[str, Any]:
        return {
            "ok": True,
            "app": APP_NAME,
            "docs": len(getattr(self, "docs", []) or []),
            "gen_model": GEN_MODEL,
            "embed_model": EMBED_MODEL,
            "device": getattr(self, "device", "n/a"),
        }


@app.local_entrypoint()
def main(question: str = "Che comune è San Vincenzo e quali dati mostra il cruscotto?"):
    svc = RagService()
    result = svc.ask.remote(question)
    print(json.dumps(result, ensure_ascii=False, indent=2))
