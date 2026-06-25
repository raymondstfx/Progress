from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.resources import resource_list_out
from backend.app.db.database import get_db
from backend.app.db.models import Chunk, ChunkEmbedding, Document, Resource

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def stats(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    uploads = db.query(Document).all()
    failed_uploads = [document for document in uploads if document.parse_status == "failed"]
    recent_resources = sorted(resources, key=lambda item: item.created_at, reverse=True)[:5]

    return {
        "total_resources": len(resources),
        "case_studies": len([item for item in resources if item.resource_type == "case_study"]),
        "policy_reports": len([item for item in resources if item.resource_type == "policy_report"]),
        "uploaded_documents": len(uploads),
        "failed_ingestions": len(failed_uploads),
        "indexed_chunks": db.query(Chunk).count(),
        "total_embeddings": db.query(ChunkEmbedding).count(),
        "popular_policy_areas": sorted({item.policy_area for item in resources if item.policy_area}),
        "recent_resources": [resource_list_out(item).model_dump(mode="json") for item in recent_resources],
    }
