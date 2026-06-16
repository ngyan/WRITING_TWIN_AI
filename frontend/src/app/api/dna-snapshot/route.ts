import { NextRequest, NextResponse } from "next/server";

// Matches the rest of the app: NEXT_PUBLIC_API_URL is the host WITHOUT /v1,
// and each call appends the /v1/... path itself.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.writingtwinai.com";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_BASE}/v1/dna/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body.text }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      // FastAPI returns { detail }, but the component reads { error } — bridge them
      const detail = (data as { detail?: string }).detail;
      return NextResponse.json(
        { error: detail ?? "Analysis failed. Please try again." },
        { status: upstream.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the analysis service. Please try again." },
      { status: 502 },
    );
  }
}
