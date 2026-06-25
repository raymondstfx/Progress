from pathlib import Path
import uuid

import fitz
from docx import Document as DocxDocument
from sqlalchemy.orm import Session

from backend.app.db.models import Chunk, Document, Resource
from backend.app.services.chunking_service import clean_text, chunk_text
from backend.app.services.embedding_service import index_chunks


def extract_text(path: str, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".txt":
        return Path(path).read_text(encoding="utf-8", errors="ignore")
    if suffix == ".pdf":
        pieces = []
        with fitz.open(path) as pdf:
            for page_number, page in enumerate(pdf, start=1):
                text = page.get_text("text")
                if text.strip():
                    pieces.append(f"\n\n[Page {page_number}]\n{text}")
        return "\n".join(pieces)
    if suffix in {".docx", ".doc"}:
        doc = DocxDocument(path)
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)
    raise ValueError("Unsupported file type. Use TXT, PDF, or DOCX.")


def ingest_document(db: Session, resource: Resource, document: Document) -> None:
    document.parse_status = "processing"
    db.commit()
    try:
        text = clean_text(extract_text(document.file_path, document.original_filename))
        document.extracted_text = text
        chunks = chunk_text(text)
        for old_chunk in list(document.chunks):
            db.delete(old_chunk)
        db.flush()
        for item in chunks:
            db.add(
                Chunk(
                    id=f"chunk_{uuid.uuid4().hex}",
                    resource_id=resource.id,
                    document_id=document.id,
                    chunk_index=item["chunk_index"],
                    text=item["text"],
                    page_start=item["page_start"],
                    page_end=item["page_end"],
                    section_title=item["section_title"],
                    token_count=item["token_count"],
                )
            )
        document.parse_status = "completed" if chunks else "failed"
        document.parse_error = "" if chunks else "No extractable text found"
        db.commit()
        index_chunks(db, resource.id)
    except Exception as error:
        document.parse_status = "failed"
        document.parse_error = str(error)
        db.commit()
