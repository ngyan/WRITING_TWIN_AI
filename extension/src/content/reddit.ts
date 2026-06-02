import type { Tone, RewriteResponse, VoiceOutputType, VoiceDraftResponse } from '../lib/api';

// Old Reddit: plain textarea; New Reddit: Slate-based contenteditable
const OLD_REDDIT_SEL = 'textarea[name="text"], textarea.usertext-edit textarea';
const NEW_REDDIT_SEL = 'div[contenteditable="true"][data-testid], div.DraftEditor-editorContainer [contenteditable="true"], .editor-container [contenteditable="true"]';
const COMPOSE_SEL = `${OLD_REDDIT_SEL}, ${NEW_REDDIT_SEL}`;
const HOST_ATTR = 'data-wt-rd-injected';

// Reddit is Community context by default
const FIXED_CONTEXT_OVERRIDE = 'community';

const TONES: { key: Tone; label: string; color: string }[] = [
  { key: 'casual',       label: 'Casual',       color: '#FF4500' },
  { key: 'professional', label: 'Professional', color: '#0A66C2' },
  { key: 'friendly',     label: 'Friendly',     color: '#F59E0B' },
  { key: 'direct',       label: 'Direct',       color: '#DC2626' },
  { key: 'executive',    label: 'Executive',    color: '#0F172A' },
];

const VOICE_OUTPUT_TYPES: { key: VoiceOutputType; label: string }[] = [
  { key: 'reply',  label: 'Reply' },
  { key: 'email',  label: 'Message' },
];

// ── Shadow DOM styles ──────────────────────────────────────────────────────────

const BUTTON_CSS = `
  :host { display: inline-flex; align-items: center; }

  #wt-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 12px; border-radius: 9999px; border: none;
    background: #FF4500; color: #fff;
    font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, box-shadow 0.15s;
  }
  #wt-btn:hover { background: #cc3700; box-shadow: 0 0 0 3px rgba(255,69,0,0.25); }
  #wt-btn:disabled { opacity: 0.6; cursor: default; box-shadow: none; }

  #wt-panel {
    position: fixed; z-index: 99999;
    background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.14);
    padding: 14px 16px; width: 260px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  #wt-panel.open { display: block; }

  .wt-title { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase; }
  .wt-tones { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .wt-tone {
    padding: 4px 10px; border-radius: 9999px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151;
    cursor: pointer; transition: all 0.1s;
  }
  .wt-tone.active { color: #fff; border-color: transparent; }
  .wt-tone:hover:not(.active) { border-color: #FCA5A5; }

  #wt-rewrite {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: #FF4500; color: #fff;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
  }
  #wt-rewrite:disabled { opacity: 0.45; cursor: default; }

  #wt-status { margin-top: 8px; font-size: 11px; text-align: center; min-height: 14px; }
  #wt-status.error { color: #EF4444; }
  #wt-status.success { color: #10B981; }

  #wt-actions { display: none; gap: 6px; margin-top: 8px; }
  #wt-actions.visible { display: flex; }
  .wt-action {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151;
    cursor: pointer;
  }
  .wt-action.accept { border-color: #10B981; color: #10B981; }
  .wt-action.reject { border-color: #EF4444; color: #EF4444; }

  #wt-limit { display: none; margin-top: 10px; padding: 10px 12px; border-radius: 8px;
    background: #FFF8F1; border: 1px solid #FED7AA; text-align: center; }
  #wt-limit.visible { display: block; }
  #wt-limit p { font-size: 11px; color: #92400E; margin: 0 0 8px; line-height: 1.4; }
  #wt-limit a {
    display: inline-block; padding: 5px 14px; border-radius: 9999px;
    background: #F59E0B; color: #fff; font-size: 11px; font-weight: 600;
    text-decoration: none;
  }
`;

