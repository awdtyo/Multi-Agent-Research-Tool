from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Research topic or question")


class ResearchSource(BaseModel):
    id: int
    title: str
    url: str
    snippet: str | None = None
    domain: str | None = None


class StepEvent(BaseModel):
    step: int
    agent: str
    tool: str | None = None
    status: str
    message: str


class TokenEvent(BaseModel):
    text: str


class SourceEvent(BaseModel):
    id: int
    title: str
    url: str
    snippet: str | None = None
    domain: str | None = None


class HealthResponse(BaseModel):
    status: str