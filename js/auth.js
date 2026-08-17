(function () {
  'use strict';

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
  }
  function hideError(el) {
    if (!el) return;
    el.classList.remove('show');
  }

  async function fetchMe() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null; // API not reachable (e.g. site opened without the Node server running)
    }
  }

  // Reflect auth state on every page: toggles the LOGIN vs MY ACCOUNT nav links.
  (async function reflectNavAuthState() {
    const user = await fetchMe();
    if (user) document.body.classList.add('is-authed');
  })();

  var logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = 'index.html';
    });
  }

  // ---- signup.html ----
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    var signupError = document.getElementById('signup-error');
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError(signupError);

      var name = document.getElementById('su-name').value.trim();
      var email = document.getElementById('su-email').value.trim();
      var password = document.getElementById('su-password').value;
      var confirm = document.getElementById('su-confirm').value;

      if (password.length < 8) return showError(signupError, 'Password must be at least 8 characters.');
      if (password !== confirm) return showError(signupError, 'Passwords do not match.');

      var submitBtn = signupForm.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, password: password })
        });
        const data = await res.json();
        if (!res.ok) return showError(signupError, data.error || 'Could not create your account.');
        window.location.href = 'account.html';
      } catch {
        showError(signupError, 'Could not reach the server. Is it running?');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ---- login.html ----
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    var loginError = document.getElementById('login-error');
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError(loginError);

      var email = document.getElementById('li-email').value.trim();
      var password = document.getElementById('li-password').value;

      var submitBtn = loginForm.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        const data = await res.json();
        if (!res.ok) return showError(loginError, data.error || 'Could not sign you in.');
        var params = new URLSearchParams(window.location.search);
        window.location.href = params.get('next') || 'account.html';
      } catch {
        showError(loginError, 'Could not reach the server. Is it running?');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ---- account.html ----
  var accountRoot = document.getElementById('account-root');
  if (accountRoot) {
    (async function loadAccount() {
      const user = await fetchMe();
      if (!user) {
        window.location.href = 'login.html?next=account.html';
        return;
      }
      document.getElementById('account-name').textContent = user.name;
      document.getElementById('account-email').textContent = user.email;

      const tbody = document.getElementById('quotes-body');
      const emptyState = document.getElementById('quotes-empty');
      const table = document.getElementById('quotes-table');
      try {
        const res = await fetch('/api/quotes/mine', { credentials: 'same-origin' });
        const data = await res.json();
        const quotes = (data && data.quotes) || [];
        if (!quotes.length) {
          emptyState.style.display = 'block';
          table.style.display = 'none';
        } else {
          emptyState.style.display = 'none';
          table.style.display = 'table';
          tbody.innerHTML = quotes.map(function (q) {
            return '<tr>' +
              '<td>' + (q.created_at || '') + '</td>' +
              '<td>' + (q.product || '—') + '</td>' +
              '<td>' + (q.city || '—') + '</td>' +
              '<td>' + (q.message ? q.message : '—') + '</td>' +
              '</tr>';
          }).join('');
        }
      } catch {
        emptyState.textContent = 'Could not load your quote history right now.';
        emptyState.style.display = 'block';
        table.style.display = 'none';
      }
    })();
  }
})();
