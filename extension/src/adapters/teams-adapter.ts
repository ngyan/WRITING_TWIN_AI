import type { PlatformAdapter } from '../lib/compose-detector';

// Microsoft Teams uses a custom Quill-like contenteditable for message compose.
// The Teams web app (teams.microsoft.com / teams.live.com) and desktop app share the same DOM.
export const teamsAdapter: PlatformAdapter = {
  platform: 'teams',
  composeHints: [
    // Teams message input — stable across versions
    'div[contenteditable="true"][role="textbox"][aria-label*="message" i]',
    'div[contenteditable="true"][role="textbox"][aria-label*="Type a message"]',
    'div[contenteditable="true"][class*="ql-editor"]',
    // New Teams
    'div[data-tid="ckeditor"][contenteditable="true"]',
    'div[contenteditable="true"][aria-label*="New message"]',
    // Chat compose
    'div[class*="wysiwygWrapper"] [contenteditable="true"]',
  ],
  sendButtonHints: [
    'button[aria-label*="Send"]',
    'div[title*="Send"]',
    'button[data-tid*="send"]',
    '[aria-label="Send message"]',
  ],
  minWidth: 200,
  minHeight: 40,
};
