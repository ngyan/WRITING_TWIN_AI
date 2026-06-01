import type { Tone, RewriteResponse } from '../lib/api';

// Gmail's stable selectors (validated 2026)
const COMPOSE_BODY_SEL = '[g_editable="true"]';
const SEND_BUTTON_SEL = '[data-tooltip="Send"], [aria-label="Send"]';
const HOST_ATTR = 'data-wt-injected';

// ── Tone config ────────────────────────────────────────────────────────────────

const TONES: { key: Tone; label: string; color: string }[] = [
  { key: 'professional', label: 'Professional', color: '#4F46E5' },
  { key: 'casual',       label: 'Casual',       color: '#06B6D4' },
  { key: 'friendly',     label: 'Friendly',     color: '#F59E0B' },
  { key: 'direct',       label: 'Direct',       color: '#DC2626' },
  { key: 'diplomatic',   label: 'Diplomatic',   color: '#7C3AED' },
  { key: 'executive',    label: 'Executive',    color: '#0F172A' },
];

// ── Shadow DOM styles ──────────────────────────────────────────────────────────

const BUTTON_CSS = `
  :host { display: inline-flex; align-items: center; margin-left: 8px; }

  #wt-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 12px; border-radius: 9999px; border: none;
    background: #4F46E5; color: #fff;
    font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, box-shadow 0.15s;
  }
  #wt-btn:hover { background: #3F37C9; box-shadow: 0 0 0 3px rgba(79,70,229,0.25); }
  #wt-btn:disabled { opacity: 0.6; cursor: default; box-shadow: none; }

  #wt-panel {
    position: fixed; z-index: 9999;
    background: #fff; border: 1px solid #E8EAED; border-radius: 10px;
    box-shadow: 0 12px 32px rgba(15,23,42,0.14);
    padding: 14px 16px; width: 260px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  #wt-panel.open { display: block; }

  .wt-title {
    font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .wt-tones {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;
  }
  .wt-tone {
    padding: 4px 10px; border-radius: 9999px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151;
    cursor: pointer; transition: all 0.1s;
  }
  .wt-tone.active {
    color: #fff; border-color: transparent;
  }
  .wt-tone:hover:not(.active) { border-color: #9BA0FF; }

  #wt-rewrite {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: #4F46E5; color: #fff;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
  }
  #wt-rewrite:disabled { opacity: 0.45; cursor: default; }

  #wt-status {
    margin-top: 8px; font-size: 11px; text-align: center; min-height: 14px;
  }
  #wt-status.error { color: #EF4444; }
  #wt-status.success { color: #10B981; }

  #wt-limit {
    display: none; margin-top: 10px; padding: 10px 12px; border-radius: 8px;
    background: #FFF8F1; border: 1px solid #FED7AA; text-align: center;
  }
  #wt-limit.visible { display: block; }
  #wt-limit p { font-size: 11px; color: #92400E; margin: 0 0 8px; line-height: 1.4; }
  #wt-limit a {
    display: inline-block; padding: 5px 14px; border-radius: 9999px;
    background: #F59E0B; color: #fff; font-size: 11px; font-weight: 600;
    text-decoration: none;
  }
  #wt-limit a:hover { background: #D97706; }

  #wt-actions {
    display: none; gap: 6px; margin-top: 8px;
  }
  #wt-actions.visible { display: flex; }
  .wt-action {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151;
    cursor: pointer;
  }
  .wt-action.accept { border-color: #10B981; color: #10B981; }
  .wt-action.reject { border-color: #EF4444; color: #EF4444; }
`;

// ── Inject Humanize button into a compose window ────────────────────────────────

