// All calls go through Next.js API routes (/api/*) — backend URL stays server-side.

export interface RewriteRequest {
  samples: string[];
  draft: string;
  session_id: string;
}

export interface RewriteResponse {
  session_id: string;
  generic: string;
  personalized: string;
  option_order: ["generic", "personalized"] | ["personalized", "generic"];
}

export interface FeedbackRequest {
  session_id: string;
  chosen_option: "option1" | "option2" | "nodiff";
  option_order: string[];
  would_send: boolean;
  confidence?: number;
  comment?: string;
  email?: string;
  role?: string;
  payment_intent?: string;
}

export async function rewrite(req: RewriteRequest): Promise<RewriteResponse> {
  const res = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: { msg?: string }) => e.msg ?? JSON.stringify(e)).join("; ")
      : err.detail;
    throw new Error(detail || "Rewrite failed");
  }
  return res.json();
}

export async function submitFeedback(req: FeedbackRequest): Promise<void> {
  await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  }).catch(() => undefined); // non-blocking
}