const MIC_CSS = `
  :host { display: inline-flex; align-items: center; margin-left: 4px; }

  #wt-mic-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 9999px; border: none;
    background: transparent; color: #666; cursor: pointer;
    transition: background 0.15s, color 0.15s; font-size: 15px; line-height: 1;
  }
  #wt-mic-btn:hover { background: rgba(0,0,0,0.07); }
  #wt-mic-btn.recording { background: #FEE2E2; color: #DC2626;
    animation: wt-pulse 1.2s ease-in-out infinite; }
  @keyframes wt-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
  }
  #wt-mic-btn:disabled { opacity: 0.5; cursor: default; }

  #wt-voice-panel {
    position: fixed; z-index: 99999;
    background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.14);
    padding: 14px 16px; width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  #wt-voice-panel.open { display: block; }

  .wt-vt { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase; }
  #wt-record-btn {
    width: 100%; height: 34px; border-radius: 8px; border: none;
    background: #DC2626; color: #fff; cursor: pointer;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin-bottom: 10px;
  }
  #wt-record-btn.recording { background: #7F1D1D; }
  #wt-record-btn:disabled { opacity: 0.5; cursor: default; }
  .wt-otype-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; }
  .wt-otypes { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .wt-otype {
    padding: 3px 9px; border-radius: 9999px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 11px; color: #374151; cursor: pointer;
    transition: all 0.1s;
  }
  .wt-otype.active { background: #FF4500; color: #fff; border-color: #FF4500; }
  #wt-voice-status { font-size: 11px; text-align: center; min-height: 14px; color: #6B7280; }
  #wt-voice-status.error { color: #EF4444; }
  #wt-voice-actions { display: none; gap: 6px; margin-top: 8px; }
  #wt-voice-actions.visible { display: flex; }
  .wt-va {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151; cursor: pointer;
  }
  .wt-va.accept { border-color: #10B981; color: #10B981; }
  .wt-va.reject { border-color: #EF4444; color: #EF4444; }
`;

// ── Module-level panel manager (single delegated click listener) ──────────────

let openPanel: { host: Element; close: () => void } | null = null;

document.addEventListener('click', (e) => {
  if (openPanel && !openPanel.host.contains(e.target as Node)) {
    openPanel.close();
    openPanel = null;
  }
}, true);

function openPanelFor(host: Element, close: () => void): void {
  if (openPanel && openPanel.host !== host) openPanel.close();
  openPanel = { host, close };
}

function clearOpenPanel(host: Element): void {
  if (openPanel?.host === host) openPanel = null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sendToBackground<T>(message: object): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

function isTextarea(el: Element): el is HTMLTextAreaElement {
  return el.tagName === 'TEXTAREA';
}

function getComposeText(el: Element): string {
  if (isTextarea(el)) return (el as HTMLTextAreaElement).value.trim();
  return (el as HTMLElement).innerText.trim();
}

function setComposeText(el: Element, text: string): void {
  if (isTextarea(el)) {
    const ta = el as HTMLTextAreaElement;
    ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // New Reddit uses Slate/Draft.js — execCommand works best
    (el as HTMLElement).focus();
    document.execCommand('selectAll', false, undefined);
    document.execCommand('delete', false, undefined);
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) document.execCommand('insertText', false, lines[i]);
      if (i < lines.length - 1) document.execCommand('insertParagraph', false, undefined);
    }
  }
}

// ── Mic button (Voice Twin) ────────────────────────────────────────────────────

