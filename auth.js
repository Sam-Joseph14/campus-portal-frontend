/**
 * Campus Smart Service Portal — auth.js
 * ─────────────────────────────────────────
 * Complete authentication system connecting to backend API:
 *  • Signup  → API register → redirect to login
 *  • Login   → API login → validate → save session token → redirect to dashboard
 *  • Logout  → clear session token → redirect to index
 *  • Toggle  → password visibility
 */

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
var SESSION_KEY  = 'campusLoggedInUser';
var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000/api' 
    : 'https://campus-portal-api-qqj6.onrender.com/api'; // Live Render backend

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function getLoggedInUser() {
    var data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

function setLoggedInUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ═══════════════════════════════════════
// ERROR / SUCCESS DISPLAY
// ═══════════════════════════════════════
function showError(boxId, textId, message) {
    var box = document.getElementById(boxId);
    var txt = document.getElementById(textId);
    if (!box || !txt) return;
    txt.textContent = message;
    box.style.display = 'flex';
    box.classList.remove('shake');
    void box.offsetWidth;
    box.classList.add('shake');
}

function hideError(boxId) {
    var box = document.getElementById(boxId);
    if (box) box.style.display = 'none';
}

function showSuccess(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

// ═══════════════════════════════════════
// PASSWORD TOGGLE
// ═══════════════════════════════════════
function togglePassword(inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

// ═══════════════════════════════════════
// SIGNUP HANDLER (Using API)
// ═══════════════════════════════════════
var signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('signupError');

        var name     = document.getElementById('signupName').value.trim();
        var email    = document.getElementById('signupEmail').value.trim().toLowerCase();
        var password = document.getElementById('signupPassword').value;
        var confirm  = document.getElementById('signupConfirm').value;

        // Validation
        if (!name || !email || !password || !confirm) {
            showError('signupError', 'signupErrorText', 'Please fill in all fields.');
            return;
        }
        if (password.length < 6) {
            showError('signupError', 'signupErrorText', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            showError('signupError', 'signupErrorText', 'Passwords do not match.');
            return;
        }

        var btn = document.getElementById('signupBtn');
        var originalBtnText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-text">Creating Account...</span>';
        btn.style.pointerEvents = 'none';

        try {
            // API Call
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account.');
            }

            // Show success, hide form elements
            signupForm.style.display = 'none';
            var divider = document.querySelector('.auth-divider');
            var switchP = document.querySelector('.auth-switch');
            if (divider) divider.style.display = 'none';
            if (switchP) switchP.style.display = 'none';
            showSuccess('signupSuccess');

            // Redirect to login
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 2000);

        } catch (err) {
            showError('signupError', 'signupErrorText', err.message);
            btn.innerHTML = originalBtnText;
            btn.style.pointerEvents = 'auto';
        }
    });
}

// ═══════════════════════════════════════
// LOGIN HANDLER (Using API)
// ═══════════════════════════════════════
var loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('loginError');

        var email    = document.getElementById('loginEmail').value.trim().toLowerCase();
        var password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showError('loginError', 'loginErrorText', 'Please enter both email and password.');
            return;
        }

        var btn = document.getElementById('loginBtn');
        var originalBtnText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-text">Logging in...</span>';
        btn.style.pointerEvents = 'none';

        try {
            // API Call
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid email or password.');
            }

            // Set session
            setLoggedInUser({ name: data.user.name, email: data.user.email, token: data.token });

            // Visual feedback
            btn.innerHTML = '<span class="btn-text">✓ Welcome!</span>';
            btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
            btn.style.boxShadow = '0 0 25px rgba(16,185,129,0.4)';

            // Redirect to dashboard
            setTimeout(function () {
                window.location.href = 'dashboard.html';
            }, 1200);

        } catch (err) {
            showError('loginError', 'loginErrorText', err.message);
            btn.innerHTML = originalBtnText;
            btn.style.pointerEvents = 'auto';
        }
    });
}

// ═══════════════════════════════════════
// LOGOUT HANDLER
// ═══════════════════════════════════════
var logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        clearSession();
        window.location.href = 'index.html';
    });
}

var logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        clearSession();
        window.location.href = 'index.html';
    });
}

// ═══════════════════════════════════════
// NAVBAR SCROLL (Home Page)
// ═══════════════════════════════════════
var navbar = document.getElementById('mainNav');
if (navbar && !navbar.classList.contains('scrolled')) {
    window.addEventListener('scroll', function () {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}
