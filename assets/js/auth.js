document.addEventListener('DOMContentLoaded', () => {
    const USERS_KEY = 'novafaith-users';
    const SESSION_KEY = 'novafaith-session';
    // Pages autorisées après connexion (évite les redirections vers un site externe)
    const NEXT_PAGES = { 'index.html': '/index.html', 'detail.html': '/assets/includes/detail.html', 'orders.html': '/assets/includes/orders.html' };

    const $ = id => document.getElementById(id);
    const read = (key, fallback) => {
        try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
    };
    const write = (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    };
    const readUsers = () => { const u = read(USERS_KEY, []); return Array.isArray(u) ? u : []; };

    const nextPage = () => {
        const n = new URLSearchParams(location.search).get('next');
        return NEXT_PAGES[n] || '/index.html';
    };

    // Mot de passe : jamais stocké en clair (sel aléatoire + PBKDF2-SHA256)
    const secure = () => !!(window.crypto && crypto.subtle);
    const toB64 = bytes => btoa(String.fromCharCode(...bytes));
    const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const newSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));
    async function hashPassword(password, salt) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: fromB64(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
        return toB64(new Uint8Array(bits));
    }

    const NEED_SECURE = 'Open the site over https or localhost to use accounts.';

    // --- Affichage ---
    const forms = { login: $('login-form'), register: $('register-form') };
    const tabs = { login: $('tab-login'), register: $('tab-register') };

    function showForm(name) {
        for (const k of Object.keys(forms)) {
            forms[k].hidden = k !== name;
            tabs[k].classList.toggle('active', k === name);
            tabs[k].setAttribute('aria-selected', String(k === name));
        }
        $('login-error').textContent = '';
        $('register-error').textContent = '';
    }

    function render() {
        const session = read(SESSION_KEY, null);
        const logged = !!(session && session.email);
        $('auth-logged').hidden = !logged;
        $('auth-forms').hidden = logged;
        if (logged) {
            $('auth-welcome').textContent = 'Welcome, ' + session.name + '!';
            $('auth-email').textContent = session.email;
        }
    }

    function startSession(user) {
        write(SESSION_KEY, { name: user.name, email: user.email });
        window.location.href = nextPage();
    }

    tabs.login.addEventListener('click', () => showForm('login'));
    tabs.register.addEventListener('click', () => showForm('register'));

    document.querySelectorAll('.show-pw').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('form').querySelectorAll('input[data-pw]').forEach(i => { i.type = cb.checked ? 'text' : 'password'; });
        });
    });

    // --- Connexion ---
    forms.login.addEventListener('submit', async e => {
        e.preventDefault();
        const err = $('login-error');
        err.textContent = '';
        if (!secure()) { err.textContent = NEED_SECURE; return; }

        const email = $('login-email').value.trim().toLowerCase();
        const password = $('login-password').value;
        if (!/^\S+@\S+\.\S+$/.test(email) || !password) {
            err.textContent = 'Please enter your email and password.';
            return;
        }

        const user = readUsers().find(u => u.email === email);
        const fail = 'Incorrect email or password.';
        if (!user) { err.textContent = fail; return; }
        if (await hashPassword(password, user.salt) !== user.hash) { err.textContent = fail; return; }
        startSession(user);
    });

    // --- Création de compte ---
    forms.register.addEventListener('submit', async e => {
        e.preventDefault();
        const err = $('register-error');
        err.textContent = '';
        if (!secure()) { err.textContent = NEED_SECURE; return; }

        const name = $('reg-name').value.trim();
        const email = $('reg-email').value.trim().toLowerCase();
        const password = $('reg-password').value;
        const confirm = $('reg-confirm').value;

        if (!name) { err.textContent = 'Please enter your full name.'; return; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            err.textContent = 'The password needs at least 8 characters, with a letter and a number.';
            return;
        }
        if (password !== confirm) { err.textContent = 'The passwords do not match.'; return; }

        const users = readUsers();
        if (users.some(u => u.email === email)) {
            err.textContent = 'An account already exists with this email.';
            return;
        }

        const salt = newSalt();
        const user = {
            id: Date.now() + '-' + Math.floor(Math.random() * 1e6),
            name, email, salt,
            hash: await hashPassword(password, salt),
            createdAt: new Date().toISOString()
        };
        users.push(user);
        if (!write(USERS_KEY, users)) { err.textContent = 'Could not save the account in this browser.'; return; }
        startSession(user);
    });

    // --- Déconnexion ---
    $('logout-btn').addEventListener('click', () => {
        try { localStorage.removeItem(SESSION_KEY); } catch {}
        render();
        showForm('login');
    });

    showForm(location.hash === '#register' ? 'register' : 'login');
    render();
});