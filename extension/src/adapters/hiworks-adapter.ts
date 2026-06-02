import type { PlatformAdapter } from '../lib/compose-detector';

// HiWorks (office.hiworks.com) — Korean business web office suite.
// Selectors are best-effort based on common React SPA email patterns.
// If HiWorks updates its UI, run with DEBUG=true in hiworks.ts to
// log detected candidates and update composeHints accordingly.
export const hiworksAdapter: PlatformAdapter = {
  platform: 'hiworks',
  composeHints: [
    'div[contenteditable="true"][class*="editor"]',
    'div[contenteditable="true"][class*="body"]',
    'div[contenteditable="true"][class*="compose"]',
    'div[contenteditable="true"][class*="mail"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"].editable',
    'textarea[name*="body"]',
    'textarea[class*="body"]',
    'textarea[class*="compose"]',
  ],
  sendButtonHints: [
    // Korean send labels
    'button[aria-label*="전송"]',
    'button[aria-label*="보내기"]',
    'button[aria-label*="답장"]',
    // English fallbacks (HiWorks supports English UI)
    'button[aria-label*="send" i]',
    'button[class*="send"]',
    'button[class*="submit"]',
    '[data-action="send"]',
  ],
  minWidth: 300,
  minHeight: 80,
};
