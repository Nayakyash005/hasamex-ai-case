from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.model.llm_response import QAResponse
from app.services.llm_service import answer_question
from app.services.transcript_parser import create_qa_chunks, parse_transcript
from app.services.vector_store import add_chunks


class QueryRequest(BaseModel):
    question: str


app = FastAPI(title="Hasamex Expert Interview Analysis")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/transcripts/parse")
async def parse_uploaded_transcript(file: UploadFile = File(...)):
    try:
        content = (await file.read()).decode("utf-8")
        transcript = parse_transcript(content)
        chunks = create_qa_chunks(transcript)
        add_chunks(chunks)
        return {
            "status": "success",
            "expert": transcript.expert,
            "role": transcript.role,
            "market": transcript.market,
            "chunks": len(chunks),
        }
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 text.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/query", response_model=QAResponse)
async def query_transcripts(payload: QueryRequest):
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    return answer_question(payload.question)