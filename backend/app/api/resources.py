from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Chunk, Resource, Tag
from backend.app.schemas.resource_schema import ChunkOut, DocumentOut, ResourceListOut, ResourceOut, ResourceUpdate
from backend.app.services.auth_service import require_admin
from backend.app.services.embedding_service import delete_vectors
from backend.app.services.file_storage import remove_file

router = APIRouter(prefix="/api/resources", tags=["resources"])


def tag_names(resource: Resource) -> list[str]:
    return [link.tag.name for link in resource.tags if link.tag]


def chunk_out(chunk: Chunk) -> ChunkOut:
    return ChunkOut(
        id=chunk.id,
        resource_id=chunk.resource_id,
        document_id=chunk.document_id,
        chunk_index=chunk.chunk_index,
        text=chunk.text,
        page_start=chunk.page_start,
        page_end=chunk.page_end,
        section_title=chunk.section_title or "",
        token_count=chunk.token_count,
    )


def document_out(document) -> DocumentOut:
    return DocumentOut(
        id=document.id,
        resource_id=document.resource_id,
        original_filename=document.original_filename,
        mime_type=document.mime_type,
        file_size=document.file_size,
        parse_status=document.parse_status,
        parse_error=document.parse_error,
        uploaded_at=document.uploaded_at,
    )


def resource_list_out(resource: Resource) -> ResourceListOut:
    status = resource.documents[0].parse_status if resource.documents else None
    return ResourceListOut(
        id=resource.id,
        title=resource.title,
        resource_type=resource.resource_type,
        policy_area=resource.policy_area,
        jurisdiction=resource.jurisdiction,
        sector=resource.sector,
        policy_challenge=resource.policy_challenge,
        stakeholder_type=resource.stakeholder_type,
        summary=resource.summary,
        source_type=resource.source_type,
        source=resource.source,
        citation=resource.citation,
        year=resource.year,
        tags=tag_names(resource),
        chunk_count=len(resource.chunks),
        document_status=status,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
    )


def resource_out(resource: Resource) -> ResourceOut:
    ordered_chunks = sorted(resource.chunks, key=lambda item: item.chunk_index)
    ordered_documents = sorted(resource.documents, key=lambda item: item.uploaded_at, reverse=True)
    return ResourceOut(
        **resource_list_out(resource).model_dump(exclude={"chunk_count", "document_status"}),
        chunks=[chunk_out(chunk) for chunk in ordered_chunks],
        documents=[document_out(document) for document in ordered_documents],
    )


@router.get("", response_model=list[ResourceListOut])
def list_resources(
    policy_area: str | None = None,
    jurisdiction: str | None = None,
    sector: str | None = None,
    policy_challenge: str | None = None,
    resource_type: str | None = None,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Resource)
    if policy_area:
        query = query.filter(Resource.policy_area.ilike(f"%{policy_area}%"))
    if jurisdiction:
        query = query.filter(Resource.jurisdiction.ilike(f"%{jurisdiction}%"))
    if sector:
        query = query.filter(Resource.sector.ilike(f"%{sector}%"))
    if policy_challenge:
        query = query.filter(Resource.policy_challenge.ilike(f"%{policy_challenge}%"))
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    resources = query.order_by(Resource.created_at.desc()).offset(offset).limit(limit).all()
    return [resource_list_out(resource) for resource in resources]


@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource_out(resource)


@router.patch("/{resource_id}", response_model=ResourceOut)
def update_resource(resource_id: str, payload: ResourceUpdate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, key, value)
    resource.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(resource)
    return resource_out(resource)


@router.delete("/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    delete_vectors([chunk.id for chunk in resource.chunks])
    for document in resource.documents:
        remove_file(document.file_path)
    db.delete(resource)
    db.commit()
    return {"ok": True}
