import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from app.model.llm_response import QAResponse
from app.services.vector_store import search_chunks


load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        ".env",
    )
)


def get_openrouter_client() -> OpenAI:
    api_key = os.getenv("LLM_KEY") or os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("Missing OpenRouter API key.")

    return OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Hasamex AI Case",
        },
    )


def ask_openrouter(
    prompt: str,
    model: str = "openai/gpt-4o-mini",
    max_tokens: int = 512,
) -> str:

    client = get_openrouter_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "Return only valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.1,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )

    return response.choices[0].message.content.strip()


def answer_question(query: str) -> QAResponse:

    results = search_chunks(query, top_k=5)

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    if not documents:
        raise ValueError("No transcript evidence found.")

    evidence = []

    for document, metadata in zip(documents, metadatas):
        evidence.append({
            "document": document,
            "metadata": metadata,
        })

    prompt = f"""
You are answering a question using expert interview transcripts.

QUESTION:
{query}

EVIDENCE:
{json.dumps(evidence, ensure_ascii=False)}

Return JSON in exactly this format:

{{
    "answer": "answer based only on the evidence",
    "evidence": [
        {{
            "quote": "exact quote copied from an expert answer",
            "expert": "expert name",
            "market": "market",
            "timestamp": "expert answer timestamp"
        }}
    ]
}}

RULES:
1. Use only the provided transcript evidence.
2. Do not invent facts.
3. Quotes must be copied exactly from the expert's ANSWER text.
4. Do not use the interviewer question as a quote.
5. Use the answer_timestamp from the metadata.
6. Include evidence that directly supports the answer.
7. Return only JSON.
"""

    raw_response = ask_openrouter(prompt)

    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError as exc:
        raise ValueError("LLM returned invalid JSON.") from exc

    return QAResponse.model_validate(data)


if __name__ == "__main__":
    result = answer_question(
        "What are the main barriers to robotic surgery adoption?"
    )

    print(result.model_dump_json(indent=2))