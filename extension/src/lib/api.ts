import { getTokens, setTokens } from './auth';

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

export type VoiceOutputType =
  | 'email'
  | 'reply'
  | 'customer_update'
  | 'jira_ticket'
  | 'technical_report'
  | 'linkedin_comment'
  | 'reddit_reply';

export interface VoiceDraftResponse {
  id: string;
  transcript: string | null;
  draft: string;
  output_type: string;
  provider: string;
  model: string;
  latency_ms: number;
  cost_usd: number;
}

async function rawFetch(path: string, options: RequestInit, token?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function rawFetchMultipart(
  path: string,
  body: FormData,
  token: string,
): Promise<Response> {
  // Do NOT set Content-Type — browser sets it with the correct multipart boundary
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function tryRefresh(): Promise<string | null> {
  const stored = await getTokens();
  if (!stored?.refresh_token) return null;
  try {
    const res = await rawFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: stored.refresh_token }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token: string; refresh_token: string };
    await setTokens({ ...stored, access_token: data.access_token, refresh_token: data.refresh_token });
    return data.access_token;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit, token?: string): Promise<T> {
  let res = await rawFetch(path, options, token);

  // Auto-refresh on 401 then retry once
  if (res.status === 401 && token) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await rawFetch(path, options, newToken);
    }
  }

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

export interface HumanizeContext {
  platform?: string;
  recipient_domain?: string;
  thread_subject?: string;
  context_twin_override?: string;
}

export interface ContextDetectResponse {
  context_twin: string;
  tone_guidance: string;
}

export async function humanize(
  text: string,
  tone: Tone,
  token: string,
  ctx?: HumanizeContext,
): Promise<RewriteResponse> {
  return request<RewriteResponse>('/humanize', {
    method: 'POST',
    body: JSON.stringify({ text, tone, ...ctx }),
  }, token);
}

export async function detectContext(
  platform: string,
  recipientDomain: string | null,
  threadSubject: string | null,
  token: string,
): Promise<ContextDetectResponse> {
  return request<ContextDetectResponse>('/context/detect', {
    method: 'POST',
    body: JSON.stringify({
      platform,
      recipient_domain: recipientDomain,
      thread_subject: threadSubject,
    }),
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

export async function voiceDraft(
  audioBlob: Blob,
  outputType: VoiceOutputType,
  token: string,
): Promise<VoiceDraftResponse> {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  form.append('output_type', outputType);

  let res = await rawFetchMultipart('/voice/draft', form, token);

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      const form2 = new FormData();
      form2.append('audio', audioBlob, 'recording.webm');
      form2.append('output_type', outputType);
      res = await rawFetchMultipart('/voice/draft', form2, newToken);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` })) as { detail: string };
    if (res.status === 429) throw new Error(`LIMIT_REACHED:${err.detail}`);
    throw new Error(err.detail);
  }
  return res.json() as Promise<VoiceDraftResponse>;
}

export async function recordContextOverride(
  detectedContext: string,
  selectedContext: string,
  platform: string | undefined,
  recipientDomain: string | undefined,
  token: string,
): Promise<void> {
  await request<void>('/context/override', {
    method: 'POST',
    body: JSON.stringify({
      detected_context: detectedContext,
      selected_context: selectedContext,
      platform,
      recipient_domain: recipientDomain,
    }),
  }, token);
}

export async function submitVoiceFeedback(
  sessionId: string,
  accepted: boolean,
  editedDraft: string | null,
  token: string,
): Promise<void> {
  await request<void>(`/voice/draft/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ accepted, edited_draft: editedDraft }),
  }, token);
}
