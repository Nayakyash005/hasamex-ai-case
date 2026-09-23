import os
import shutil
from pathlib import Path

import chromadb

from app.services.embedding_service import get_embedding


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PRIMARY_DB_PATH = BACKEND_ROOT / "chroma_db"
FALLBACK_DB_PATH = BACKEND_ROOT / "chroma_db_fresh"


def _create_client():
    for candidate in (PRIMARY_DB_PATH, FALLBACK_DB_PATH):
        candidate.mkdir(parents=True, exist_ok=True)

    try:
        client = chromadb.PersistentClient(path=str(PRIMARY_DB_PATH))
        client.get_or_create_collection(name="expert_transcripts")
        return client, PRIMARY_DB_PATH
    except BaseException:
        if FALLBACK_DB_PATH.exists():
            shutil.rmtree(FALLBACK_DB_PATH, ignore_errors=True)
        FALLBACK_DB_PATH.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(FALLBACK_DB_PATH))
        return client, FALLBACK_DB_PATH


client, DB_PATH = _create_client()
collection = client.get_or_create_collection(name="expert_transcripts")


def add_chunks(chunks):
    existing_ids = set(collection.get(include=[]).get("ids", []))

    for chunk in chunks:
        chunk_id = chunk["chunk_id"]
        if chunk_id in existing_ids:
            continue

        collection.add(
            ids=[chunk_id],
            documents=[chunk["embeddingText"]],
            embeddings=[chunk["embedding"]],
            metadatas=[{
                "expert": chunk["expert"],
                "role": chunk["role"],
                "market": chunk["market"],
                "question_timestamp": chunk["question"]["timestamp"],
                "answer_timestamp": chunk["answer"]["timestamp"],
            }],
        )
        existing_ids.add(chunk_id)


def search_chunks(query: str, top_k: int = 2):
    query_embedding = get_embedding(query)

    markets = ["France", "Germany", "United Kingdom"]
    all_documents = []
    all_metadatas = []

    for market in markets:
        result = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"market": market},
        )

        if result.get("documents") and result["documents"]:
            all_documents.extend(result["documents"][0])
        if result.get("metadatas") and result["metadatas"]:
            all_metadatas.extend(result["metadatas"][0])

    return {
        "documents": [all_documents],
        "metadatas": [all_metadatas],
    }