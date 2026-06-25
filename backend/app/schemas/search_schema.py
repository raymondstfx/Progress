from pydantic import BaseModel, Field

from backend.app.schemas.resource_schema import ChunkOut, ResourceListOut


class SearchFilters(BaseModel):
    policy_area: str | None = None
    jurisdiction: str | None = None
    sector: str | None = None
    policy_challenge: str | None = None
    resource_type: str | None = None


class SearchRequest(BaseModel):
    query: str = ""
    filters: SearchFilters = Field(default_factory=SearchFilters)
    top_k: int = Field(10, ge=1, le=50)


class SearchResult(BaseModel):
    resource_id: str
    title: str
    score: float
    summary: str
    policy_area: str = ""
    jurisdiction: str = ""
    resource_type: str = ""
    matched_chunks: list[ChunkOut] = Field(default_factory=list)


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    resources: list[ResourceListOut] = Field(default_factory=list)
