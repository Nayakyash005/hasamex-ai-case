from __future__ import annotations

from sentence_transformers import SentenceTransformer


_MODEL = SentenceTransformer("BAAI/bge-small-en-v1.5")


def get_embedding(text: str) -> list[float]:
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    cleaned_text = text.strip()
    if not cleaned_text:
        return []

    embedding = _MODEL.encode(cleaned_text, normalize_embeddings=True)
    return embedding.tolist()