function inject(composeBody: Element): void {
  // Find the parent compose container (walk up to find element with Send button)
  const sendBtn = findSendButton(composeBody);
  if (!sendBtn) return;

  const toolbar = sendBtn.parentElement;
  if (!toolbar || toolbar.hasAttribute(HOST_ATTR)) return;

  toolbar.setAttribute(HOST_ATTR, '1');

  // Create shadow host
  const host = document.createElement('span');
  const shadow = host.attachShadow({ mode: 'open' });

  // State
  let selectedTone: Tone | null = null;
  let lastRewriteId: string | null = null;
  let panelOpen = false;

  shadow.innerHTML = `
    <style>${BUTTON_CSS}</style>
    <button id="wt-btn" title="Humanize with Writing Twin AI (Cmd+Shift+H)">✨ Humanize</button>
    <div id="wt-panel">
      <p class="wt-title">Rewrite tone</p>
      <div class="wt-tones">
        ${TONES.map(t => `<button class="wt-tone" data-tone="${t.key}" data-color="${t.color}">${t.label}</button>`).join('')}
      </div>
      <button id="wt-rewrite" disabled>Rewrite →</button>
      <div id="wt-status"></div>
      <div id="wt-limit">
        <p>You've used all your free rewrites this month.</p>
        <a href="https://writingtwinai.com/pricing" target="_blank" rel="noopener">Upgrade to Pro — $5/mo</a>
      </div>
      <div id="wt-actions">
        <button class="wt-action accept" id="wt-accept">✓ Keep it</button>
        <button class="wt-action reject" id="wt-reject">✗ Undo</button>
      </div>
    </div>
  `;

  const btn = shadow.getElementById('wt-btn') as HTMLButtonElement;
  const panel = shadow.getElementById('wt-panel') as HTMLDivElement;
  const rewriteBtn = shadow.getElementById('wt-rewrite') as HTMLButtonElement;
  const statusEl = shadow.getElementById('wt-status') as HTMLDivElement;
  const limitEl = shadow.getElementById('wt-limit') as HTMLDivElement;
  const actionsEl = shadow.getElementById('wt-actions') as HTMLDivElement;
  const acceptBtn = shadow.getElementById('wt-accept') as HTMLButtonElement;
  const rejectBtn = shadow.getElementById('wt-reject') as HTMLButtonElement;

  // Tone selection
  shadow.querySelectorAll<HTMLButtonElement>('.wt-tone').forEach(tonebtn => {
    tonebtn.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-tone').forEach(b => b.classList.remove('active'));
      tonebtn.classList.add('active');
      tonebtn.style.background = tonebtn.dataset.color ?? '#4F46E5';
      tonebtn.style.borderColor = tonebtn.dataset.color ?? '#4F46E5';
      selectedTone = tonebtn.dataset.tone as Tone;
      rewriteBtn.disabled = false;
      statusEl.textContent = '';
      statusEl.className = '';
      limitEl.classList.remove('visible');
      actionsEl.classList.remove('visible');
    });
  });

  // Toggle panel
  btn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) positionPanel();
  });

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!host.contains(e.target as Node) && panelOpen) {
      panelOpen = false;
      panel.classList.remove('open');
    }
  }, true);

  // Keyboard shortcut Cmd/Ctrl+Shift+H
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      btn.click();
    }
  });

  function positionPanel(): void {
    const rect = btn.getBoundingClientRect();
    panel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - 276)}px`;
  }

  let originalText = '';

  // Rewrite
  rewriteBtn.addEventListener('click', async () => {
    if (!selectedTone) return;

    const text = (composeBody as HTMLElement).innerText.trim();
    if (!text) {
      setStatus('Write something first.', 'error');
      return;
    }

    originalText = text;
    btn.disabled = true;
    rewriteBtn.disabled = true;
    setStatus('Rewriting…');
    actionsEl.classList.remove('visible');

    try {
      const resp = await sendToBackground<{ result: RewriteResponse }>({
        type: 'HUMANIZE',
        payload: { text, tone: selectedTone },
      });

      if ('error' in resp) throw new Error(String(resp.error));

      lastRewriteId = resp.result.id;
      setComposeText(composeBody as HTMLElement, resp.result.output_text);
      setStatus('Done ✓', 'success');
      actionsEl.classList.add('visible');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.startsWith('LIMIT_REACHED:')) {
        limitEl.classList.add('visible');
        setStatus('');
      } else {
        setStatus(msg, 'error');
      }
    } finally {
      btn.disabled = false;
      rewriteBtn.disabled = selectedTone === null;
    }
  });

  // Accept feedback
  acceptBtn.addEventListener('click', async () => {
    if (lastRewriteId) {
      sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'accepted' } });
    }
    actionsEl.classList.remove('visible');
    panelOpen = false;
    panel.classList.remove('open');
    setStatus('');
  });

  // Reject / undo
  rejectBtn.addEventListener('click', async () => {
    if (originalText) setComposeText(composeBody as HTMLElement, originalText);
    if (lastRewriteId) {
      sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'rejected' } });
    }
    actionsEl.classList.remove('visible');
    setStatus('Reverted.', 'success');
    setTimeout(() => setStatus(''), 2000);
  });

  function setStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg;
    statusEl.className = cls;
  }

  // Insert button before Send button in the toolbar
  toolbar.insertBefore(host, sendBtn);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function findSendButton(composeBody: Element): Element | null {
  // Walk up a few levels to find the compose container that has the Send button
  let el: Element | null = composeBody;
  for (let i = 0; i < 12; i++) {
    if (!el) break;
    const send = el.querySelector(SEND_BUTTON_SEL);
    if (send) return send;
    el = el.parentElement;
  }
  return null;
}

function setComposeText(el: HTMLElement, text: string): void {
  el.focus();
  document.execCommand('selectAll', false, undefined);
  document.execCommand('delete', false, undefined);
  // Insert line by line to preserve paragraph structure
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) document.execCommand('insertText', false, lines[i]);
    if (i < lines.length - 1) document.execCommand('insertParagraph', false, undefined);
  }
}

function sendToBackground<T>(message: object): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

// ── MutationObserver — watch for new compose windows ──────────────────────────

const seen = new WeakSet<Element>();

function tryInject(root: Element | Document): void {
  root.querySelectorAll<Element>(COMPOSE_BODY_SEL).forEach((body) => {
    if (!seen.has(body)) {
      seen.add(body);
      inject(body);
    }
  });
}

const observer = new MutationObserver(() => tryInject(document));

observer.observe(document.body, { childList: true, subtree: true });

// Handle compose windows already open on load
tryInject(document);
