import { getTokens, setTokens, clearTokens, type AuthTokens } from './lib/auth';
import {
  login, register, humanize, submitFeedback, submitDnaSamples, getDnaProfile,
  voiceDraft, submitVoiceFeedback, googleExchange,
  type Tone, type VoiceOutputType,
} from './lib/api';

const EXTENSION_REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;

type Message =
  | { type: 'LOGIN'; payload: { email: string; password: string } }
  | { type: 'REGISTER'; payload: { email: string; password: string } }
  | { type: 'LOGOUT' }
  | { type: 'GET_AUTH_STATE' }
  | { type: 'HUMANIZE'; payload: { text: string; tone: Tone } }
  | { type: 'FEEDBACK'; payload: { rewriteId: string; action: 'accepted' | 'rejected' } }
  | { type: 'SUBMIT_DNA'; payload: { samples: string[] } }
  | { type: 'GET_DNA_STATUS' }
  | { type: 'VOICE_DRAFT'; payload: { audioData: string; mimeType: string; outputType: VoiceOutputType } }
  | { type: 'VOICE_FEEDBACK'; payload: { sessionId: string; accepted: boolean; editedDraft: string | null } }
  | { type: 'GOOGLE_AUTH_EXTENSION' };

import type { DnaProfileResponse, VoiceDraftResponse } from './lib/api';

type MessageResponse =
  | { success: true; tokens?: AuthTokens; authenticated?: boolean; dnaProfile?: DnaProfileResponse | null }
  | { success: true; result: Awaited<ReturnType<typeof humanize>> }
  | { success: true; result: VoiceDraftResponse }
  | { error: string };

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (r: MessageResponse) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err: Error) => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  },
);

async function handleMessage(msg: Message): Promise<MessageResponse> {
  switch (msg.type) {
    case 'LOGIN': {
      const resp = await login(msg.payload.email, msg.payload.password);
      const tokens: AuthTokens = {
        access_token: resp.access_token,
        refresh_token: resp.refresh_token,
        email: msg.payload.email,
      };
      await setTokens(tokens);
      updateBadge(true);
      return { success: true, tokens };
    }

    case 'REGISTER': {
      const resp = await register(msg.payload.email, msg.payload.password);
      const tokens: AuthTokens = {
        access_token: resp.access_token,
        refresh_token: resp.refresh_token,
        email: msg.payload.email,
      };
      await setTokens(tokens);
      updateBadge(true);
      return { success: true, tokens };
    }

    case 'LOGOUT': {
      await clearTokens();
      updateBadge(false);
      return { success: true };
    }

    case 'GET_AUTH_STATE': {
      const tokens = await getTokens();
      return { success: true, authenticated: tokens !== null, tokens: tokens ?? undefined };
    }

    case 'HUMANIZE': {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Not logged in. Please log in via the extension popup.');
      const result = await humanize(msg.payload.text, msg.payload.tone, tokens.access_token);
      return { success: true, result };
    }

    case 'FEEDBACK': {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Not authenticated');
      await submitFeedback(msg.payload.rewriteId, msg.payload.action, tokens.access_token);
      return { success: true };
    }

    case 'SUBMIT_DNA': {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Not authenticated');
      await submitDnaSamples(msg.payload.samples, tokens.access_token);
      return { success: true };
    }

    case 'GET_DNA_STATUS': {
      const tokens = await getTokens();
      if (!tokens) return { success: true, dnaProfile: null };
      const profile = await getDnaProfile(tokens.access_token);
      return { success: true, dnaProfile: profile };
    }

    case 'VOICE_DRAFT': {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Not logged in. Please log in via the extension popup.');
      // Reconstruct Blob from base64 data URL passed from content script
      const { audioData, mimeType, outputType } = msg.payload;
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const result = await voiceDraft(blob, outputType, tokens.access_token);
      return { success: true, result };
    }

    case 'VOICE_FEEDBACK': {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Not authenticated');
      await submitVoiceFeedback(
        msg.payload.sessionId,
        msg.payload.accepted,
        msg.payload.editedDraft,
        tokens.access_token,
      );
      return { success: true };
    }

    case 'GOOGLE_AUTH_EXTENSION': {
      const redirectUri = EXTENSION_REDIRECT_URI;
      const authUrl = await buildGoogleAuthUrl(redirectUri);
      const responseUrl = await new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url: authUrl, interactive: true },
          (url) => {
            if (chrome.runtime.lastError || !url) {
              reject(new Error(chrome.runtime.lastError?.message ?? 'Auth cancelled'));
            } else {
              resolve(url);
            }
          },
        );
      });
      const code = new URL(responseUrl).searchParams.get('code');
      if (!code) throw new Error('No auth code returned from Google');
      const tokenPair = await googleExchange(code, redirectUri);
      const authTokens: AuthTokens = {
        access_token: tokenPair.access_token,
        refresh_token: tokenPair.refresh_token,
        email: '',
      };
      await setTokens(authTokens);
      updateBadge(true);
      return { success: true, tokens: authTokens };
    }

    default:
      throw new Error('Unknown message type');
  }
}

declare const __GOOGLE_CLIENT_ID__: string;

async function buildGoogleAuthUrl(redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: __GOOGLE_CLIENT_ID__,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function updateBadge(authenticated: boolean): void {
  chrome.action.setBadgeText({ text: authenticated ? '' : '' });
}

// Restore badge on startup
getTokens().then((t) => updateBadge(t !== null));
