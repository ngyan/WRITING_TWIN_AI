import type { PlatformAdapter } from '../lib/compose-detector';

// Slack uses Lexical (new) or Quill (legacy) for message compose.
// Both are contenteditable-based. Selectors verified against Slack web (2025).
export const slackAdapter: PlatformAdapter = {
  platform: 'slack',
  composeHints: [
    // Lexical editor (current Slack)
    'div[data-lexical-editor="true"]',
    // DM and channel message boxes
    'div[contenteditable="true"][role="textbox"][aria-label*="message" i]',
    'div[contenteditable="true"][role="textbox"][aria-label*="Message" ]',
    // Legacy Quill
    'div.ql-editor[contenteditable="true"]',
    // Canvas / huddle / Slack AI prompt
    'div[contenteditable="true"][data-qa*="message"]',
    'div[contenteditable="true"][data-qa="message_input"]',
  ],
  sendButtonHints: [
    'button[data-qa="texty_send_button"]',
    'button[aria-label*="Send"]',
    'button[type="submit"][aria-label]',
  ],
  minWidth: 200,
  minHeight: 40,
};
