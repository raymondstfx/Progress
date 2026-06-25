from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, index=True)
    resource_type: Mapped[str] = mapped_column(String, index=True)
    policy_area: Mapped[str] = mapped_column(String, index=True, default="")
    jurisdiction: Mapped[str] = mapped_column(String, index=True, default="")
    sector: Mapped[str] = mapped_column(String, default="")
    policy_challenge: Mapped[str] = mapped_column(String, index=True, default="")
    stakeholder_type: Mapped[str] = mapped_column(String, default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    source_type: Mapped[str] = mapped_column(String, default="")
    source: Mapped[str] = mapped_column(String, default="")
    citation: Mapped[str] = mapped_column(Text, default="")
    year: Mapped[int] = mapped_column(Integer, default=datetime.utcnow().year)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    documents: Mapped[list["Document"]] = relationship(back_populates="resource", cascade="all, delete-orphan")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="resource", cascade="all, delete-orphan")
    tags: Mapped[list["ResourceTag"]] = relationship(back_populates="resource", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_id: Mapped[str] = mapped_column(String, ForeignKey("resources.id", ondelete="CASCADE"), index=True)
    original_filename: Mapped[str] = mapped_column(String)
    stored_filename: Mapped[str] = mapped_column(String)
    file_path: Mapped[str] = mapped_column(String)
    mime_type: Mapped[str] = mapped_column(String, default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    parse_status: Mapped[str] = mapped_column(String, default="pending", index=True)
    parse_error: Mapped[str] = mapped_column(Text, default="")
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    uploaded_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resource: Mapped["Resource"] = relationship(back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_id: Mapped[str] = mapped_column(String, ForeignKey("resources.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[str | None] = mapped_column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    page_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_title: Mapped[str] = mapped_column(String, default="")
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resource: Mapped["Resource"] = relationship(back_populates="chunks")
    document: Mapped["Document"] = relationship(back_populates="chunks")
    embedding: Mapped["ChunkEmbedding"] = relationship(back_populates="chunk", cascade="all, delete-orphan", uselist=False)


class ChunkEmbedding(Base):
    __tablename__ = "chunk_embeddings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    chunk_id: Mapped[str] = mapped_column(String, ForeignKey("chunks.id", ondelete="CASCADE"), unique=True)
    vector_store_id: Mapped[str] = mapped_column(String, index=True)
    embedding_model: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    chunk: Mapped["Chunk"] = relationship(back_populates="embedding")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String, index=True)
    __table_args__ = (UniqueConstraint("name", "category"),)


class ResourceTag(Base):
    __tablename__ = "resource_tags"

    resource_id: Mapped[str] = mapped_column(String, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[str] = mapped_column(String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    resource: Mapped["Resource"] = relationship(back_populates="tags")
    tag: Mapped["Tag"] = relationship()


class SynthesisRecord(Base):
    __tablename__ = "synthesis_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    query: Mapped[str] = mapped_column(Text)
    filters_json: Mapped[str] = mapped_column(Text, default="{}")
    retrieved_chunk_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    generated_answer_json: Mapped[str] = mapped_column(Text, default="{}")
    model_name: Mapped[str] = mapped_column(String, default="")
    retrieval_method: Mapped[str] = mapped_column(String, default="hybrid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    synthesis_id: Mapped[str] = mapped_column(String, ForeignKey("synthesis_records.id", ondelete="CASCADE"), index=True)
    chunk_id: Mapped[str] = mapped_column(String, ForeignKey("chunks.id", ondelete="CASCADE"), index=True)
    citation_label: Mapped[str] = mapped_column(String)
    claim_text: Mapped[str] = mapped_column(Text, default="")
    supporting_text: Mapped[str] = mapped_column(Text, default="")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
