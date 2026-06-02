import type { Tone, RewriteResponse, VoiceOutputType, VoiceDraftResponse } from '../lib/api';
import { detectAllCompose } from '../lib/compose-detector';
import { hiworksAdapter } from '../adapters/hiworks-adapter';

// Set to true temporarily to log candidate compose elements to the console.
// Useful if HiWorks changes its UI and the button stops appearing.
const DEBUG = false;

const HOST_ATTR = 'data-wt-hw-injected';
const FIXED_CONTEXT_OVERRIDE = 'professional';
// HiWorks primary color — sky blue, distinct from Gmail/Outlook/LinkedIn/Reddit
const PRIMARY = '#0EA5E9';

const TONES: { key: Tone; label: string; color: string }[] = [
  { key: 'professional', label: 'Professional', color: PRIMARY },
  { key: 'friendly',     label: 'Friendly',     color: '#F59E0B' },
  { key: 'direct',       label: 'Direct',       color: '#DC2626' },
  { key: 'diplomatic',   label: 'Diplomatic',   color: '#7C3AED' },
  { key: 'executive',    label: 'Executive',    color: '#0F172A' },
  { key: 'casual',       label: 'Casual',       color: '#06B6D4' },
];

const VOICE_OUTPUT_TYPES: { key: VoiceOutputType; label: string }[] = [
  { key: 'email',            label: 'Email' },
  { key: 'reply',            label: 'Reply' },
  { key: 'customer_update',  label: 'Customer Update' },
  { key: 'technical_report', label: 'Tech Report' },
];

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
  :host { display: inline-flex; align-items: center; gap: 4px; }

  #wt-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 12px; border-radius: 9999px; border: none;
    background: ${PRIMARY}; color: #fff;
    font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, box-shadow 0.15s;
  }
  #wt-btn:hover { background: #0284C7; box-shadow: 0 0 0 3px rgba(14,165,233,0.25); }
  #wt-btn:disabled { opacity: 0.6; cursor: default; box-shadow: none; }

  #wt-mic-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 9999px; border: none;
    background: transparent; color: #555; cursor: pointer;
    font-size: 15px; line-height: 1;
    transition: background 0.15s, color 0.15s;
  }
  #wt-mic-btn:hover { background: rgba(0,0,0,0.07); }
  #wt-mic-btn.recording { background: #FEE2E2; color: #DC2626;
    animation: wt-pulse 1.2s ease-in-out infinite; }
  @keyframes wt-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
  }
  #wt-mic-btn:disabled { opacity: 0.5; cursor: default; }

  .wt-panel {
    position: fixed; z-index: 99999;
    background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.14);
    padding: 14px 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  .wt-panel.open { display: block; }

  /* ── Humanize panel ── */
  #wt-panel { width: 260px; }
  .wt-title { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase; }
  .wt-tones { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .wt-tone {
    padding: 4px 10px; border-radius: 9999px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151;
    cursor: pointer; transition: all 0.1s;
  }
  .wt-tone.active { color: #fff; border-color: transparent; }
  .wt-tone:hover:not(.active) { border-color: #7DD3FC; }

  #wt-rewrite {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: ${PRIMARY}; color: #fff;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
  }
  #wt-rewrite:disabled { opacity: 0.45; cursor: default; }

  #wt-status { margin-top: 8px; font-size: 11px; text-align: center; min-height: 14px; }
  #wt-status.error   { color: #EF4444; }
  #wt-status.success { color: #10B981; }

  #wt-limit { display: none; margin-top: 10px; padding: 10px 12px; border-radius: 8px;
    background: #FFF8F1; border: 1px solid #FED7AA; text-align: center; }
  #wt-limit.visible { display: block; }
  #wt-limit p { font-size: 11px; color: #92400E; margin: 0 0 8px; line-height: 1.4; }
  #wt-limit a {
    display: inline-block; padding: 5px 14px; border-radius: 9999px;
    background: #F59E0B; color: #fff; font-size: 11px; font-weight: 600;
    text-decoration: none;
  }

  #wt-actions { display: none; gap: 6px; margin-top: 8px; }
  #wt-actions.visible { display: flex; }
  .wt-action {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151; cursor: pointer;
  }
  .wt-action.accept { border-color: #10B981; color: #10B981; }
  .wt-action.reject { border-color: #EF4444; color: #EF4444; }

  /* ── Voice panel ── */
  #wt-voice-panel { width: 280px; }
  .wt-vt { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase; }
  .wt-otype-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; }
  .wt-otypes { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .wt-otype {
    padding: 3px 9px; border-radius: 9999px; border: 1.5px solid #E8EAED;
    background: #fff; font-size: 11px; color: #374151; cursor: pointer; transition: all 0.1s;
  }
  .wt-otype.active { background: ${PRIMARY}; color: #fff; border-color: ${PRIMARY}; }
  #wt-record-btn {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: #DC2626; color: #fff; cursor: pointer; margin-bottom: 10px;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #wt-record-btn.recording { background: #7F1D1D; }
  #wt-record-btn:disabled { opacity: 0.5; cursor: default; }
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

// ── Module-level panel manager — single delegated click listener ───────────────
// Guarantees exactly one document listener regardless of how many compose
// windows are open simultaneously (important for SPA navigations).

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

function readCompose(el: Element): string {
  if (isTextarea(el)) return (el as HTMLTextAreaElement).value.trim();
  return (el as HTMLElement).innerText.trim();
}

function writeCompose(el: Element, text: string): void {
  if (isTextarea(el)) {
    const ta = el as HTMLTextAreaElement;
    ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    const div = el as HTMLElement;
    div.focus();
    document.execCommand('selectAll', false, undefined);
    document.execCommand('delete', false, undefined);
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) document.execCommand('insertText', false, lines[i]);
      if (i < lines.length - 1) document.execCommand('insertParagraph', false, undefined);
    }
  }
}

// ── Injection ──────────────────────────────────────────────────────────────────

function inject(composeBody: Element): void {
  if (composeBody.hasAttribute(HOST_ATTR)) return;
  composeBody.setAttribute(HOST_ATTR, '1');

  // Inject a row of buttons below the compose area.
  // Use a close ancestor as the insertion point so HiWorks' own layout is
  // disrupted as little as possible.
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:8px;padding:0 2px;';

  const insertionPoint =
    composeBody.closest('[class*="editor"], [class*="compose"], [class*="mail"], form') ??
    composeBody.parentElement;
  insertionPoint?.insertAdjacentElement('afterend', wrapper);
  if (!wrapper.parentElement) composeBody.parentElement?.appendChild(wrapper);

  const host = document.createElement('span');
  const shadow = host.attachShadow({ mode: 'open' });

  let selectedTone: Tone | null = null;
  let lastRewriteId: string | null = null;
  let panelOpen = false;
  let voicePanelOpen = false;
  let selectedOutputType: VoiceOutputType = VOICE_OUTPUT_TYPES[0].key;
  let recorder: MediaRecorder | null = null;
  let recording = false;
  let audioChunks: BlobPart[] = [];
  let lastVoiceSessionId: string | null = null;
  let originalText = '';
  let originalVoiceText = '';

  shadow.innerHTML = `
    <style>${CSS}</style>
    <button id="wt-btn" title="Humanize with Writing Twin AI">✨ Humanize</button>
    <button id="wt-mic-btn" title="Voice Twin — speak your email">🎙</button>

    <div id="wt-panel" class="wt-panel">
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

    <div id="wt-voice-panel" class="wt-panel">
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

  // ── Element refs ──────────────────────────────────────────────────────────────
  const btn        = shadow.getElementById('wt-btn')          as HTMLButtonElement;
  const micBtn     = shadow.getElementById('wt-mic-btn')      as HTMLButtonElement;
  const panel      = shadow.getElementById('wt-panel')        as HTMLDivElement;
  const voicePanel = shadow.getElementById('wt-voice-panel')  as HTMLDivElement;
  const rewriteBtn = shadow.getElementById('wt-rewrite')      as HTMLButtonElement;
  const statusEl   = shadow.getElementById('wt-status')       as HTMLDivElement;
  const limitEl    = shadow.getElementById('wt-limit')        as HTMLDivElement;
  const actionsEl  = shadow.getElementById('wt-actions')      as HTMLDivElement;
  const acceptBtn  = shadow.getElementById('wt-accept')       as HTMLButtonElement;
  const rejectBtn  = shadow.getElementById('wt-reject')       as HTMLButtonElement;
  const recordBtn  = shadow.getElementById('wt-record-btn')   as HTMLButtonElement;
  const vStatusEl  = shadow.getElementById('wt-voice-status') as HTMLDivElement;
  const vActionsEl = shadow.getElementById('wt-voice-actions') as HTMLDivElement;
  const vKeepBtn   = shadow.getElementById('wt-va-keep')      as HTMLButtonElement;
  const vUndoBtn   = shadow.getElementById('wt-va-undo')      as HTMLButtonElement;

  // ── Tone selector ─────────────────────────────────────────────────────────────
  shadow.querySelectorAll<HTMLButtonElement>('.wt-tone').forEach(tb => {
    tb.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-tone').forEach(b => b.classList.remove('active'));
      tb.classList.add('active');
      tb.style.background  = tb.dataset.color ?? PRIMARY;
      tb.style.borderColor = tb.dataset.color ?? PRIMARY;
      selectedTone = tb.dataset.tone as Tone;
      rewriteBtn.disabled = false;
      setStatus(''); limitEl.classList.remove('visible');
      actionsEl.classList.remove('visible');
    });
  });

  // ── Voice output type selector ────────────────────────────────────────────────
  shadow.querySelectorAll<HTMLButtonElement>('.wt-otype').forEach(ob => {
    ob.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-otype').forEach(b => b.classList.remove('active'));
      ob.classList.add('active');
      selectedOutputType = ob.dataset.type as VoiceOutputType;
    });
  });

  // ── Panel toggles (delegated click listener handles outside-clicks) ──────────
  btn.addEventListener('click', () => {
    if (panelOpen) {
      panelOpen = false; panel.classList.remove('open');
      clearOpenPanel(host);
    } else {
      voicePanelOpen = false; voicePanel.classList.remove('open');
      panelOpen = true; panel.classList.add('open');
      positionPanel(btn, panel);
      openPanelFor(host, () => {
        panelOpen = false; panel.classList.remove('open');
        voicePanelOpen = false; voicePanel.classList.remove('open');
      });
    }
  });

  micBtn.addEventListener('click', () => {
    if (voicePanelOpen) {
      voicePanelOpen = false; voicePanel.classList.remove('open');
      clearOpenPanel(host);
    } else {
      panelOpen = false; panel.classList.remove('open');
      voicePanelOpen = true; voicePanel.classList.add('open');
      positionPanel(micBtn, voicePanel);
      openPanelFor(host, () => {
        voicePanelOpen = false; voicePanel.classList.remove('open');
        panelOpen = false; panel.classList.remove('open');
      });
    }
  });

  function positionPanel(anchor: HTMLElement, p: HTMLDivElement): void {
    const rect = anchor.getBoundingClientRect();
    p.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    p.style.left   = `${Math.min(rect.left, window.innerWidth - parseInt(p.style.width || '260') - 20)}px`;
  }

  // ── Rewrite ───────────────────────────────────────────────────────────────────
  rewriteBtn.addEventListener('click', async () => {
    if (!selectedTone) return;
    const text = readCompose(composeBody);
    if (!text) { setStatus('Write something first.', 'error'); return; }

    originalText = text;
    btn.disabled = true; rewriteBtn.disabled = true;
    setStatus('Rewriting…'); actionsEl.classList.remove('visible');

    try {
      const resp = await sendToBackground<{ result: RewriteResponse } | { error: string }>({
        type: 'HUMANIZE',
        payload: {
          text,
          tone: selectedTone,
          ctx: { platform: 'hiworks', context_twin_override: FIXED_CONTEXT_OVERRIDE },
        },
      });
      if ('error' in resp) throw new Error(String(resp.error));
      lastRewriteId = resp.result.id;
      writeCompose(composeBody, resp.result.output_text);
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
    if (originalText) writeCompose(composeBody, originalText);
    if (lastRewriteId) sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'rejected' } });
    actionsEl.classList.remove('visible');
    setStatus('Reverted.', 'success');
    setTimeout(() => setStatus(''), 2000);
  });

  function setStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg; statusEl.className = cls;
  }

  // ── Recording ─────────────────────────────────────────────────────────────────
  recordBtn.addEventListener('click', async () => {
    if (!recording) await startRecording(); else stopRecording();
  });

  async function startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await submitVoice(new Blob(audioChunks, { type: 'audio/webm' }));
      };
      recorder.start();
      recording = true;
      micBtn.classList.add('recording');
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏹ Stop recording';
      setVStatus('Recording…');
      vActionsEl.classList.remove('visible');
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
      originalVoiceText = readCompose(composeBody);
      const resp = await sendToBackground<{ result: VoiceDraftResponse } | { error: string }>({
        type: 'VOICE_DRAFT',
        payload: { audioData, mimeType: 'audio/webm', outputType: selectedOutputType },
      });
      if ('error' in resp) throw new Error(String(resp.error));
      lastVoiceSessionId = resp.result.id;
      writeCompose(composeBody, resp.result.draft);
      setVStatus('Done ✓');
      vActionsEl.classList.add('visible');
    } catch (err) {
      setVStatus(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      recordBtn.disabled = false;
    }
  }

  vKeepBtn.addEventListener('click', () => {
    if (lastVoiceSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastVoiceSessionId, accepted: true, editedDraft: null } });
    vActionsEl.classList.remove('visible');
    voicePanelOpen = false; voicePanel.classList.remove('open');
    clearOpenPanel(host);
    setVStatus('');
  });

  vUndoBtn.addEventListener('click', () => {
    if (originalVoiceText) writeCompose(composeBody, originalVoiceText);
    if (lastVoiceSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastVoiceSessionId, accepted: false, editedDraft: null } });
    vActionsEl.classList.remove('visible');
    setVStatus('Reverted.', 'success');
    setTimeout(() => setVStatus(''), 2000);
  });

  function setVStatus(msg: string, cls = ''): void {
    vStatusEl.textContent = msg; vStatusEl.className = cls;
  }

  wrapper.appendChild(host);
}

// ── Observer ───────────────────────────────────────────────────────────────────

const seen = new WeakSet<Element>();

function tryInject(root: Element | Document = document): void {
  const targets = detectAllCompose({ ...hiworksAdapter, minWidth: 300, minHeight: 80 });

  if (DEBUG && targets.length > 0) {
    console.log('[WritingTwin/HiWorks] compose candidates:', targets.map(t => ({
      tag: t.element.tagName,
      id: t.element.id || '–',
      classes: t.element.className,
      confidence: t.confidence,
    })));
  }

  for (const { element } of targets) {
    if (!seen.has(element)) {
      seen.add(element);
      inject(element);
    }
  }
}

const observer = new MutationObserver(() => {
  requestIdleCallback(() => tryInject(), { timeout: 500 });
});
observer.observe(document.body, { childList: true, subtree: true });

tryInject();
