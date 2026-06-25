from datetime import datetime
from pydantic import BaseModel


class ChunkOut(BaseModel):
    id: str
    resource_id: str
    document_id: str | None = None
    chunk_index: int
    text: str
    page_start: int | None = None
    page_end: int | None = None
    section_title: str = ""
    token_count: int = 0
    score: float | None = None
    citation_label: str | None = None


class DocumentOut(BaseModel):
    id: str
    resource_id: str
    original_filename: str
    mime_type: str = ""
    file_size: int = 0
    parse_status: str
    parse_error: str = ""
    uploaded_at: datetime


class ResourceBase(BaseModel):
    title: str
    resource_type: str
    policy_area: str = ""
    jurisdiction: str = ""
    sector: str = ""
    policy_challenge: str = ""
    stakeholder_type: str = ""
    summary: str = ""
    source_type: str = ""
    source: str = ""
    citation: str = ""
    year: int | None = None


class ResourceUpdate(BaseModel):
    title: str | None = None
    resource_type: str | None = None
    policy_area: str | None = None
    jurisdiction: str | None = None
    sector: str | None = None
    policy_challenge: str | None = None
    stakeholder_type: str | None = None
    summary: str | None = None
    source: str | None = None
    citation: str | None = None
    year: int | None = None


class ResourceOut(ResourceBase):
    id: str
    tags: list[str] = []
    chunks: list[ChunkOut] = []
    documents: list[DocumentOut] = []
    created_at: datetime
    updated_at: datetime


class ResourceListOut(ResourceBase):
    id: str
    tags: list[str] = []
    chunk_count: int = 0
    document_status: str | None = None
    created_at: datetime
    updated_at: datetime
