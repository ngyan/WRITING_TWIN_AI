import type { PlatformAdapter } from '../lib/compose-detector';

export const gmailAdapter: PlatformAdapter = {
  platform: 'gmail',
  composeHints: [
    // Gmail compose body — role + aria-label is the most stable selector
    'div[aria-label="Message Body"][role="textbox"]',
    'div[contenteditable="true"].Am.Al.editable',
    // Reply box
    'div[contenteditable="true"][aria-label*="Reply"]',
    'div[contenteditable="true"][aria-label*="message"]',
  ],
  sendButtonHints: [
    'div[data-tooltip="Send"]',
    'div[data-tooltip*="Send ⌘"]',
    'div[aria-label*="Send"]',
    '[data-tooltip^="Send"]',
  ],
  minWidth: 300,
  minHeight: 80,
};
