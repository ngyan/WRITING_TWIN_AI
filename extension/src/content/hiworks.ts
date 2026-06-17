/**
 * HiWorks Mail content script — injects ✨ Humanize + 🎙 Voice Twin into the
 * compose view on mails.office.hiworks.com (and custom-domain HiWorks tenants).
 *
 * HiWorks differs from Gmail/Outlook in one important way: the message body is a
 * Naver SmartEditor running inside an IFRAME (iframe.se-contents-edit), so we
 * read/write via that iframe's contentDocument.body rather than a contenteditable
 * div in the top document. The toolbar/Send button live in the top document
 * (header[class*="Write_header"]).
 */
import type { Tone, RewriteResponse, VoiceOutputType, VoiceDraftResponse } from '../lib/api';

// ── Selectors ──────────────────────────────────────────────────────────────────
const EDITOR_IFRAME_SEL = 'iframe.se-contents-edit';
const HEADER_SEL = 'header[class*="Write_header"]';
const SUBJECT_SEL = 'input[class*="Input_input"]';
const SEND_RE = /^(send|전송|보내기)$/i;
const HOST_ATTR = 'data-wt-hw-injected';

// ── Context detection ──────────────────────────────────────────────────────────
const FORMAL_SUBJECT_RE = /proposal|agreement|contract|invoice|report|presentation|strategy|executive|board|investor|client|partner/i;
const CASUAL_SUBJECT_RE = /hey|hi|quick|catch up|fyi|heads up|question|help|idea/i;

function getSubject(): string {
  const el = document.querySelector(SUBJECT_SEL) as HTMLInputElement | null;
  return el?.value ?? '';
}

function detectContextTone(): Tone {
  const subject = getSubject();
  if (/board|ceo|vp |cto |cfo |director|investor/i.test(subject)) return 'executive';
  if (FORMAL_SUBJECT_RE.test(subject)) return 'professional';
  if (CASUAL_SUBJECT_RE.test(subject)) return 'friendly';
  return 'professional';
}

// ── Tones ──────────────────────────────────────────────────────────────────────
const TONES: { key: Tone; label: string; color: string }[] = [
  { key: 'professional', label: 'Professional', color: '#4F46E5' },
  { key: 'casual',       label: 'Casual',       color: '#06B6D4' },
  { key: 'friendly',     label: 'Friendly',     color: '#F59E0B' },
  { key: 'direct',       label: 'Direct',       color: '#DC2626' },
  { key: 'diplomatic',   label: 'Diplomatic',   color: '#7C3AED' },
  { key: 'executive',    label: 'Executive',    color: '#0F172A' },
];

const VOICE_OUTPUT_TYPES: { key: VoiceOutputType; label: string }[] = [
  { key: 'reply',            label: 'Reply' },
  { key: 'email',            label: 'Email' },
  { key: 'customer_update',  label: 'Customer Update' },
  { key: 'jira_ticket',      label: 'Jira Ticket' },
  { key: 'technical_report', label: 'Tech Report' },
];

