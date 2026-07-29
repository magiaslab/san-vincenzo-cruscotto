"""
RAG Assistente San Vincenzo — deploy su Modal con modelli Hugging Face gratuiti.

Stack:
  - Embeddings: sentence-transformers/all-MiniLM-L6-v2 (CPU)
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
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# Piccolo, Apache-2.0, gira su CPU; per risposte più rapide: USE_GPU=True + T4
GEN_MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct"
USE_GPU = False  # True + gpu="T4" se vuoi più velocità (consuma crediti GPU)

CORPUS_DIR = Path(__file__).parent / "corpus"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "numpy",
        "torch",
        "transformers",
        "sentence-transformers",
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


def _topk(
    query_vec: Any,
    matrix: Any,
    docs: list[dict[str, str]],
    k: int = 4,
) -> list[dict[str, Any]]:
    import numpy as np

    q = np.asarray(query_vec, dtype=np.float32)
    q = q / (np.linalg.norm(q) + 1e-9)
    sims = matrix @ q
    idx = np.argsort(-sims)[:k]
    out = []
    for i in idx:
        d = dict(docs[int(i)])
        d["score"] = float(sims[int(i)])
        out.append(d)
    return out


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
        self.model = AutoModelForCausalLM.from_pretrained(
            GEN_MODEL,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        ).to(device)
        self.model.eval()
        self.device = device

    def _generate(self, question: str, contexts: list[dict[str, Any]]) -> str:
        import torch

        ctx = "\n\n".join(
            f"[{c['title']} | {c['source']}]\n{c['text']}" for c in contexts
        )
        system = (
            "Sei l'assistente del Cruscotto San Vincenzo (LI). "
            "Rispondi in italiano, in modo breve e fattuale, usando solo il CONTESTO. "
            "Se il contesto non basta, dillo esplicitamente. Non inventare numeri."
        )
        prompt = (
            f"<|im_start|>system\n{system}<|im_end|>\n"
            f"<|im_start|>user\nCONTESTO:\n{ctx}\n\nDOMANDA: {question}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.inference_mode():
            out = self.model.generate(
                **inputs,
                max_new_tokens=220,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        gen = out[0][inputs["input_ids"].shape[-1] :]
        text = self.tokenizer.decode(gen, skip_special_tokens=True).strip()
        return text or "Non ho trovato elementi sufficienti nel corpus per rispondere."

    @modal.method()
    def ask(self, question: str, k: int = 4) -> dict[str, Any]:
        q = (question or "").strip()
        if not q:
            return {"error": "Domanda vuota", "answer": "", "sources": []}
        q_vec = self.embedder.encode([q], normalize_embeddings=True)[0]
        contexts = _topk(q_vec, self.matrix, self.docs, k=max(1, min(k, 8)))
        answer = self._generate(q, contexts)
        return {
            "answer": answer,
            "model": GEN_MODEL,
            "embed_model": EMBED_MODEL,
            "sources": [
                {
                    "title": c["title"],
                    "source": c["source"],
                    "score": round(c["score"], 4),
                    "excerpt": c["text"][:280],
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
            "docs": len(getattr(self, "docs", []) or self.docs),
            "gen_model": GEN_MODEL,
            "embed_model": EMBED_MODEL,
            "device": getattr(self, "device", "n/a"),
        }


@app.local_entrypoint()
def main(question: str = "Che comune è San Vincenzo e quali dati mostra il cruscotto?"):
    svc = RagService()
    result = svc.ask.remote(question)
    print(json.dumps(result, ensure_ascii=False, indent=2))
