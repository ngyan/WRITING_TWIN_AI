import type { Tone, RewriteResponse, VoiceOutputType, VoiceDraftResponse, HumanizeContext, AutoDraftResponse } from '../lib/api';

// Gmail selectors — use prefix/substring matches so locale variants still match
// e.g. tooltip can be "Send", "Send ⌘Enter", "Send (Ctrl+Enter)"
const COMPOSE_BODY_SEL = '[g_editable="true"], div[contenteditable="true"][aria-multiline="true"]';
const SEND_BUTTON_SEL = '[data-tooltip^="Send"], [aria-label^="Send"]';
const HOST_ATTR = 'data-wt-injected';
const AUTO_DRAFT_TIMEOUT_MS = 2000;
const AUTO_DRAFT_DEFAULT_TONE: Tone = 'professional';

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

// ── Voice output types ─────────────────────────────────────────────────────────

const VOICE_OUTPUT_TYPES: { key: VoiceOutputType; label: string }[] = [
  { key: 'reply',           label: 'Reply' },
  { key: 'email',           label: 'Email' },
  { key: 'customer_update', label: 'Customer Update' },
  { key: 'jira_ticket',     label: 'Jira Ticket' },
  { key: 'technical_report',label: 'Tech Report' },
];

const MIC_CSS = `
  :host { display: inline-flex; align-items: center; margin-left: 4px; }

  #wt-mic-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 9999px; border: none;
    background: transparent; color: #5F6368; cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-size: 15px; line-height: 1;
  }
  #wt-mic-btn:hover { background: rgba(0,0,0,0.07); }
  #wt-mic-btn.recording {
    background: #FEE2E2; color: #DC2626;
    animation: wt-pulse 1.2s ease-in-out infinite;
  }
  @keyframes wt-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
  }
  #wt-mic-btn:disabled { opacity: 0.5; cursor: default; }

  #wt-voice-panel {
    position: fixed; z-index: 9999;
    background: #fff; border: 1px solid #E8EAED; border-radius: 10px;
    box-shadow: 0 12px 32px rgba(15,23,42,0.14);
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
  .wt-otype.active { background: #4F46E5; color: #fff; border-color: #4F46E5; }

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

// ── Inject Voice Twin mic button ───────────────────────────────────────────────

function injectMicButton(toolbar: Element, composeBody: Element): void {
  const micHost = document.createElement('span');
  const shadow = micHost.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>${MIC_CSS}</style>
    <button id="wt-mic-btn" title="Voice Twin — speak your email (Cmd+Shift+V)">🎙</button>
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

  const micBtn      = shadow.getElementById('wt-mic-btn') as HTMLButtonElement;
  const panel       = shadow.getElementById('wt-voice-panel') as HTMLDivElement;
  const recordBtn   = shadow.getElementById('wt-record-btn') as HTMLButtonElement;
  const statusEl    = shadow.getElementById('wt-voice-status') as HTMLDivElement;
  const actionsEl   = shadow.getElementById('wt-voice-actions') as HTMLDivElement;
  const keepBtn     = shadow.getElementById('wt-va-keep') as HTMLButtonElement;
  const undoBtn     = shadow.getElementById('wt-va-undo') as HTMLButtonElement;

  let panelOpen = false;
  let selectedType: VoiceOutputType = 'reply';
  let recorder: MediaRecorder | null = null;
  let recording = false;
  let chunks: BlobPart[] = [];
  let lastSessionId: string | null = null;
  let originalText = '';

  // Output type selection
  shadow.querySelectorAll<HTMLButtonElement>('.wt-otype').forEach(btn => {
    btn.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-otype').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type as VoiceOutputType;
    });
  });

  micBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) positionPanel();
  });

  document.addEventListener('click', (e) => {
    if (!micHost.contains(e.target as Node) && panelOpen) {
      panelOpen = false;
      panel.classList.remove('open');
    }
  }, true);

  function positionPanel(): void {
    const rect = micBtn.getBoundingClientRect();
    panel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - 296)}px`;
  }

  recordBtn.addEventListener('click', async () => {
    if (!recording) {
      await startRecording();
    } else {
      stopRecording();
    }
  });

  async function startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await submitVoice(blob);
      };

      recorder.start();
      recording = true;
      micBtn.classList.add('recording');
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏹ Stop recording';
      setVoiceStatus('Recording…');
      actionsEl.classList.remove('visible');

      // Auto-stop at 60 seconds
      setTimeout(() => {
        if (recording) stopRecording();
      }, 60_000);
    } catch {
      setVoiceStatus('Microphone access denied.', 'error');
    }
  }

  function stopRecording(): void {
    if (recorder && recording) {
      recorder.stop();
      recording = false;
      micBtn.classList.remove('recording');
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🎙 Start recording';
      recordBtn.disabled = true;
      setVoiceStatus('Drafting…');
    }
  }

  async function submitVoice(blob: Blob): Promise<void> {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const audioData = btoa(binary);

      originalText = (composeBody as HTMLElement).innerText.trim();

      const resp = await sendToBackground<{ result: VoiceDraftResponse } | { error: string }>({
        type: 'VOICE_DRAFT',
        payload: { audioData, mimeType: 'audio/webm', outputType: selectedType },
      });

      if ('error' in resp) throw new Error(String(resp.error));

      lastSessionId = resp.result.id;
      setComposeText(composeBody as HTMLElement, resp.result.draft);
      setVoiceStatus('Done ✓');
      actionsEl.classList.add('visible');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setVoiceStatus(msg, 'error');
    } finally {
      recordBtn.disabled = false;
    }
  }

  keepBtn.addEventListener('click', () => {
    if (lastSessionId) {
      sendToBackground({
        type: 'VOICE_FEEDBACK',
        payload: { sessionId: lastSessionId, accepted: true, editedDraft: null },
      });
    }
    actionsEl.classList.remove('visible');
    panelOpen = false;
    panel.classList.remove('open');
    setVoiceStatus('');
  });

  undoBtn.addEventListener('click', () => {
    if (originalText) setComposeText(composeBody as HTMLElement, originalText);
    if (lastSessionId) {
      sendToBackground({
        type: 'VOICE_FEEDBACK',
        payload: { sessionId: lastSessionId, accepted: false, editedDraft: null },
      });
    }
    actionsEl.classList.remove('visible');
    setVoiceStatus('Reverted.', 'success');
    setTimeout(() => setVoiceStatus(''), 2000);
  });

  function setVoiceStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg;
    statusEl.className = cls;
  }

  // Insert mic host after the humanize host (which is right before the Send button)
  const humanizeHost = Array.from(toolbar.children).find(c => c.shadowRoot);
  if (humanizeHost) {
    toolbar.insertBefore(micHost, humanizeHost.nextSibling);
  } else {
    const sendBtn = toolbar.querySelector(SEND_BUTTON_SEL);
    if (sendBtn) toolbar.insertBefore(micHost, sendBtn);
    else toolbar.appendChild(micHost);
  }
}

