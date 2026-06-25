from collections import defaultdict

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.db.models import Chunk, Resource
from backend.app.schemas.search_schema import SearchFilters
from backend.app.services.embedding_service import embed_texts, get_collection


def apply_resource_filters(query, filters: SearchFilters):
    if filters.policy_area:
        query = query.filter(Resource.policy_area.ilike(f"%{filters.policy_area}%"))
    if filters.jurisdiction:
        query = query.filter(Resource.jurisdiction.ilike(f"%{filters.jurisdiction}%"))
    if filters.sector:
        query = query.filter(Resource.sector.ilike(f"%{filters.sector}%"))
    if filters.policy_challenge:
        query = query.filter(Resource.policy_challenge.ilike(f"%{filters.policy_challenge}%"))
    if filters.resource_type:
        query = query.filter(Resource.resource_type == filters.resource_type)
    return query


def keyword_score(query: str, text: str) -> float:
    tokens = [token for token in query.lower().split() if len(token) > 2]
    if not tokens:
        return 0.35
    haystack = text.lower()
    hits = sum(1 for token in tokens if token in haystack)
    exact = 0.25 if query.lower() in haystack else 0.0
    return min(1.0, hits / len(tokens) + exact)


def chunk_to_dict(chunk: Chunk, score: float = 0.0, citation_label: str | None = None) -> dict:
    return {
        "id": chunk.id,
        "resource_id": chunk.resource_id,
        "document_id": chunk.document_id,
        "chunk_index": chunk.chunk_index,
        "text": chunk.text,
        "page_start": chunk.page_start,
        "page_end": chunk.page_end,
        "section_title": chunk.section_title or "",
        "token_count": chunk.token_count,
        "score": round(float(score), 4),
        "citation_label": citation_label,
    }


def hybrid_retrieve(db: Session, query: str, filters: SearchFilters, top_k: int = 10) -> list[tuple[Chunk, float]]:
    resource_query = apply_resource_filters(db.query(Resource), filters)
    resource_ids = [resource.id for resource in resource_query.all()]
    if not resource_ids:
        return []

    scores: dict[str, float] = defaultdict(float)
    chunks_by_id: dict[str, Chunk] = {}
    if query.strip():
        keyword_chunks = (
            db.query(Chunk)
            .join(Resource, Resource.id == Chunk.resource_id)
            .filter(Resource.id.in_(resource_ids))
            .filter(or_(Chunk.text.ilike(f"%{query}%"), Resource.title.ilike(f"%{query}%"), Resource.summary.ilike(f"%{query}%")))
            .limit(max(top_k * 4, 20))
            .all()
        )
    else:
        keyword_chunks = db.query(Chunk).filter(Chunk.resource_id.in_(resource_ids)).limit(max(top_k * 4, 20)).all()

    for chunk in keyword_chunks:
        resource = db.get(Resource, chunk.resource_id)
        text = f"{resource.title if resource else ''} {resource.summary if resource else ''} {chunk.text}"
        scores[chunk.id] += 0.55 * keyword_score(query, text)
        chunks_by_id[chunk.id] = chunk

    try:
        where = {"resource_id": {"$in": resource_ids}}
        query_embedding = embed_texts([query or "policy implementation"])[0]
        result = get_collection().query(query_embeddings=[query_embedding], n_results=max(top_k * 3, 12), where=where)
        ids = result.get("ids", [[]])[0]
        distances = result.get("distances", [[]])[0]
        for index, chunk_id in enumerate(ids):
            chunk = db.get(Chunk, chunk_id)
            if not chunk:
                continue
            distance = distances[index] if index < len(distances) else 1.0
            scores[chunk.id] += 0.75 * max(0.0, 1.0 - float(distance))
            chunks_by_id[chunk.id] = chunk
    except Exception:
        pass

    if not scores:
        for chunk in db.query(Chunk).filter(Chunk.resource_id.in_(resource_ids)).limit(top_k).all():
            scores[chunk.id] = keyword_score(query, chunk.text)
            chunks_by_id[chunk.id] = chunk

    ranked = sorted(((chunks_by_id[chunk_id], score) for chunk_id, score in scores.items()), key=lambda item: item[1], reverse=True)
    return ranked[:top_k]


def group_results(db: Session, ranked_chunks: list[tuple[Chunk, float]]) -> list[dict]:
    grouped: dict[str, dict] = {}
    for chunk, score in ranked_chunks:
        resource = db.get(Resource, chunk.resource_id)
        if not resource:
            continue
        if resource.id not in grouped:
            grouped[resource.id] = {
                "resource_id": resource.id,
                "title": resource.title,
                "score": 0.0,
                "summary": resource.summary,
                "policy_area": resource.policy_area,
                "jurisdiction": resource.jurisdiction,
                "resource_type": resource.resource_type,
                "matched_chunks": [],
            }
        grouped[resource.id]["score"] = max(grouped[resource.id]["score"], score)
        grouped[resource.id]["matched_chunks"].append(chunk_to_dict(chunk, score))
    return sorted(grouped.values(), key=lambda item: item["score"], reverse=True)
