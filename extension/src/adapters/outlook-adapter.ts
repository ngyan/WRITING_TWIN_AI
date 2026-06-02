import type { PlatformAdapter } from '../lib/compose-detector';

export const outlookAdapter: PlatformAdapter = {
  platform: 'outlook',
  composeHints: [
    // Outlook Web App — role + aria-multiline is stable across locales
    'div[role="textbox"][aria-multiline="true"]',
    'div[contenteditable="true"][aria-multiline="true"]',
  ],
  sendButtonHints: [
    'button[aria-label^="Send"]',
    'button[aria-label*=" (Ctrl+Enter)"]',
    'button[aria-label*=" (⌘+Enter)"]',
    'button[data-testid*="sendButton" i]',
  ],
  minWidth: 300,
  minHeight: 80,
};
