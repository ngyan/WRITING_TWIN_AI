import type { PlatformAdapter } from '../lib/compose-detector';

export const redditAdapter: PlatformAdapter = {
  platform: 'reddit',
  composeHints: [
    // Old Reddit — plain textarea
    'textarea[name="text"]',
    'textarea.usertext-edit textarea',
    // New Reddit — Slate/Draft.js contenteditable
    'div[contenteditable="true"][data-testid]',
    'div.DraftEditor-editorContainer [contenteditable="true"]',
    '.editor-container [contenteditable="true"]',
  ],
  sendButtonHints: [
    'button[type="submit"]',
    'button.submit',
    'button[class*="save"]',
    'button[aria-label*="post" i]',
    'button[aria-label*="comment" i]',
  ],
  minWidth: 200,
  minHeight: 50,
};
