"""Data models for structured expert-call transcripts."""

from pydantic import BaseModel, ConfigDict, Field


class Turn(BaseModel):

    timestamp: str
    speaker: str
    text: str


class Transcript(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    expert: str = Field(alias="Expert")
    role: str = Field(alias="Role")
    market: str
    discussion: list[Turn] = Field(default_factory=list, alias="Discussion")
