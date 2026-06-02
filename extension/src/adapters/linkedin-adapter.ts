import type { PlatformAdapter } from '../lib/compose-detector';

export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',
  composeHints: [
    // LinkedIn uses Quill throughout — post compose, comment boxes, message compose
    'div.ql-editor[contenteditable="true"]',
    // Message overlay
    'div[contenteditable="true"][data-artdeco-is-focused]',
  ],
  sendButtonHints: [
    'button.msg-form__send-button',
    'button[aria-label*="Send"]',
    'button[class*="send"]',
  ],
  minWidth: 200,
  minHeight: 50,
};