// ── Shadow DOM CSS ─────────────────────────────────────────────────────────────
const BASE_CSS = `
  :host { display: inline-flex; align-items: center; margin: 0 4px; }

  #wt-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 12px; border-radius: 9999px; border: none;
    background: #4F46E5; color: #fff;
    font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer; white-space: nowrap; transition: background 0.15s, box-shadow 0.15s;
  }
  #wt-btn:hover  { background: #3F37C9; box-shadow: 0 0 0 3px rgba(79,70,229,0.25); }
  #wt-btn:disabled { opacity: 0.6; cursor: default; box-shadow: none; }

  #wt-mic-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 9999px; border: none;
    background: transparent; color: #4b5563; cursor: pointer;
    font-size: 15px; line-height: 1; margin-left: 3px; transition: background 0.15s;
  }
  #wt-mic-btn:hover { background: rgba(0,0,0,0.06); }
  #wt-mic-btn.recording {
    background: #FEE2E2; color: #DC2626; animation: wt-pulse 1.2s ease-in-out infinite;
  }
  @keyframes wt-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
  }

  .wt-panel {
    position: fixed; z-index: 100000;
    background: #fff; border: 1px solid #E5E7EB; border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18); padding: 14px 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  .wt-panel.open { display: block; }

  #wt-panel { width: 260px; }
  .wt-title {
    font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .wt-tones { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .wt-tone {
    padding: 4px 10px; border-radius: 9999px; border: 1.5px solid #E5E7EB;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151; cursor: pointer;
    transition: all 0.1s;
  }
  .wt-tone.active { color: #fff; border-color: transparent; }
  .wt-tone:hover:not(.active) { border-color: #9BA0FF; }

  #wt-rewrite {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: #4F46E5; color: #fff;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
  }
  #wt-rewrite:disabled { opacity: 0.45; cursor: default; }

  #wt-status { margin-top: 8px; font-size: 11px; text-align: center; min-height: 14px; }
  #wt-status.error   { color: #EF4444; }
  #wt-status.success { color: #10B981; }

  #wt-limit {
    display: none; margin-top: 10px; padding: 10px 12px; border-radius: 8px;
    background: #FFF8F1; border: 1px solid #FED7AA; text-align: center;
  }
  #wt-limit.visible { display: block; }
  #wt-limit p { font-size: 11px; color: #92400E; margin: 0 0 8px; line-height: 1.4; }
  #wt-limit a {
    display: inline-block; padding: 5px 14px; border-radius: 9999px;
    background: #F59E0B; color: #fff; font-size: 11px; font-weight: 600; text-decoration: none;
  }

  #wt-voicematch {
    display: none; align-items: center; gap: 6px;
    margin-top: 10px; padding: 7px 10px; border-radius: 8px;
    background: linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%); border: 1px solid #DDD6FE;
  }
  #wt-voicematch.visible { display: flex; }
  #wt-voicematch .wt-vm-spark { font-size: 13px; line-height: 1; }
  #wt-voicematch .wt-vm-text { font-size: 11.5px; font-weight: 600; color: #5B21B6; }
  #wt-voicematch .wt-vm-pct { margin-left: auto; font-size: 11.5px; font-weight: 700; color: #4F46E5; }

  #wt-actions { display: none; gap: 6px; margin-top: 8px; }
  #wt-actions.visible { display: flex; }
  .wt-action {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E5E7EB;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151; cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
  }
  .wt-action:disabled { opacity: 0.5; cursor: default; }
  .wt-action.accept { border-color: #10B981; color: #10B981; }
  .wt-action.accept:hover:not(:disabled) { background: #ECFDF5; }
  .wt-action.regen { border-color: #C7D2FE; color: #4F46E5; }
  .wt-action.regen:hover:not(:disabled) { background: #EEF2FF; }
  .wt-action.reject { border-color: #EF4444; color: #EF4444; }
  .wt-action.reject:hover:not(:disabled) { background: #FEF2F2; }

  #wt-voice-panel { width: 280px; }
  .wt-vt { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 10px;
    letter-spacing: 0.04em; text-transform: uppercase; }
  .wt-otype-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; }
  .wt-otypes { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .wt-otype {
    padding: 3px 9px; border-radius: 9999px; border: 1.5px solid #E5E7EB;
    background: #fff; font-size: 11px; color: #374151; cursor: pointer; transition: all 0.1s;
  }
  .wt-otype.active { background: #4F46E5; color: #fff; border-color: #4F46E5; }
  #wt-record-btn {
    width: 100%; height: 32px; border-radius: 8px; border: none;
    background: #DC2626; color: #fff; cursor: pointer; margin-bottom: 10px;
    font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #wt-record-btn.recording { background: #7F1D1D; }
  #wt-record-btn:disabled  { opacity: 0.5; cursor: default; }
  #wt-voice-status { font-size: 11px; text-align: center; min-height: 14px; color: #6B7280; }
  #wt-voice-status.error { color: #EF4444; }
  #wt-voice-actions { display: none; gap: 6px; margin-top: 8px; }
  #wt-voice-actions.visible { display: flex; }
  .wt-va {
    flex: 1; height: 28px; border-radius: 8px; border: 1.5px solid #E5E7EB;
    background: #fff; font-size: 12px; font-weight: 500; color: #374151; cursor: pointer;
  }
  .wt-va.accept { border-color: #10B981; color: #10B981; }
  .wt-va.reject { border-color: #EF4444; color: #EF4444; }
`;

// ── Editor body access (SmartEditor iframe) ─────────────────────────────────────
function getEditorBody(): HTMLElement | null {
  const ife = document.querySelector(EDITOR_IFRAME_SEL) as HTMLIFrameElement | null;
  try {
    return ife?.contentDocument?.body ?? null;
  } catch {
    return null; // cross-origin (shouldn't happen on same tenant)
  }
}

