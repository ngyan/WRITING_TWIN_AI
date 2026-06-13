"use client";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const TOKEN_KEY = "wt_access_token";
export const REFRESH_KEY = "wt_refresh_token";
export const EMAIL_KEY = "wt_email";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const t = token ?? getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthenticated");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MeResponse {
  id: string;
  email: string;
  plan: string;
  is_verified: boolean;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  await request<unknown>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return login(email, password);
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/v1/auth/me");
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface UsageResponse {
  plan: string;
  today_count: number;
  monthly_count: number;
  monthly_limit: number | null;  // null = unlimited (Pro+)
}

export async function getUsage(): Promise<UsageResponse> {
  return request<UsageResponse>("/v1/billing/usage");
}

export async function createCheckout(
  price_id: string,
  success_url: string,
  cancel_url: string,
): Promise<string> {
  const data = await request<{ checkout_url: string }>("/v1/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ price_id, success_url, cancel_url }),
  });
  return data.checkout_url;
}

export async function createPortal(return_url: string): Promise<string> {
  const data = await request<{ portal_url: string }>("/v1/billing/portal", {
    method: "POST",
    body: JSON.stringify({ return_url }),
  });
  return data.portal_url;
}

// ── DNA ───────────────────────────────────────────────────────────────────────

export interface DnaProfile {
  extraction_status: string;
  version: number | null;
  sample_count: number;
  // Quantitative dimensions (populated after extraction)
  avg_sentence_length: number | null;
  formality_score: number | null;
  warmth_score: number | null;
  directness_score: number | null;
  // Qualitative (JSONB arrays)
  common_phrases: string[] | null;
  vocabulary_preferences: string[] | null;
  punctuation_habits: string[] | null;
}

export async function getDnaProfile(): Promise<DnaProfile | null> {
  try {
    return await request<DnaProfile>("/v1/dna/profile");
  } catch {
    return null;
  }
}

export interface ConsistencyScore {
  total_with_feedback: number;
  accepted: number;
  accuracy_pct: number | null;
}

export async function getConsistencyScore(): Promise<ConsistencyScore | null> {
  try {
    return await request<ConsistencyScore>("/v1/dna/consistency");
  } catch {
    return null;
  }
}

export async function submitDnaSamples(rawTexts: string[]): Promise<void> {
  const samples = rawTexts.map((body) => ({ source: "email", body }));
  await request<void>("/v1/dna/samples", {
    method: "POST",
    body: JSON.stringify({ samples }),
  });
}