function injectMicButton(container: Element, composeBody: Element): void {
  const micHost = document.createElement('span');
  micHost.style.cssText = 'display:inline-flex;align-items:center;margin-left:4px;';
  const shadow = micHost.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>${MIC_CSS}</style>
    <button id="wt-mic-btn" title="Voice Twin">🎙</button>
    <div id="wt-voice-panel">
      <p class="wt-vt">Voice Twin</p>
      <div class="wt-otype-label">Output type</div>
      <div class="wt-otypes">
        ${VOICE_OUTPUT_TYPES.map((o, i) =>
          `<button class="wt-otype${i === 0 ? ' active' : ''}" data-type="${o.key}">${o.label}</button>`
        ).join('')}
      </div>
      <button id="wt-record-btn">🎙 Start recording</button>
      <div id="wt-voice-status"></div>
      <div id="wt-voice-actions">
        <button class="wt-va accept" id="wt-va-keep">✓ Keep it</button>
        <button class="wt-va reject" id="wt-va-undo">✗ Undo</button>
      </div>
    </div>
  `;

  const micBtn    = shadow.getElementById('wt-mic-btn') as HTMLButtonElement;
  const panel     = shadow.getElementById('wt-voice-panel') as HTMLDivElement;
  const recordBtn = shadow.getElementById('wt-record-btn') as HTMLButtonElement;
  const statusEl  = shadow.getElementById('wt-voice-status') as HTMLDivElement;
  const actionsEl = shadow.getElementById('wt-voice-actions') as HTMLDivElement;
  const keepBtn   = shadow.getElementById('wt-va-keep') as HTMLButtonElement;
  const undoBtn   = shadow.getElementById('wt-va-undo') as HTMLButtonElement;

  let panelOpen = false;
  let selectedType: VoiceOutputType = VOICE_OUTPUT_TYPES[0].key;
  let recorder: MediaRecorder | null = null;
  let recording = false;
  let chunks: BlobPart[] = [];
  let lastSessionId: string | null = null;
  let originalText = '';

  shadow.querySelectorAll<HTMLButtonElement>('.wt-otype').forEach(btn => {
    btn.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-otype').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type as VoiceOutputType;
    });
  });

  micBtn.addEventListener('click', () => {
    if (panelOpen) {
      panelOpen = false;
      panel.classList.remove('open');
      clearOpenPanel(micHost);
    } else {
      panelOpen = true;
      panel.classList.add('open');
      positionPanel();
      openPanelFor(micHost, () => { panelOpen = false; panel.classList.remove('open'); });
    }
  });

  function positionPanel(): void {
    const rect = micBtn.getBoundingClientRect();
    panel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - 296)}px`;
  }

  recordBtn.addEventListener('click', async () => {
    if (!recording) await startRecording(); else stopRecording();
  });

  async function startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await submitVoice(new Blob(chunks, { type: 'audio/webm' }));
      };
      recorder.start();
      recording = true;
      micBtn.classList.add('recording');
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏹ Stop recording';
      setVStatus('Recording…');
      actionsEl.classList.remove('visible');
      setTimeout(() => { if (recording) stopRecording(); }, 60_000);
    } catch {
      setVStatus('Microphone access denied.', 'error');
    }
  }

  function stopRecording(): void {
    if (recorder && recording) {
      recorder.stop(); recording = false;
      micBtn.classList.remove('recording');
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🎙 Start recording';
      recordBtn.disabled = true;
      setVStatus('Drafting…');
    }
  }

  async function submitVoice(blob: Blob): Promise<void> {
    try {
      const buf = await blob.arrayBuffer();
      const audioData = btoa(Array.from(new Uint8Array(buf), b => String.fromCharCode(b)).join(''));
      originalText = getComposeText(composeBody);
      const resp = await sendToBackground<{ result: VoiceDraftResponse } | { error: string }>({
        type: 'VOICE_DRAFT',
        payload: { audioData, mimeType: 'audio/webm', outputType: selectedType },
      });
      if ('error' in resp) throw new Error(String(resp.error));
      lastSessionId = resp.result.id;
      setComposeText(composeBody, resp.result.draft);
      setVStatus('Done ✓');
      actionsEl.classList.add('visible');
    } catch (err) {
      setVStatus(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      recordBtn.disabled = false;
    }
  }

  keepBtn.addEventListener('click', () => {
    if (lastSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastSessionId, accepted: true, editedDraft: null } });
    actionsEl.classList.remove('visible');
    panelOpen = false; panel.classList.remove('open');
    clearOpenPanel(micHost);
    setVStatus('');
  });

  undoBtn.addEventListener('click', () => {
    if (originalText) setComposeText(composeBody, originalText);
    if (lastSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastSessionId, accepted: false, editedDraft: null } });
    actionsEl.classList.remove('visible');
    setVStatus('Reverted.', 'success');
    setTimeout(() => setVStatus(''), 2000);
  });

  function setVStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg; statusEl.className = cls;
  }

  container.appendChild(micHost);
}

// ── Humanize button ────────────────────────────────────────────────────────────