function readCompose(): string {
  return (getEditorBody()?.innerText ?? '').trim();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writeCompose(text: string): void {
  const body = getEditorBody();
  if (!body) return;
  const html = text
    .split('\n')
    .map(line => (line.trim() === '' ? '<p><br></p>' : `<p>${escapeHtml(line)}</p>`))
    .join('');
  body.innerHTML = html;
  body.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── Main injection ─────────────────────────────────────────────────────────────
function inject(header: Element): void {
  if (header.hasAttribute(HOST_ATTR)) return;
  const sendBtn = findSendButton(header);
  if (!sendBtn) return;
  // Editor iframe must be ready before we let users rewrite into it
  if (!getEditorBody()) return;

  header.setAttribute(HOST_ATTR, '1');

  const host = document.createElement('span');
  const shadow = host.attachShadow({ mode: 'open' });

  let selectedTone: Tone | null = null;
  let lastRewriteId: string | null = null;
  let panelOpen = false;
  let voicePanelOpen = false;
  let selectedOutputType: VoiceOutputType = 'reply';
  let recognition: InstanceType<typeof webkitSpeechRecognition> | null = null;
  let recording = false;
  let transcript = '';
  let lastVoiceSessionId: string | null = null;
  let originalText = '';
  let originalVoiceText = '';

  shadow.innerHTML = `
    <style>${BASE_CSS}</style>

    <button id="wt-btn" title="Humanize with Writing Twin AI (Ctrl+Shift+H)">✨ Humanize</button>
    <button id="wt-mic-btn" title="Voice Twin — speak your email (Ctrl+Shift+V)">🎙</button>

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
      <div id="wt-voicematch">
        <span class="wt-vm-spark">✨</span>
        <span class="wt-vm-text">Sounds like you</span>
        <span class="wt-vm-pct" id="wt-vm-pct"></span>
      </div>
      <div id="wt-actions">
        <button class="wt-action accept" id="wt-accept">✓ Keep</button>
        <button class="wt-action regen" id="wt-regen">↻ Again</button>
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

  const btn        = shadow.getElementById('wt-btn')          as HTMLButtonElement;
  const micBtn     = shadow.getElementById('wt-mic-btn')      as HTMLButtonElement;
  const panel      = shadow.getElementById('wt-panel')        as HTMLDivElement;
  const voicePanel = shadow.getElementById('wt-voice-panel')  as HTMLDivElement;
  const rewriteBtn = shadow.getElementById('wt-rewrite')      as HTMLButtonElement;
  const statusEl   = shadow.getElementById('wt-status')       as HTMLDivElement;
  const limitEl    = shadow.getElementById('wt-limit')        as HTMLDivElement;
  const actionsEl  = shadow.getElementById('wt-actions')      as HTMLDivElement;
  const voicematchEl = shadow.getElementById('wt-voicematch') as HTMLDivElement;
  const vmPctEl    = shadow.getElementById('wt-vm-pct')       as HTMLSpanElement;
  const acceptBtn  = shadow.getElementById('wt-accept')       as HTMLButtonElement;
  const regenBtn   = shadow.getElementById('wt-regen')        as HTMLButtonElement;
  const rejectBtn  = shadow.getElementById('wt-reject')       as HTMLButtonElement;
  const recordBtn  = shadow.getElementById('wt-record-btn')   as HTMLButtonElement;
  const vStatusEl  = shadow.getElementById('wt-voice-status') as HTMLDivElement;
  const vActionsEl = shadow.getElementById('wt-voice-actions') as HTMLDivElement;
  const vKeepBtn   = shadow.getElementById('wt-va-keep')      as HTMLButtonElement;
  const vUndoBtn   = shadow.getElementById('wt-va-undo')      as HTMLButtonElement;

  // ── Tone selector ───────────────────────────────────────────────────────────
  shadow.querySelectorAll<HTMLButtonElement>('.wt-tone').forEach(tb => {
    tb.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-tone').forEach(b => b.classList.remove('active'));
      tb.classList.add('active');
      tb.style.background  = tb.dataset.color ?? '#4F46E5';
      tb.style.borderColor = tb.dataset.color ?? '#4F46E5';
      selectedTone = tb.dataset.tone as Tone;
      rewriteBtn.disabled = false;
      setStatus(''); limitEl.classList.remove('visible');
      actionsEl.classList.remove('visible');
      voicematchEl.classList.remove('visible');
    });
  });

  function preselectTone(tone: Tone): void {
    if (selectedTone) return;
    const tb = shadow.querySelector<HTMLButtonElement>(`.wt-tone[data-tone="${tone}"]`);
    if (!tb) return;
    shadow.querySelectorAll('.wt-tone').forEach(b => b.classList.remove('active'));
    tb.classList.add('active');
    tb.style.background = tb.dataset.color ?? '#4F46E5';
    tb.style.borderColor = tb.dataset.color ?? '#4F46E5';
    selectedTone = tone;
    rewriteBtn.disabled = false;
  }

  // ── Voice output type selector ──────────────────────────────────────────────
  shadow.querySelectorAll<HTMLButtonElement>('.wt-otype').forEach(ob => {
    ob.addEventListener('click', () => {
      shadow.querySelectorAll('.wt-otype').forEach(b => b.classList.remove('active'));
      ob.classList.add('active');
      selectedOutputType = ob.dataset.type as VoiceOutputType;
    });
  });

  // ── Panel toggles ───────────────────────────────────────────────────────────
  btn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    if (panelOpen) { voicePanelOpen = false; voicePanel.classList.remove('open'); }
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) {
      positionPanel(btn, panel);
      if (!selectedTone) preselectTone(detectContextTone());
    }
  });

  micBtn.addEventListener('click', () => {
    voicePanelOpen = !voicePanelOpen;
    if (voicePanelOpen) { panelOpen = false; panel.classList.remove('open'); }
    voicePanel.classList.toggle('open', voicePanelOpen);
    if (voicePanelOpen) positionPanel(micBtn, voicePanel);
  });

  document.addEventListener('click', (e) => {
    if (!host.contains(e.target as Node)) {
      panelOpen = false; panel.classList.remove('open');
      voicePanelOpen = false; voicePanel.classList.remove('open');
    }
  }, true);

  function positionPanel(anchor: HTMLElement, p: HTMLDivElement): void {
    const rect = anchor.getBoundingClientRect();
    const panelWidth = parseInt(p.style.width || '260');
    p.style.top  = `${rect.bottom + 6}px`;
    p.style.left = `${Math.min(rect.left, window.innerWidth - panelWidth - 20)}px`;
  }

  // ── Rewrite ─────────────────────────────────────────────────────────────────
  function showVoiceMatch(score: number | null | undefined): void {
    if (typeof score === 'number' && score > 0) {
      const pct = Math.round(score <= 1 ? score * 100 : score);
      vmPctEl.textContent = `${pct}% match`;
    } else {
      vmPctEl.textContent = '';
    }
    voicematchEl.classList.add('visible');
  }

  async function runRewrite(regen = false): Promise<void> {
    if (!selectedTone) return;
    const text = regen ? originalText : readCompose();
    if (!text) { setStatus('Write something first.', 'error'); return; }
    if (!regen) originalText = text;

    btn.disabled = true; rewriteBtn.disabled = true; regenBtn.disabled = true;
    setStatus(regen ? 'Trying another…' : 'Rewriting…');
    actionsEl.classList.remove('visible');
    voicematchEl.classList.remove('visible');

    try {
      const resp = await sendToBackground<{ result: RewriteResponse } | { error: string }>({
        type: 'HUMANIZE',
        payload: { text, tone: selectedTone },
      });
      if ('error' in resp) throw new Error(String(resp.error));
      lastRewriteId = resp.result.id;
      writeCompose(resp.result.output_text);
      setStatus('');
      showVoiceMatch(resp.result.quality_score);
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
      regenBtn.disabled = false;
    }
  }

  rewriteBtn.addEventListener('click', () => { void runRewrite(false); });
  regenBtn.addEventListener('click', () => { void runRewrite(true); });

  acceptBtn.addEventListener('click', () => {
    if (lastRewriteId) sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'accepted' } });
    actionsEl.classList.remove('visible');
    voicematchEl.classList.remove('visible');
    panelOpen = false; panel.classList.remove('open');
    setStatus('');
  });

  rejectBtn.addEventListener('click', () => {
    if (originalText) writeCompose(originalText);
    if (lastRewriteId) sendToBackground({ type: 'FEEDBACK', payload: { rewriteId: lastRewriteId, action: 'rejected' } });
    actionsEl.classList.remove('visible');
    voicematchEl.classList.remove('visible');
    setStatus('Reverted.', 'success');
    setTimeout(() => setStatus(''), 2000);
  });

  function setStatus(msg: string, cls = ''): void {
    statusEl.textContent = msg; statusEl.className = cls;
  }

  // ── Voice (browser speech recognition → transcript) ───────────────────────────
  recordBtn.addEventListener('click', async () => {
    if (!recording) await startRecording(); else stopRecording();
  });

  async function startRecording(): Promise<void> {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: typeof webkitSpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Speech recognition not supported in this browser.', 'error');
      return;
    }

    transcript = '';
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setVoiceStatus(`🎙 ${(transcript + interim).trim() || 'Listening…'}`);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') setVoiceStatus(`Mic error: ${e.error}`, 'error');
    };

    recognition.onend = () => {
      if (recording) recognition?.start(); // browser cut off — keep listening
    };

    try {
      recognition.start();
      recording = true;
      micBtn.classList.add('recording');
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏹ Stop recording';
      vActionsEl.classList.remove('visible');
      setTimeout(() => { if (recording) stopRecording(); }, 60_000);
    } catch {
      setVoiceStatus('Microphone access denied.', 'error');
    }
  }

  function stopRecording(): void {
    if (recognition && recording) {
      recording = false;
      recognition.onend = null;
      recognition.stop();
      recognition = null;
      micBtn.classList.remove('recording');
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🎙 Start recording';
      recordBtn.disabled = true;
      setVoiceStatus('Drafting…');
      void submitTranscript();
    }
  }

  async function submitTranscript(): Promise<void> {
    try {
      const text = transcript.trim();
      if (!text) {
        setVoiceStatus('Nothing recorded — try again.', 'error');
        recordBtn.disabled = false;
        return;
      }
      originalVoiceText = readCompose();

      const resp = await sendToBackground<{ result: VoiceDraftResponse } | { error: string }>({
        type: 'VOICE_DRAFT',
        payload: { transcript: text, outputType: selectedOutputType },
      });
      if ('error' in resp) throw new Error(String(resp.error));

      lastVoiceSessionId = resp.result.id;
      writeCompose(resp.result.draft);
      setVoiceStatus('Done ✓');
      vActionsEl.classList.add('visible');
    } catch (err) {
      setVoiceStatus(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      recordBtn.disabled = false;
    }
  }

  vKeepBtn.addEventListener('click', () => {
    if (lastVoiceSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastVoiceSessionId, accepted: true, editedDraft: null } });
    vActionsEl.classList.remove('visible');
    voicePanelOpen = false; voicePanel.classList.remove('open');
    setVoiceStatus('');
  });

  vUndoBtn.addEventListener('click', () => {
    if (originalVoiceText) writeCompose(originalVoiceText);
    if (lastVoiceSessionId) sendToBackground({ type: 'VOICE_FEEDBACK', payload: { sessionId: lastVoiceSessionId, accepted: false, editedDraft: null } });
    vActionsEl.classList.remove('visible');
    setVoiceStatus('Reverted.', 'success');
    setTimeout(() => setVoiceStatus(''), 2000);
  });

  function setVoiceStatus(msg: string, cls = ''): void {
    vStatusEl.textContent = msg; vStatusEl.className = cls;
  }

  // Insert our host right after the Send button in the header
  sendBtn.insertAdjacentElement('afterend', host);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function findSendButton(header: Element): Element | null {
  return Array.from(header.querySelectorAll('button'))
    .find(b => SEND_RE.test((b.textContent ?? '').trim())) ?? null;
}

function sendToBackground<T>(message: object, attempt = 0): Promise<T> {
  return new Promise((resolve, reject) => {
    const retry = () => {
      if (attempt === 0) {
        setTimeout(() => sendToBackground<T>(message, 1).then(resolve).catch(reject), 900);
      } else {
        reject(new Error('Extension restarted — please reload the page and try again.'));
      }
    };
    if (!chrome?.runtime?.sendMessage) { retry(); return; }
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime?.lastError) { retry(); } else { resolve(response); }
      });
    } catch {
      retry();
    }
  });
}

// ── Observer + polling ──────────────────────────────────────────────────────────
function tryInject(): void {
  const header = document.querySelector(HEADER_SEL);
  if (header && !header.hasAttribute(HOST_ATTR)) inject(header);
}

const observer = new MutationObserver(() => tryInject());
observer.observe(document.body, { childList: true, subtree: true });

// Polling fallback — the SmartEditor iframe body loads async after the header
setInterval(tryInject, 1000);
tryInject();

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
  const headerEl = document.querySelector(`[${HOST_ATTR}]`);
  if (!headerEl) return;
  const host = Array.from(headerEl.querySelectorAll('span')).find(c => c.shadowRoot) as HTMLElement | undefined;
  if (!host) return;

  if (e.key === 'H') {
    e.preventDefault();
    (host.shadowRoot?.getElementById('wt-btn') as HTMLButtonElement | null)?.click();
  }
  if (e.key === 'V') {
    e.preventDefault();
    (host.shadowRoot?.getElementById('wt-mic-btn') as HTMLButtonElement | null)?.click();
  }
});
