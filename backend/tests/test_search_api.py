import os
from pathlib import Path
import sys
import tempfile
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
test_root = Path(tempfile.gettempdir()) / f"policyai_task18_{uuid.uuid4().hex}"
test_root.mkdir(parents=True, exist_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{test_root / 'test.db'}"
os.environ["UPLOAD_DIR"] = str(test_root / "uploads")

from backend.app.main import app
from backend.app.services import ingestion_service, retrieval_service


@pytest.fixture(autouse=True)
def disable_external_indexing(monkeypatch):
    monkeypatch.setattr(ingestion_service, "index_chunks", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(retrieval_service, "embed_texts", lambda texts: [[0.1, 0.2, 0.3] for _text in texts])

    def unavailable_collection():
        raise RuntimeError("Chroma unavailable during isolated search tests")

    monkeypatch.setattr(retrieval_service, "get_collection", unavailable_collection)


def post_search(client: TestClient, query: str, filters: dict | None = None, top_k: int = 5):
    return client.post("/api/search", json={"query": query, "filters": filters or {}, "top_k": top_k})


def test_seeded_keyword_search_returns_ranked_results():
    with TestClient(app) as client:
        response = post_search(client, "Renewable Energy Zone")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Renewable Energy Zone"
    assert data["results"]
    first = data["results"][0]
    assert first["resource_id"] == "rez-nsw-2024"
    assert first["score"] >= 0
    assert first["matched_chunks"]
    assert data["resources"]


def test_filtered_search_keeps_results_inside_filter():
    with TestClient(app) as client:
        response = post_search(client, "planning", {"policy_area": "Urban planning"})

    assert response.status_code == 200
    results = response.json()["results"]
    assert results
    assert all(result["policy_area"] == "Urban planning" for result in results)


def test_uploaded_txt_phrase_search_returns_resource_and_chunk():
    unique_phrase = "task eighteen unique phrase for uploaded policy evidence"
    with TestClient(app) as client:
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert login.status_code == 200
        token = login.json()["token"]

        upload = client.post(
            "/api/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("task18-search.txt", unique_phrase.encode("utf-8"), "text/plain")},
            data={
                "title": "Task 18 Search Fixture",
                "policy_area": "Search Verification",
                "jurisdiction": "Australia",
                "sector": "Testing",
                "policy_challenge": "Uploaded chunk retrieval",
                "stakeholder_type": "Developers",
                "summary": "Uploaded fixture for keyword search verification.",
            },
        )
        assert upload.status_code == 200
        resource_id = upload.json()["id"]

        search = post_search(client, unique_phrase)

    assert search.status_code == 200
    matching = [result for result in search.json()["results"] if result["resource_id"] == resource_id]
    assert matching
    assert any(unique_phrase in chunk["text"] for chunk in matching[0]["matched_chunks"])


def test_no_match_search_returns_safe_response():
    with TestClient(app) as client:
        response = post_search(client, "zzzzzzzz no direct policy match expected")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "zzzzzzzz no direct policy match expected"
    assert isinstance(data["results"], list)
    assert all(result["score"] >= 0 for result in data["results"])


def test_search_validation_rejects_invalid_top_k():
    with TestClient(app) as client:
        response = client.post("/api/search", json={"query": "energy", "filters": {}, "top_k": 0})

    assert response.status_code == 422
