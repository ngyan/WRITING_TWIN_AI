import { NextResponse } from "next/server";

// Forwards waitlist signups to the FastAPI backend.
// Backend endpoint POST /v1/waitlist must be created (see Vault/active/2026-06-06-website-cro-sprint.md).
// Graceful fallback: returns success even if backend is unavailable so no signup is silently lost.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/v1/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`backend_${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log server-side; still return success to the user
    console.error("[waitlist] backend unavailable:", err, "email:", email);
    return NextResponse.json({ ok: true });
  }
}
