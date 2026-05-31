const STORAGE_KEY = 'wt_auth';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  email: string;
}

export async function getTokens(): Promise<AuthTokens | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as AuthTokens) ?? null;
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: tokens });
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getTokens()) !== null;
}
