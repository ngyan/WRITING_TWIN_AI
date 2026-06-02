// Generic compose area detection engine for Writing Twin AI.
// Used by platform-specific content scripts via PlatformAdapter hints.
// Adding a new platform = new adapter + thin content script, no detector changes.

export interface ComposeTarget {
  element: HTMLElement;
  confidence: number;
  platform?: string;
}

export interface PlatformAdapter {
  platform: string;
  /** CSS selectors tried first (highest specificity, least false-positive risk) */
  composeHints: string[];
  /** CSS selectors for send/reply/post/submit controls near the compose area */
  sendButtonHints: string[];
  /** Minimum width in px to accept a candidate. Default: 200 */
  minWidth?: number;
  /** Minimum height in px to accept a candidate. Default: 50 */
  minHeight?: number;
}

// ── Interaction tracking ───────────────────────────────────────────────────────
// Tracks which editable elements the user has recently clicked/focused so
// the detector can reward them with a higher confidence score.

const lastInteraction = new WeakMap<Element, number>();
const RECENT_MS = 30_000;

function isEditable(el: Element): boolean {
  return (
    el.tagName === 'TEXTAREA' ||
    el.getAttribute('contenteditable') === 'true' ||
    el.getAttribute('role') === 'textbox'
  );
}

document.addEventListener('click', (e) => {
  let node: Element | null = e.target as Element;
  while (node) {
    if (isEditable(node)) { lastInteraction.set(node, Date.now()); break; }
    node = node.parentElement;
  }
}, { capture: true, passive: true });

document.addEventListener('focusin', (e) => {
  if (e.target instanceof Element && isEditable(e.target)) {
    lastInteraction.set(e.target, Date.now());
  }
}, { capture: true, passive: true });

// ── Scoring helpers ────────────────────────────────────────────────────────────

const SEND_LABEL_RE = /\b(send|reply|submit|post|comment|전송|보내기|답장)\b/i;

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
}

function hasNearbySendControl(el: Element, extraHints: string[] = []): boolean {
  // Walk up up to 8 levels looking for send/reply/post/comment buttons
  let node: Element | null = el;
  for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
    const sel = ['button', '[role="button"]', 'input[type="submit"]', ...extraHints].join(', ');
    const found = Array.from(node.querySelectorAll<HTMLElement>(sel)).some(btn => {
      const label = [
        btn.textContent?.trim() ?? '',
        btn.getAttribute('aria-label') ?? '',
        btn.getAttribute('title') ?? '',
        btn.getAttribute('data-tooltip') ?? '',
      ].join(' ');
      return SEND_LABEL_RE.test(label);
    });
    if (found) return true;
  }
  return false;
}

function scoreElement(
  el: HTMLElement,
  sendHints: string[],
  minW: number,
  minH: number,
): number {
  let score = 0;
  const rect = el.getBoundingClientRect();

  // Visibility — required, so anything that reaches here already passed
  score += 2;

  // Focus state
  if (document.activeElement === el) score += 3;
  else if (el.contains(document.activeElement)) score += 1;

  // User recently interacted
  const ts = lastInteraction.get(el);
  if (ts !== undefined && Date.now() - ts < RECENT_MS) score += 3;

  // Size — reward large composition areas
  if (rect.width >= minW * 2 && rect.height >= minH * 2) score += 2;
  else if (rect.width >= minW && rect.height >= minH) score += 1;

  // Editability markers
  if (el.getAttribute('role') === 'textbox') score += 1;
  if (el.getAttribute('placeholder') || el.dataset.placeholder) score += 1;

  // Near send/reply controls
  if (hasNearbySendControl(el, sendHints)) score += 2;

  return score;
}

// ── Iframe support ────────────────────────────────────────────────────────────

function collectFromIframes(minW: number, minH: number, into: HTMLElement[]): void {
  Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe')).forEach(iframe => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const body = doc.body as HTMLElement | null;
      if (!body) return;
      // designMode = 'on' means the whole body is the editor
      if ((doc as unknown as { designMode: string }).designMode === 'on') {
        into.push(body);
        return;
      }
      Array.from(doc.querySelectorAll(BASE_SEL) as NodeListOf<HTMLElement>).forEach(el => {
        if (isVisible(el)) into.push(el);
      });
    } catch {
      // cross-origin — skip silently
    }
  });
}

// ── Core detection ────────────────────────────────────────────────────────────

const BASE_SEL = [
  'textarea',
  'div[contenteditable="true"]',
  'div[role="textbox"]',
  'div[role="textbox"][contenteditable]',
  'div[contenteditable="true"][role="combobox"]',
].join(', ');

/**
 * Returns all compose candidates, sorted by confidence (highest first).
 * Pass a PlatformAdapter to weight platform-specific selectors first.
 */
export function detectAllCompose(adapter?: PlatformAdapter): ComposeTarget[] {
  const minW = adapter?.minWidth ?? 200;
  const minH = adapter?.minHeight ?? 50;
  const sendHints = adapter?.sendButtonHints ?? [];
  const platform = adapter?.platform;

  const candidates = new Map<Element, HTMLElement>();

  // 1. Platform hint selectors — tried first, score gets a bonus
  if (adapter) {
    adapter.composeHints.forEach(sel => {
      Array.from(document.querySelectorAll<HTMLElement>(sel)).forEach(el => {
        if (isVisible(el)) candidates.set(el, el);
      });
    });
  }

  // 2. Generic selectors — fill in anything hints missed
  Array.from(document.querySelectorAll<HTMLElement>(BASE_SEL)).forEach(el => {
    if (isVisible(el)) candidates.set(el, el);
  });

  // 3. Iframe editors
  const iframeEls: HTMLElement[] = [];
  collectFromIframes(minW, minH, iframeEls);
  iframeEls.forEach(el => candidates.set(el, el));

  const results: ComposeTarget[] = [];

  Array.from(candidates.values()).forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width < minW || rect.height < minH) return;

    const isHinted = adapter?.composeHints.some(sel => el.matches(sel)) ?? false;
    const base = scoreElement(el, sendHints, minW, minH);
    const confidence = isHinted ? base + 10 : base;

    results.push({ element: el, confidence, platform });
  });

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Returns the single best compose target, or null if nothing found.
 */
export function detectCompose(adapter?: PlatformAdapter): ComposeTarget | null {
  const all = detectAllCompose(adapter);
  return all.length > 0 ? all[0] : null;
}
