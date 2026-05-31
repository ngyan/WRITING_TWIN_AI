"""Sprint 4 — Writing DNA Engine tests. Extraction task is mocked throughout."""
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

SAMPLES_PAYLOAD = {
    "samples": [
        {"source": "email", "body": "Hey team, just wanted to check in on the project status.", "sent_at": None},
        {"source": "email", "body": "Following up on our last conversation — any updates?", "sent_at": None},
    ]
}


@pytest.mark.asyncio
async def test_submit_samples_requires_auth(client: AsyncClient) -> None:
    resp = await client.post("/v1/dna/samples", json=SAMPLES_PAYLOAD)
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
@patch("app.tasks.extract_dna_task.run_extraction", new_callable=AsyncMock)
@patch("app.repositories.qdrant_repo.ensure_dna_collection", new_callable=AsyncMock)
async def test_submit_samples_returns_202(
    mock_qdrant, mock_extract, client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.post("/v1/dna/samples", json=SAMPLES_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 202
    body = resp.json()
    assert body["status"] == "accepted"
    assert body["sample_count"] == 2
    assert body["extraction_status"] == "processing"


@pytest.mark.asyncio
@patch("app.tasks.extract_dna_task.run_extraction", new_callable=AsyncMock)
@patch("app.repositories.qdrant_repo.ensure_dna_collection", new_callable=AsyncMock)
async def test_get_profile_404_before_submit(
    mock_qdrant, mock_extract, client: AsyncClient, auth_headers: dict
) -> None:
    # Fresh client — no profile submitted yet for this user
    import uuid
    unique_email = f"dna-test-{uuid.uuid4().hex[:8]}@example.com"

    await client.post(
        "/v1/auth/register",
        json={"email": unique_email, "password": "password123"},
    )
    login = await client.post(
        "/v1/auth/login",
        json={"email": unique_email, "password": "password123"},
    )
    fresh_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = await client.get("/v1/dna/profile", headers=fresh_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
@patch("app.tasks.extract_dna_task.run_extraction", new_callable=AsyncMock)
@patch("app.repositories.qdrant_repo.ensure_dna_collection", new_callable=AsyncMock)
async def test_get_profile_200_after_submit(
    mock_qdrant, mock_extract, client: AsyncClient, auth_headers: dict
) -> None:
    import uuid
    unique_email = f"dna-profile-{uuid.uuid4().hex[:8]}@example.com"

    await client.post(
        "/v1/auth/register",
        json={"email": unique_email, "password": "password123"},
    )
    login = await client.post(
        "/v1/auth/login",
        json={"email": unique_email, "password": "password123"},
    )
    fresh_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    submit = await client.post("/v1/dna/samples", json=SAMPLES_PAYLOAD, headers=fresh_headers)
    assert submit.status_code == 202

    profile = await client.get("/v1/dna/profile", headers=fresh_headers)
    assert profile.status_code == 200
    body = profile.json()
    assert body["sample_count"] == 2
    assert body["extraction_status"] in ("processing", "pending", "complete", "failed")


@pytest.mark.asyncio
@patch("app.tasks.extract_dna_task.run_extraction", new_callable=AsyncMock)
@patch("app.repositories.qdrant_repo.ensure_dna_collection", new_callable=AsyncMock)
@patch("app.repositories.qdrant_repo.delete_user_vectors", new_callable=AsyncMock)
async def test_delete_profile_204(
    mock_delete_vectors, mock_qdrant, mock_extract, client: AsyncClient, auth_headers: dict
) -> None:
    import uuid
    unique_email = f"dna-delete-{uuid.uuid4().hex[:8]}@example.com"

    await client.post(
        "/v1/auth/register",
        json={"email": unique_email, "password": "password123"},
    )
    login = await client.post(
        "/v1/auth/login",
        json={"email": unique_email, "password": "password123"},
    )
    fresh_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    await client.post("/v1/dna/samples", json=SAMPLES_PAYLOAD, headers=fresh_headers)

    delete = await client.delete("/v1/dna/profile", headers=fresh_headers)
    assert delete.status_code == 204

    # Profile should be gone
    get = await client.get("/v1/dna/profile", headers=fresh_headers)
    assert get.status_code == 404