// ── Context helpers ────────────────────────────────────────────────────────────

function buildGmailContext(composeBody: Element): HumanizeContext {
  // Walk up to compose container and read To field + Subject
  let el: Element | null = composeBody;
  let container: Element | null = null;
  for (let i = 0; i < 20; i++) {
    if (!el) break;
    if (el.querySelector('[data-hovercard-id], [email]')) { container = el; break; }
    el = el.parentElement;
  }

  let recipientDomain: string | undefined;
  let threadSubject: string | undefined;

  if (container) {
    // Recipient email chip: [email="user@domain.com"] or data-hovercard-id
    const chip = container.querySelector<HTMLElement>('[email], [data-hovercard-id]');
    const email = chip?.getAttribute('email') ?? chip?.getAttribute('data-hovercard-id') ?? '';
    if (email.includes('@')) recipientDomain = email.split('@')[1].toLowerCase();

    // Subject input
    const subjectEl = container.querySelector<HTMLInputElement>('input[name="subjectbox"]');
    if (subjectEl?.value) threadSubject = subjectEl.value;
  }

  return {
    platform: 'gmail',
    recipient_domain: recipientDomain,
    thread_subject: threadSubject,
  };
}

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
  let detectedContextTwin = 'professional';
  let contextOverride: string | undefined;

  shadow.innerHTML = `
    <style>${BUTTON_CSS}
    #wt-ctx-badge {
      display: inline-flex; align-items: center;
      height: 18px; padding: 0 7px; border-radius: 9999px;
      background: #EEF2FF; color: #4338CA; font-size: 10px; font-weight: 600;
      margin-left: 5px; cursor: pointer; white-space: nowrap;
      transition: background 0.1s;
    }
    #wt-ctx-badge:hover { background: #E0E7FF; }
    #wt-ctx-badge.hidden { display: none; }
    </style>
    <button id="wt-btn" title="Humanize with Writing Twin AI (Cmd+Shift+H)">✨ Humanize</button>
    <span id="wt-ctx-badge" class="hidden" title="Detected context — click to override"></span>
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

  const btn      = shadow.getElementById('wt-btn')       as HTMLButtonElement;
  const ctxBadge = shadow.getElementById('wt-ctx-badge') as HTMLSpanElement;
  const panel    = shadow.getElementById('wt-panel')     as HTMLDivElement;
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

  // Detect context on first open (fire-and-forget)
  setTimeout(() => refreshContextBadge(), 800);

  function refreshContextBadge(): void {
    const ctx = buildGmailContext(composeBody);
    sendToBackground<{ result?: { context_twin: string } } | { error: string }>({
      type: 'DETECT_CONTEXT',
      payload: ctx,
    }).then((resp) => {
      if ('result' in resp && resp.result?.context_twin) {
        detectedContextTwin = resp.result.context_twin;
        showContextBadge(detectedContextTwin);
      }
    }).catch(() => { /* best-effort */ });
  }

  function showContextBadge(twin: string): void {
    const label = twin.charAt(0).toUpperCase() + twin.slice(1);
    ctxBadge.textContent = label;
    ctxBadge.classList.remove('hidden');
  }

  // Badge click: cycle through context overrides
  const CONTEXT_CYCLE = ['professional', 'customer', 'technical', 'escalation', 'casual'];
  ctxBadge.addEventListener('click', () => {
    const current = contextOverride ?? detectedContextTwin;
    const idx = CONTEXT_CYCLE.indexOf(current);
    const next = CONTEXT_CYCLE[(idx + 1) % CONTEXT_CYCLE.length];
    contextOverride = next;
    showContextBadge(next);
    // Record override signal
    sendToBackground({
      type: 'CONTEXT_OVERRIDE',
      payload: {
        detected_context: detectedContextTwin,
        selected_context: next,
        platform: 'gmail',
      },
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
      const baseCtx = buildGmailContext(composeBody);
      const resp = await sendToBackground<{ result: RewriteResponse }>({
        type: 'HUMANIZE',
        payload: {
          text,
          tone: selectedTone,
          ctx: { ...baseCtx, context_twin_override: contextOverride },
        },
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

  // Insert humanize host before Send button in the toolbar
  toolbar.insertBefore(host, sendBtn);

  // Inject mic button immediately after
  injectMicButton(toolbar, composeBody);

  // Auto-draft: fire after 500ms to let compose fully mount
  setTimeout(() => tryAutoDraft(composeBody), 500);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function findSendButton(composeBody: Element): Element | null {
  // Walk up the tree to find the compose container that holds the Send button.
  // Gmail nests the toolbar deep — 25 levels is safe headroom.
  let el: Element | null = composeBody;
  for (let i = 0; i < 25; i++) {
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

// ── Auto Draft — detect reply, read incoming email, inject banner ─────────────

/**
 * Walk up from composeBody to find a thread container that holds message rows
 * (.gs elements). Returns the last .gs before the compose area, or null if
 * this looks like a new-compose (not a reply).
 */
function findIncomingMessageEl(composeBody: Element): Element | null {
  let el: Element | null = composeBody;
  let threadContainer: Element | null = null;
  for (let i = 0; i < 20; i++) {
    if (!el) break;
    if (el.querySelectorAll('.gs').length > 0) { threadContainer = el; break; }
    el = el.parentElement;
  }
  if (!threadContainer) return null;

  // Walk message rows — find the last .gs that doesn't contain the compose body
  const rows = Array.from(threadContainer.querySelectorAll('.gs'));
  for (let i = rows.length - 1; i >= 0; i--) {
    if (!rows[i].contains(composeBody)) return rows[i];
  }
  return null;
}

function extractIncomingText(msgEl: Element): string | null {
  // Try standard Gmail message body selectors in priority order
  const bodyEl = (
    msgEl.querySelector('.a3s.aiL') ??
    msgEl.querySelector('.ii.gt') ??
    msgEl.querySelector('.adn')
  ) as HTMLElement | null;
  if (!bodyEl) return null;
  const text = bodyEl.innerText.trim();
  if (text.length < 20) return null;
  // First 500 words only
  return text.split(/\s+/).slice(0, 500).join(' ');
}

const AUTO_DRAFT_ATTR = 'data-wt-autodraft';

async function tryAutoDraft(composeBody: Element): Promise<void> {
  // Guard: only fire once per compose window
  if (composeBody.hasAttribute(AUTO_DRAFT_ATTR)) return;
  composeBody.setAttribute(AUTO_DRAFT_ATTR, '1');

  // Only fire if compose body is empty (user hasn't started typing)
  if ((composeBody as HTMLElement).innerText.trim() !== '') return;

  const incomingEl = findIncomingMessageEl(composeBody);
  if (!incomingEl) return; // new compose — skip

  const incomingText = extractIncomingText(incomingEl);
  if (!incomingText) return;

  const ctx = buildGmailContext(composeBody);

  // 2s AbortController timeout — never block the user
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTO_DRAFT_TIMEOUT_MS);

  let result: AutoDraftResponse;
  try {
    const resp = await Promise.race([
      sendToBackground<{ result: AutoDraftResponse } | { error: string }>({
        type: 'AUTO_DRAFT',
        payload: {
          incomingText,
          tone: AUTO_DRAFT_DEFAULT_TONE,
          ctx,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), AUTO_DRAFT_TIMEOUT_MS)
      ),
    ]);
    clearTimeout(timeoutId);
    if ('error' in resp) return;
    result = resp.result;
  } catch {
    clearTimeout(timeoutId);
    return;
  }

  // Only inject if compose is still empty (user may have started typing during the wait)
  if ((composeBody as HTMLElement).innerText.trim() !== '') return;

  showAutoDraftBanner(composeBody, result);
}

function showAutoDraftBanner(composeBody: Element, result: AutoDraftResponse): void {
  // Remove any existing banner
  document.getElementById('wt-auto-draft-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'wt-auto-draft-banner';
  banner.style.cssText = `
    position: fixed; z-index: 9998;
    background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 10px;
    padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #312E81; box-shadow: 0 4px 16px rgba(79,70,229,0.12);
    max-width: 420px;
  `;

  const label = document.createElement('span');
  label.style.cssText = 'font-weight: 600; white-space: nowrap;';
  label.textContent = '✦ Draft ready';

  const useBtn = document.createElement('button');
  useBtn.style.cssText = `
    height: 28px; padding: 0 12px; border-radius: 9999px; border: none;
    background: #4F46E5; color: #fff; font: 600 12px/1 inherit;
    cursor: pointer; white-space: nowrap;
  `;
  useBtn.textContent = 'Use draft';

  const dismissBtn = document.createElement('button');
  dismissBtn.style.cssText = `
    height: 24px; width: 24px; border-radius: 9999px; border: none;
    background: transparent; color: #6366F1; font-size: 16px; line-height: 1;
    cursor: pointer; margin-left: auto; display: flex; align-items: center; justify-content: center;
  `;
  dismissBtn.title = 'Dismiss';
  dismissBtn.textContent = '✕';

  banner.append(label, useBtn, dismissBtn);
  document.body.appendChild(banner);

  // Position banner above the compose body
  function positionBanner(): void {
    const rect = composeBody.getBoundingClientRect();
    banner.style.top = `${Math.max(rect.top - 52, 60)}px`;
    banner.style.left = `${Math.min(rect.left, window.innerWidth - 440)}px`;
  }
  positionBanner();
  window.addEventListener('resize', positionBanner, { passive: true });

  function removeBanner(): void {
    banner.remove();
    window.removeEventListener('resize', positionBanner);
  }

  // "Use draft" — fill compose and record kept=true
  useBtn.addEventListener('click', () => {
    setComposeText(composeBody as HTMLElement, result.draft);
    sendToBackground({
      type: 'AUTO_DRAFT_FEEDBACK',
      payload: { draftId: result.id, kept: true },
    });
    removeBanner();
  });

  // "✕ Dismiss" — record kept=false
  dismissBtn.addEventListener('click', () => {
    sendToBackground({
      type: 'AUTO_DRAFT_FEEDBACK',
      payload: { draftId: result.id, kept: false },
    });
    removeBanner();
  });

  // Auto-dismiss if user starts typing
  const typingListener = (): void => {
    if ((composeBody as HTMLElement).innerText.trim() !== '') {
      sendToBackground({
        type: 'AUTO_DRAFT_FEEDBACK',
        payload: { draftId: result.id, kept: false },
      });
      removeBanner();
      composeBody.removeEventListener('input', typingListener);
    }
  };
  composeBody.addEventListener('input', typingListener);

  // Auto-dismiss after 30s if no interaction
  setTimeout(removeBanner, 30_000);
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const toolbar = document.querySelector(`[${HOST_ATTR}]`);
  if (!toolbar) return;
  const hosts = Array.from(toolbar.children).filter(c => c.shadowRoot) as HTMLElement[];

  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
    e.preventDefault();
    // First shadow host = humanize button
    const btn = hosts[0]?.shadowRoot?.getElementById('wt-btn') as HTMLButtonElement | null;
    btn?.click();
  }

  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'V') {
    e.preventDefault();
    // Second shadow host = mic button
    const btn = hosts[1]?.shadowRoot?.getElementById('wt-mic-btn') as HTMLButtonElement | null;
    btn?.click();
  }
});
