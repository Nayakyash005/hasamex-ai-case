from pydantic import BaseModel


class Evidence(BaseModel):
    quote: str
    expert: str
    market: str
    timestamp: str


class QAResponse(BaseModel):
    answer: str
    evidence: list[Evidence]