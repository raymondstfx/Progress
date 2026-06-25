import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Document, Resource
from backend.app.schemas.resource_schema import DocumentOut, ResourceOut
from backend.app.api.resources import document_out, resource_out
from backend.app.services.auth_service import require_admin
from backend.app.services.file_storage import save_upload
from backend.app.services.ingestion_service import ingest_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=ResourceOut)
def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    policy_area: str = Form(""),
    jurisdiction: str = Form(""),
    sector: str = Form(""),
    policy_challenge: str = Form(""),
    stakeholder_type: str = Form(""),
    summary: str = Form(""),
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    resource_id = f"res_{uuid.uuid4().hex}"
    document_id = f"doc_{uuid.uuid4().hex}"
    stored_filename, file_path, size = save_upload(file)
    resource = Resource(
        id=resource_id,
        title=title or Path(file.filename or "Uploaded document").stem,
        resource_type="uploaded_document",
        policy_area=policy_area or "Unspecified",
        jurisdiction=jurisdiction or "Unspecified",
        sector=sector or "Uploaded",
        policy_challenge=policy_challenge or "To be reviewed",
        stakeholder_type=stakeholder_type or "To be tagged",
        summary=summary or "Uploaded resource pending extracted summary review.",
        source_type="upload",
        source=file.filename or stored_filename,
        citation=f"{title or file.filename or 'Uploaded document'} (uploaded).",
        created_by=admin.id,
    )
    document = Document(
        id=document_id,
        resource_id=resource_id,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type or "",
        file_size=size,
        parse_status="pending",
        uploaded_by=admin.id,
    )
    db.add(resource)
    db.add(document)
    db.commit()
    ingest_document(db, resource, document)
    db.refresh(resource)
    return resource_out(resource)


@router.get("/{document_id}/file")
def download_file(document_id: str, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if not document or not Path(document.file_path).exists():
        raise HTTPException(status_code=404, detail="Document file not found")
    return FileResponse(document.file_path, filename=document.original_filename, media_type=document.mime_type or "application/octet-stream")


@router.get("/{document_id}/status", response_model=DocumentOut)
def document_status(document_id: str, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_out(document)


@router.post("/{document_id}/reprocess", response_model=ResourceOut)
def reprocess_document(document_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    ingest_document(db, document.resource, document)
    db.refresh(document.resource)
    return resource_out(document.resource)
