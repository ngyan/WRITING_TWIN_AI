import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.writingtwinai.com/v1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/dna/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: body.text }),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
