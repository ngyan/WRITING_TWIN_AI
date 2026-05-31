import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_creates_user_and_returns_token_pair(client: AsyncClient):
    resp = await client.post(
        "/v1/auth/register",
        json={"email": "new@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_with_correct_password_succeeds(client: AsyncClient):
    await client.post(
        "/v1/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_with_wrong_password_fails_with_401(client: AsyncClient):
    await client.post(
        "/v1/auth/register",
        json={"email": "wrong@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/v1/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_with_valid_token_returns_new_access_token(client: AsyncClient):
    reg = await client.post(
        "/v1/auth/register",
        json={"email": "refresh@example.com", "password": "password123"},
    )
    refresh_token = reg.json()["refresh_token"]
    resp = await client.post("/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_me_endpoint_returns_authenticated_user(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "fixture@example.com"


@pytest.mark.asyncio
async def test_me_endpoint_without_token_returns_401(client: AsyncClient):
    resp = await client.get("/v1/auth/me")
    assert resp.status_code in (401, 403)
