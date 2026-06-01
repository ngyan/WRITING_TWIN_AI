export const API_BASE = 'https://api.writingtwinai.com/v1';

export type Tone = 'casual' | 'professional' | 'executive' | 'friendly' | 'direct' | 'diplomatic';

export interface RewriteResponse {
  id: string;
  output_text: string;
  cache_hit: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  cost_usd: number;
  quality_score: number | null;
  context_detected: string | null;
  intent_detected: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DnaProfileResponse {
  extraction_status: string;
  version: number | null;
  sample_count: number;
}

async function request<T>(path: string, options: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` })) as { detail: string };
    if (res.status === 429) throw new Error(`LIMIT_REACHED:${err.detail}`);
    throw new Error(err.detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string): Promise<LoginResponse> {
  await request<unknown>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return login(email, password);
}

export async function submitDnaSamples(rawTexts: string[], token: string): Promise<void> {
  const samples = rawTexts.map((body) => ({ source: 'email', body }));
  await request<void>('/dna/samples', {
    method: 'POST',
    body: JSON.stringify({ samples }),
  }, token);
}

export async function getDnaProfile(token: string): Promise<DnaProfileResponse | null> {
  try {
    return await request<DnaProfileResponse>('/dna/profile', { method: 'GET' }, token);
  } catch {
    return null;
  }
}

export async function humanize(text: string, tone: Tone, token: string): Promise<RewriteResponse> {
  return request<RewriteResponse>('/humanize', {
    method: 'POST',
    body: JSON.stringify({ text, tone }),
  }, token);
}

export async function submitFeedback(
  rewriteId: string,
  action: 'accepted' | 'rejected',
  token: string,
): Promise<void> {
  await request<void>(`/humanize/${rewriteId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  }, token);
}
