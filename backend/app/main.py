from fastapi import FastAPI, UploadFile, File, HTTPException

from app.services.transcript_parser import parse_transcript, create_qa_chunks
from app.services.vector_store import add_chunks
app = FastAPI()


@app.post("/api/transcripts/parse")
async def parse_uploaded_transcript(file: UploadFile = File(...)):
    try:
        content = (await file.read()).decode("utf-8")
        transcript = parse_transcript(content)
        chunks = create_qa_chunks(transcript)
        add_chunks(chunks)
        return "sucessfully added into the vectorDB"
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 text.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))