function inject(composeBody: Element): void {
  if (composeBody.hasAttribute(HOST_ATTR)) return;
  composeBody.setAttribute(HOST_ATTR, '1');

  // Build wrapper row after the compose element (or nearest block parent)
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:6px;padding:0 2px;';

  const insertionPoint = isTextarea(composeBody)
    ? (composeBody.closest('form, .usertext-edit, .md-container') ?? composeBody.parentElement)
    : (composeBody.closest('.DraftEditor-root, .editor-container, [class*="Editor"]') ?? composeBody.parentElement);
  insertionPoint?.insertAdjacentElement('afterend', wrapper);
  if (!wrapper.parentElement) {
    composeBody.parentElement?.appendChild(wrapper);
  }

  const host = document.createElement('span');
  const shadow = host.attachShadow({ mode: 'open' });

  let selectedTone: Tone | null = null;
  let lastRewriteId: string | null = null;
  let panelOpen = false;

  shadow.innerHTML = `
    <style>${BUTTON_CSS}</style>
    <button id="wt-btn" title="Humanize with Writing Twin AI">✨ Humanize</button>
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

  const btn        = shadow.getElementById('wt-btn') as HTMLButtonElement;
  const panel      = shadow.getElementById('wt-panel') as HTMLDivElement;
  const rewriteBtn = shadow.getElementById('wt-rewrite') as HTMLButtonElement;
  const statusEl   = shadow.getElementById('wt-status') as HTMLDivElement;
  const limitEl    = shadow.getElementById('wt-limit') as HTMLDivElement;
  const actionsEl  = shadow.getElementById('wt-actions') as HTMLDivElement;
  const acceptBtn  = shadow.getElementById('wt-accept') as HTMLButtonElement;
  const rejectBtn  = shadow.getElementById('wt-reject') as HTMLButtonElement;

  shadow.querySelectorAll<HTMLButtonElement>('.wt-tone').forEach(tb => {
    tb.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-tone').forEach(b => b.classList.remove('active'));
      tb.classList.add('active');
      tb.style.background = tb.dataset.color ?? '#FF4500';
      tb.style.borderColor = tb.dataset.color ?? '#FF4500';
      selectedTone = tb.dataset.tone as Tone;
      rewriteBtn.disabled = false;
      statusEl.textContent = ''; statusEl.className = '';
      limitEl.classList.remove('visible');
      actionsEl.classList.remove('visible');
    });
  });

  btn.addEventListener('click', () => {
    if (panelOpen) {
      panelOpen = false;
      panel.classList.remove('open');
      clearOpenPanel(host);
    } else {
      panelOpen = true;
      panel.classList.add('open');
      positionPanel();
      openPanelFor(host, () => { panelOpen = false; panel.classList.remove('open'); });
    }
  });

  function positionPanel(): void {
    const rect = btn.getBoundingClientRect();
    panel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - 276)}px`;
  }

  let originalText = '';

  rewriteBtn.addEventListener('click', async () => {
    if (!selectedTone) return;
    const text = getComposeText(composeBody);
    if (!text) { setStatus('Write something first.', 'error'); return; }
    originalText = text;
    btn.disabled = true; rewriteBtn.disabled = true;
    setStatus('Rewriting…');
    actionsEl.classList.remove('visible');

    try {
      const resp = await sendToBackground<{ result: RewriteResponse } | { error: string }>({
        type: 'HUMANIZE',
        payload: {
          text,
          tone: selectedTone,
          ctx: { platform: 'reddit', context_twin_override: FIXED_CONTEXT_OVERRIDE },
        },
      });
      if ('error' in resp) throw new Error(String(resp.error));
      lastRewriteId = resp.result.id;
      setComposeText(composeBody, resp.result.output_text);
      setStatus('Done ✓', 'success');
      actionsEl.classList.add('visible');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.startsWith('LIMIT_REACHED:')) {
        limitEl.classList.add('visible'); setStatus('');
      } else {
        setStatus(msg, 'error');
      }
    } finally {
      btn.disabled = false;
      rewriteBtn.disabled = selectedTone === null;
    }
  });

  acceptBtn.addEventListener('click', () => {
    if (lastRewriteId) sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'accepted' } });
    actionsEl.classList.remove('visible');
    panelOpen = false; panel.classList.remove('open');
    clearOpenPanel(host);
    setStatus('');
  });

  rejectBtn.addEventListener('click', () => {
    if (originalText) setComposeText(composeBody, originalText);
    if (lastRewriteId) sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'rejected' } });
    actionsEl.classList.remove('visible');
    setStatus('Reverted.', 'success');
    setTimeout(() => setStatus(''), 2000);
  });

  function setStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg; statusEl.className = cls;
  }

  wrapper.appendChild(host);
  injectMicButton(wrapper, composeBody);
}

// ── MutationObserver ───────────────────────────────────────────────────────────

const seen = new WeakSet<Element>();

function tryInject(root: Element | Document): void {
  root.querySelectorAll<Element>(COMPOSE_SEL).forEach((body) => {
    if (!seen.has(body)) {
      seen.add(body);
      inject(body);
    }
  });
}

const observer = new MutationObserver(() => {
  requestIdleCallback(() => tryInject(document), { timeout: 500 });
});
observer.observe(document.body, { childList: true, subtree: true });
tryInject(document);

