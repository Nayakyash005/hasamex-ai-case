import chromadb
from app.services.embedding_service import get_embedding
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="expert_transcripts"
) 

def add_chunks(chunks):
    for chunk in chunks:
        collection.add(
            ids=[chunk["chunk_id"]],
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

        all_documents.extend(result["documents"][0])
        all_metadatas.extend(result["metadatas"][0])

    return {
        "documents": [all_documents],
        "metadatas": [all_metadatas],
    }
# print(search_chunks("What are the main barriers to robotic surgery adoption?"))