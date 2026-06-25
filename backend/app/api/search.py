from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.resources import resource_list_out
from backend.app.db.database import get_db
from backend.app.db.models import Resource
from backend.app.schemas.search_schema import SearchRequest, SearchResponse
from backend.app.services.retrieval_service import group_results, hybrid_retrieve

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def search(payload: SearchRequest, db: Session = Depends(get_db)):
    ranked = hybrid_retrieve(db, payload.query, payload.filters, payload.top_k)
    resource_ids = list({chunk.resource_id for chunk, _score in ranked})
    resources = (
        [resource_list_out(resource) for resource in db.query(Resource).filter(Resource.id.in_(resource_ids)).all()]
        if resource_ids
        else []
    )
    return {"query": payload.query, "results": group_results(db, ranked), "resources": resources}
