import { getTokens, setTokens, clearTokens, type AuthTokens } from './lib/auth';
import { login, register, humanize, submitFeedback, submitDnaSamples, getDnaProfile, type Tone } from './lib/api';

type Message =
  | { type: 'LOGIN'; payload: { email: string; password: string } }
  | { type: 'REGISTER'; payload: { email: string; password: string } }
  | { type: 'LOGOUT' }
  | { type: 'GET_AUTH_STATE' }
  | { type: 'HUMANIZE'; payload: { text: string; tone: Tone } }
  | { type: 'FEEDBACK'; payload: { rewriteId: string; action: 'accepted' | 'rejected' } }
  | { type: 'SUBMIT_DNA'; payload: { samples: string[] } }
  | { type: 'GET_DNA_STATUS' };

import type { DnaProfileResponse } from './lib/api';

type MessageResponse =
  | { success: true; tokens?: AuthTokens; authenticated?: boolean; dnaProfile?: DnaProfileResponse | null }
  | { success: true; result: Awaited<ReturnType<typeof humanize>> }
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

    default:
      throw new Error('Unknown message type');
  }
}

function updateBadge(authenticated: boolean): void {
  chrome.action.setBadgeText({ text: authenticated ? '' : '' });
}

// Restore badge on startup
getTokens().then((t) => updateBadge(t !== null));
