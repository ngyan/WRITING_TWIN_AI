// Popup logic — login / logout / account display

const viewLogin = document.getElementById('view-login')!;
const viewLoggedIn = document.getElementById('view-logged-in')!;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const loginError = document.getElementById('login-error')!;
const accountEmail = document.getElementById('account-email')!;
const avatarEl = document.getElementById('avatar-initial')!;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

function showView(loggedIn: boolean, email?: string): void {
  viewLogin.classList.toggle('hidden', loggedIn);
  viewLoggedIn.classList.toggle('hidden', !loggedIn);

  if (loggedIn && email) {
    accountEmail.textContent = email;
    avatarEl.textContent = email[0].toUpperCase();
  }
}

// Check auth state on popup open
chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (resp) => {
  if (resp?.authenticated && resp.tokens?.email) {
    showView(true, resp.tokens.email);
  } else {
    showView(false);
  }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
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
      showView(true, email);
    }
  });
});

// Logout
logoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
    showView(false);
  });
});
