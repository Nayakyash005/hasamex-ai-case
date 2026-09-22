from pathlib import Path
import re

from app.model.transcript import Transcript, Turn
from app.services.embedding_service import get_embedding

_EXPERT_PATTERN = re.compile(r"^Expert\s+\d+\s+[–-]\s*(?P<expert>.+)$")
_FIELD_PATTERN = re.compile(r"^(?P<field>Role|Market):\s*(?P<value>.+)$")
_TIMESTAMP_PATTERN = re.compile(r"^\d{1,2}:\d{2}$")


def parse_transcript(content: str) -> Transcript:

    normalized_content = content.replace("\r\n", "\n").strip()
    if not normalized_content:
        raise ValueError("Transcript content is empty.")

    lines = normalized_content.split("\n")
    expert = None
    fields: dict[str, str] = {}
    discussion: list[Turn] = []
    index = 0

    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue

        expert_match = _EXPERT_PATTERN.match(line)
        if expert_match and expert is None:
            expert = expert_match.group("expert").strip()
            index += 1
            continue

        field_match = _FIELD_PATTERN.match(line)
        if field_match:
            fields[field_match.group("field").lower()] = field_match.group("value").strip()
            index += 1
            continue

        timestamp_match = _TIMESTAMP_PATTERN.match(line)
        if timestamp_match:
            timestamp = line
            if index + 1 >= len(lines):
                break

            speaker_line = lines[index + 1].strip()
            if ":" not in speaker_line:
                index += 1
                continue

            speaker, text = speaker_line.split(":", 1)
            speaker = speaker.strip()
            text_parts: list[str] = []
            next_index = index + 2

            # while next_index < len(lines):
            #     next_line = lines[next_index].strip()
            #     if not next_line:
            #         text_parts.append("")
            #         next_index += 1
            #         continue
            #     if _TIMESTAMP_PATTERN.match(next_line):
            #         break
            #     text_parts.append(next_line)
            #     next_index += 1

            discussion.append(
                Turn(
                    timestamp=timestamp,
                    speaker=speaker,
                    # text=" ".join(" ".join(text_parts).split()),
                    text=text.strip(),
                )
            )
            index = next_index
            continue

        index += 1

    if expert is None or "role" not in fields or "market" not in fields:
        raise ValueError("Transcript must include Expert, Role, and Market headers.")

    return Transcript(
        expert=expert,
        role=fields["role"],
        market=fields["market"],
        discussion=discussion,
    )


def parse_transcript_file(path: str | Path) -> Transcript:
    """Read a UTF-8 text file and parse it as an expert-call transcript."""

    return parse_transcript(Path(path).read_text(encoding="utf-8"))


def create_qa_chunks(transcript: Transcript)-> list[dict]:
    chunks = []
    discussion = transcript.discussion

    i = 0
    chunk_number = 1

    while i < len(discussion):
        question = discussion[i]

        if question.speaker == "Interviewer":
            answer = discussion[i + 1] if i + 1 < len(discussion) else None

            if answer and answer.speaker != "Interviewer":
                chunks.append({
                    "chunk_id": f"{transcript.market.lower()}_{chunk_number}",
                    "expert": transcript.expert,
                    "role": transcript.role,
                    "market": transcript.market,
                    "question": {
                        "timestamp": question.timestamp,
                        "text": question.text,
                    },
                    "answer": {
                        "timestamp": answer.timestamp,
                        "text": answer.text,
                    },
                    "embeddingText": 
                    ( f"QUESTION: {question.text}\n"
                      f"ANSWER: {answer.text}")
                })

                chunk_number += 1
                i += 2
                continue

        i += 1
    for chunk in chunks:
        chunk["embedding"] = get_embedding(chunk["embeddingText"])
    # print(len(chunks[0]["embedding"]))
    return chunks