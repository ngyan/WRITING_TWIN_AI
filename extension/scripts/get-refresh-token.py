#!/usr/bin/env python3
"""One-shot Chrome Web Store refresh-token generator.

Reads WEBSTORE_CLIENT_ID / WEBSTORE_CLIENT_SECRET from extension/.env.publish,
runs the OAuth loopback flow (opens your browser → you click "Allow"), then
writes WEBSTORE_REFRESH_TOKEN back into extension/.env.publish.

Usage:
    python3 extension/scripts/get-refresh-token.py
"""
from __future__ import annotations

import http.server
import secrets
import socket
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

SCOPE = "https://www.googleapis.com/auth/chromewebstore"
AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URI = "https://oauth2.googleapis.com/token"

ENV_PATH = Path(__file__).resolve().parents[1] / ".env.publish"


def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        sys.exit(f"✗ {path} not found. Run the Cloud Console setup first.")
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def write_refresh_token(path: Path, token: str) -> None:
    lines = path.read_text().splitlines()
    out, replaced = [], False
    for line in lines:
        if line.startswith("WEBSTORE_REFRESH_TOKEN="):
            out.append(f"WEBSTORE_REFRESH_TOKEN={token}")
            replaced = True
        else:
            out.append(line)
    if not replaced:
        out.append(f"WEBSTORE_REFRESH_TOKEN={token}")
    path.write_text("\n".join(out) + "\n")
    path.chmod(0o600)


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    env = load_env(ENV_PATH)
    client_id = env.get("WEBSTORE_CLIENT_ID")
    client_secret = env.get("WEBSTORE_CLIENT_SECRET")
    if not client_id or not client_secret:
        sys.exit("✗ WEBSTORE_CLIENT_ID / WEBSTORE_CLIENT_SECRET missing in .env.publish")

    port = free_port()
    redirect_uri = f"http://127.0.0.1:{port}"
    state = secrets.token_urlsafe(16)
    captured: dict[str, str] = {}
    done = threading.Event()

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            captured["code"] = (params.get("code") or [""])[0]
            captured["state"] = (params.get("state") or [""])[0]
            captured["error"] = (params.get("error") or [""])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            msg = "Authorization received — you can close this tab and return to the terminal."
            if captured["error"]:
                msg = f"Authorization failed: {captured['error']}"
            self.wfile.write(f"<html><body style='font:16px sans-serif;padding:40px'>{msg}</body></html>".encode())
            done.set()

        def log_message(self, *args: object) -> None:  # silence
            pass

    server = http.server.HTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    auth_url = AUTH_URI + "?" + urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    })

    print("\nOpening your browser to authorize…")
    print("If it doesn't open, paste this URL into your browser:\n")
    print(auth_url + "\n")
    webbrowser.open(auth_url)

    if not done.wait(timeout=300):
        sys.exit("✗ Timed out waiting for authorization (5 min).")
    server.shutdown()

    if captured.get("error"):
        sys.exit(f"✗ Authorization error: {captured['error']}")
    if captured.get("state") != state:
        sys.exit("✗ State mismatch — aborting for safety.")
    code = captured.get("code")
    if not code:
        sys.exit("✗ No authorization code returned.")

    data = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode()
    with urllib.request.urlopen(urllib.request.Request(TOKEN_URI, data=data)) as resp:
        import json
        tok = json.loads(resp.read())

    refresh = tok.get("refresh_token")
    if not refresh:
        sys.exit("✗ No refresh_token in response. Re-run (ensure prompt=consent).")

    write_refresh_token(ENV_PATH, refresh)
    print("✓ Refresh token saved to extension/.env.publish")
    print("\nNext: ./Vault/deploy/deploy.sh publish")


if __name__ == "__main__":
    main()
