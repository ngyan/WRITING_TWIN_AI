// Popup logic — login / register / logout / DNA setup

const viewLogin = document.getElementById('view-login')!;
const viewRegister = document.getElementById('view-register')!;
const viewDnaSetup = document.getElementById('view-dna-setup')!;
const viewLoggedIn = document.getElementById('view-logged-in')!;

const googleLoginBtn = document.getElementById('google-login-btn') as HTMLButtonElement;
const googleLoginError = document.getElementById('google-login-error')!;
const googleRegisterBtn = document.getElementById('google-register-btn') as HTMLButtonElement;
const googleRegisterError = document.getElementById('google-register-error')!;

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const loginError = document.getElementById('login-error')!;

const registerForm = document.getElementById('register-form') as HTMLFormElement;
const registerBtn = document.getElementById('register-btn') as HTMLButtonElement;
const registerError = document.getElementById('register-error')!;

const dnaTextarea = document.getElementById('dna-textarea') as HTMLTextAreaElement;
const dnaSampleCount = document.getElementById('dna-sample-count')!;
const dnaSubmitBtn = document.getElementById('dna-submit-btn') as HTMLButtonElement;
const dnaSkipBtn = document.getElementById('dna-skip-btn') as HTMLButtonElement;
const dnaError = document.getElementById('dna-error')!;
const dnaSuccess = document.getElementById('dna-success')!;

const accountEmail = document.getElementById('account-email')!;
const avatarEl = document.getElementById('avatar-initial')!;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const dnaPromptBox = document.getElementById('dna-prompt-box')!;
const dnaTrainedBox = document.getElementById('dna-trained-box')!;
const setupDnaBtn = document.getElementById('setup-dna-btn') as HTMLButtonElement;

type View = 'login' | 'register' | 'dna-setup' | 'logged-in';

function showView(view: View): void {
  viewLogin.classList.toggle('hidden', view !== 'login');
  viewRegister.classList.toggle('hidden', view !== 'register');
  viewDnaSetup.classList.toggle('hidden', view !== 'dna-setup');
  viewLoggedIn.classList.toggle('hidden', view !== 'logged-in');
}

function showLoggedIn(email: string, hasDna: boolean): void {
  accountEmail.textContent = email;
  avatarEl.textContent = email[0].toUpperCase();
  dnaPromptBox.classList.toggle('hidden', hasDna);
  dnaTrainedBox.classList.toggle('hidden', !hasDna);
  showView('logged-in');
}

function parseSamples(raw: string): string[] {
  return raw
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);
}

// Update sample count label as user types
dnaTextarea.addEventListener('input', () => {
  const count = parseSamples(dnaTextarea.value).length;
  dnaSampleCount.textContent = count > 0 ? `${count} sample${count !== 1 ? 's' : ''} detected` : '';
});

// Check auth state on popup open
chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (resp) => {
  if (!resp?.authenticated || !resp.tokens?.email) {
    showView('login');
    return;
  }
  const email: string = resp.tokens.email;
  // Check DNA status
  chrome.runtime.sendMessage({ type: 'GET_DNA_STATUS' }, (dnaResp) => {
    const profile = dnaResp?.dnaProfile;
    const hasDna = profile !== null && profile !== undefined && profile.extraction_status !== undefined;
    showLoggedIn(email, hasDna);
  });
});

// Login form
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value;

  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in…';

  chrome.runtime.sendMessage({ type: 'LOGIN', payload: { email, password } }, (resp) => {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log in';
    if (resp?.error) {
      loginError.textContent = resp.error;
    } else if (resp?.success) {
      chrome.runtime.sendMessage({ type: 'GET_DNA_STATUS' }, (dnaResp) => {
        const profile = dnaResp?.dnaProfile;
        const hasDna = profile !== null && profile !== undefined && profile.extraction_status !== undefined;
        showLoggedIn(email, hasDna);
      });
    }
  });
});

// Register form
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('reg-password') as HTMLInputElement).value;

  if (password.length < 8) {
    registerError.textContent = 'Password must be at least 8 characters.';
    return;
  }

  registerError.textContent = '';
  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account…';

  chrome.runtime.sendMessage({ type: 'REGISTER', payload: { email, password } }, (resp) => {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create account';
    if (resp?.error) {
      registerError.textContent = resp.error;
    } else if (resp?.success) {
      // New user — go straight to DNA setup
      accountEmail.textContent = email;
      avatarEl.textContent = email[0].toUpperCase();
      showView('dna-setup');
    }
  });
});

// DNA setup submit
dnaSubmitBtn.addEventListener('click', () => {
  const samples = parseSamples(dnaTextarea.value);
  if (samples.length === 0) {
    dnaError.textContent = 'Paste at least one writing sample (10+ characters).';
    return;
  }

  dnaError.textContent = '';
  dnaSubmitBtn.disabled = true;
  dnaSubmitBtn.textContent = 'Training…';

  chrome.runtime.sendMessage({ type: 'SUBMIT_DNA', payload: { samples } }, (resp) => {
    dnaSubmitBtn.disabled = false;
    dnaSubmitBtn.textContent = 'Train Writing Twin';
    if (resp?.error) {
      dnaError.textContent = resp.error;
    } else if (resp?.success) {
      dnaSuccess.classList.remove('hidden');
      dnaSubmitBtn.classList.add('hidden');
      dnaSkipBtn.textContent = 'Done';
    }
  });
});

// DNA skip / done
dnaSkipBtn.addEventListener('click', () => {
  const email = accountEmail.textContent || '';
  const trainingStarted = !dnaSuccess.classList.contains('hidden');
  showLoggedIn(email, trainingStarted);
});

// Setup DNA from logged-in view
setupDnaBtn.addEventListener('click', () => {
  dnaTextarea.value = '';
  dnaSampleCount.textContent = '';
  dnaError.textContent = '';
  dnaSuccess.classList.add('hidden');
  dnaSubmitBtn.classList.remove('hidden');
  dnaSkipBtn.textContent = 'Skip for now';
  showView('dna-setup');
});

function handleGoogleAuth(errorEl: HTMLElement, btn: HTMLButtonElement): void {
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Connecting…';

  chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH_EXTENSION' }, (resp) => {
    btn.disabled = false;
    btn.textContent = 'Continue with Google';
    if (resp?.error) {
      errorEl.textContent = resp.error;
    } else if (resp?.success) {
      const email = resp.tokens?.email || '';
      chrome.runtime.sendMessage({ type: 'GET_DNA_STATUS' }, (dnaResp) => {
        const profile = dnaResp?.dnaProfile;
        const hasDna = profile !== null && profile !== undefined && profile.extraction_status !== undefined;
        if (!hasDna) {
          accountEmail.textContent = email;
          avatarEl.textContent = email ? email[0].toUpperCase() : '?';
          showView('dna-setup');
        } else {
          showLoggedIn(email, hasDna);
        }
      });
    }
  });
}

googleLoginBtn.addEventListener('click', () => handleGoogleAuth(googleLoginError, googleLoginBtn));
googleRegisterBtn.addEventListener('click', () => handleGoogleAuth(googleRegisterError, googleRegisterBtn));

// View switches
document.getElementById('go-register')!.addEventListener('click', (e) => {
  e.preventDefault();
  showView('register');
});
document.getElementById('go-login')!.addEventListener('click', (e) => {
  e.preventDefault();
  showView('login');
});

// Logout
logoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
    showView('login');
  });
});
