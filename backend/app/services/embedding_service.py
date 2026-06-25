import hashlib
import math
import uuid

import chromadb
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.db.models import Chunk, ChunkEmbedding, Resource

_model = None


def get_model():
    global _model
    if _model is not None:
        return _model
    if not get_settings().enable_local_embeddings:
        _model = False
        return _model
    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(get_settings().embedding_model)
    except Exception:
        _model = False
    return _model


def fallback_embedding(text: str, dimensions: int = 384) -> list[float]:
    values = [0.0] * dimensions
    for token in text.lower().split():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], "big") % dimensions
        values[index] += 1.0
    norm = math.sqrt(sum(value * value for value in values)) or 1.0
    return [value / norm for value in values]


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_model()
    if model:
        return [list(map(float, vector)) for vector in model.encode(texts, normalize_embeddings=True)]
    return [fallback_embedding(text) for text in texts]


def get_collection():
    settings = get_settings()
    client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
    return client.get_or_create_collection(settings.chroma_collection)


def index_chunks(db: Session, resource_id: str | None = None) -> None:
    query = db.query(Chunk)
    if resource_id:
        query = query.filter(Chunk.resource_id == resource_id)
    chunks = query.all()
    if not chunks:
        return
    collection = get_collection()
    embeddings = embed_texts([chunk.text for chunk in chunks])
    ids = [chunk.id for chunk in chunks]
    metadatas = []
    documents = []
    for chunk in chunks:
        resource = db.get(Resource, chunk.resource_id)
        documents.append(chunk.text)
        metadatas.append(
            {
                "chunk_id": chunk.id,
                "resource_id": chunk.resource_id,
                "document_id": chunk.document_id or "",
                "title": resource.title if resource else "",
                "policy_area": resource.policy_area if resource else "",
                "jurisdiction": resource.jurisdiction if resource else "",
                "sector": resource.sector if resource else "",
                "policy_challenge": resource.policy_challenge if resource else "",
                "page_start": chunk.page_start or 0,
                "page_end": chunk.page_end or 0,
            }
        )
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)
    for chunk in chunks:
        existing = db.query(ChunkEmbedding).filter(ChunkEmbedding.chunk_id == chunk.id).one_or_none()
        if existing:
            existing.vector_store_id = chunk.id
            existing.embedding_model = get_settings().embedding_model
        else:
            db.add(
                ChunkEmbedding(
                    id=f"emb_{uuid.uuid4().hex}",
                    chunk_id=chunk.id,
                    vector_store_id=chunk.id,
                    embedding_model=get_settings().embedding_model,
                )
            )
    db.commit()


def delete_vectors(chunk_ids: list[str]) -> None:
    if not chunk_ids:
        return
    try:
        get_collection().delete(ids=chunk_ids)
    except Exception:
        pass
