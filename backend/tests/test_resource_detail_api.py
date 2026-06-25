from datetime import datetime, timedelta
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import uuid

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
test_root = Path(tempfile.gettempdir()) / f"policyai_task16_{uuid.uuid4().hex}"
test_root.mkdir(parents=True, exist_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{test_root / 'test.db'}"
os.environ["UPLOAD_DIR"] = str(test_root / "uploads")

from backend.app.api.resources import resource_out
from backend.app.main import app
from backend.app.services import ingestion_service


def test_seeded_resource_detail_returns_metadata_and_ordered_chunks():
    with TestClient(app) as client:
        resources = client.get("/api/resources")
        assert resources.status_code == 200
        assert resources.json()

        resource_id = resources.json()[0]["id"]
        response = client.get(f"/api/resources/{resource_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resource_id
    for field in [
        "title",
        "summary",
        "resource_type",
        "policy_area",
        "jurisdiction",
        "sector",
        "policy_challenge",
        "stakeholder_type",
        "source",
    ]:
        assert data[field]

    chunk_indexes = [chunk["chunk_index"] for chunk in data["chunks"]]
    assert chunk_indexes == sorted(chunk_indexes)
    assert isinstance(data["documents"], list)
    if data["documents"]:
        assert all(document["resource_id"] == resource_id for document in data["documents"])
        assert "parse_status" in data["documents"][0]
        assert "parse_error" in data["documents"][0]
        assert data["documents"][0]["uploaded_at"]


def test_missing_resource_detail_returns_404():
    with TestClient(app) as client:
        response = client.get("/api/resources/not-a-real-id")

    assert response.status_code == 404
    assert response.json() == {"detail": "Resource not found"}


def test_uploaded_txt_resource_detail_includes_documents_and_chunks():
    ingestion_service.index_chunks = lambda *_args, **_kwargs: None
    with TestClient(app) as client:
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert login.status_code == 200
        token = login.json()["token"]

        upload = client.post(
            "/api/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={
                "file": (
                    "task16-detail-api.txt",
                    b"Task 16 detail API upload fixture with searchable extracted policy text.",
                    "text/plain",
                )
            },
            data={
                "title": "Task 16 Detail API Fixture",
                "policy_area": "API Verification",
                "jurisdiction": "Australia",
                "sector": "Testing",
                "policy_challenge": "Stable detail response",
                "stakeholder_type": "Developers",
                "summary": "Uploaded fixture for resource detail API verification.",
            },
        )
        assert upload.status_code == 200
        resource_id = upload.json()["id"]

        detail = client.get(f"/api/resources/{resource_id}")

    assert detail.status_code == 200
    data = detail.json()
    assert data["id"] == resource_id
    assert data["documents"]
    assert data["chunks"]
    assert all(document["resource_id"] == resource_id for document in data["documents"])
    assert all(chunk["resource_id"] == resource_id for chunk in data["chunks"])
    assert data["documents"][0]["parse_status"] == "completed"
    assert "parse_error" in data["documents"][0]
    assert data["documents"][0]["uploaded_at"]

    chunk_indexes = [chunk["chunk_index"] for chunk in data["chunks"]]
    assert chunk_indexes == sorted(chunk_indexes)


def test_resource_out_orders_documents_newest_first():
    older = datetime.utcnow() - timedelta(days=1)
    newer = datetime.utcnow()
    resource = SimpleNamespace(
        id="res_ordering",
        title="Ordering resource",
        resource_type="uploaded_document",
        policy_area="Testing",
        jurisdiction="Australia",
        sector="Backend",
        policy_challenge="Stable response",
        stakeholder_type="Developers",
        summary="Ordering test",
        source_type="upload",
        source="fixture",
        citation="Fixture citation",
        year=2026,
        tags=[],
        chunks=[
            SimpleNamespace(
                id="chunk_2",
                resource_id="res_ordering",
                document_id="doc_new",
                chunk_index=2,
                text="second",
                page_start=None,
                page_end=None,
                section_title="",
                token_count=1,
            ),
            SimpleNamespace(
                id="chunk_1",
                resource_id="res_ordering",
                document_id="doc_old",
                chunk_index=1,
                text="first",
                page_start=None,
                page_end=None,
                section_title="",
                token_count=1,
            ),
        ],
        documents=[
            SimpleNamespace(
                id="doc_old",
                resource_id="res_ordering",
                original_filename="old.txt",
                mime_type="text/plain",
                file_size=10,
                parse_status="completed",
                parse_error="",
                uploaded_at=older,
            ),
            SimpleNamespace(
                id="doc_new",
                resource_id="res_ordering",
                original_filename="new.txt",
                mime_type="text/plain",
                file_size=20,
                parse_status="completed",
                parse_error="",
                uploaded_at=newer,
            ),
        ],
        created_at=older,
        updated_at=newer,
    )

    output = resource_out(resource)

    assert [document.id for document in output.documents] == ["doc_new", "doc_old"]
    assert [chunk.chunk_index for chunk in output.chunks] == [1, 2]
