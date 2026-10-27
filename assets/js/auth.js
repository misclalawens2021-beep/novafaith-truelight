document.addEventListener('DOMContentLoaded', () => {
    // Identifiants Google / Facebook : renseignés une fois par le développeur dans config.js
    const CFG = window.NF_CONFIG || {};
    const GOOGLE_CLIENT_ID = CFG.GOOGLE_CLIENT_ID || '';
    const FACEBOOK_APP_ID = CFG.FACEBOOK_APP_ID || '';

    const USERS_KEY = 'novafaith-users';
    const SESSION_KEY = 'novafaith-session';
    // Pages autorisées après connexion (évite les redirections vers un site externe)
    const NEXT_PAGES = { 'index.html': '/index.html', 'detail.html': '/assets/includes/detail.html', 'orders.html': '/assets/includes/orders.html' };

    const $ = id => document.getElementById(id);
    const t = NF.t;
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

    // Les messages d'erreur sont mémorisés par clé pour être retraduits si on change de langue
    const errors = { 'login-error': null, 'register-error': null, 'social-error': null };
    function setError(id, key, vars) {
        errors[id] = key ? { key, vars } : null;
        $(id).textContent = key ? t(key, vars) : '';
    }
    const refreshErrors = () => Object.keys(errors).forEach(id => {
        $(id).textContent = errors[id] ? t(errors[id].key, errors[id].vars) : '';
    });

    // --- Affichage ---
    const forms = { login: $('login-form'), register: $('register-form') };
    const tabs = { login: $('tab-login'), register: $('tab-register') };

    function showForm(name) {
        for (const k of Object.keys(forms)) {
            forms[k].hidden = k !== name;
            tabs[k].classList.toggle('active', k === name);
            tabs[k].setAttribute('aria-selected', String(k === name));
        }
        Object.keys(errors).forEach(id => setError(id, null));
    }

    function render() {
        const session = NF.session();
        $('auth-logged').hidden = !session;
        $('auth-forms').hidden = !!session;
        if (session) {
            $('auth-welcome').textContent = t('auth.welcome', { name: session.name });
            $('auth-email').textContent = session.email;
        }
    }

    function startSession(user) {
        write(SESSION_KEY, { name: user.name, email: user.email });
        NF.mergeGuestCart(user.email); // le panier fait avant la connexion rejoint celui du compte
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
        setError('login-error', null);
        if (!secure()) return setError('login-error', 'auth.err.secure');

        const email = $('login-email').value.trim().toLowerCase();
        const password = $('login-password').value;
        if (!/^\S+@\S+\.\S+$/.test(email) || !password) return setError('login-error', 'auth.err.cred');

        const user = readUsers().find(u => u.email === email);
        // un compte créé via Google/Facebook n'a pas de mot de passe
        if (!user || !user.hash) return setError('login-error', 'auth.err.wrong');
        if (await hashPassword(password, user.salt) !== user.hash) return setError('login-error', 'auth.err.wrong');
        startSession(user);
    });

    // --- Création de compte ---
    forms.register.addEventListener('submit', async e => {
        e.preventDefault();
        setError('register-error', null);
        if (!secure()) return setError('register-error', 'auth.err.secure');

        const name = $('reg-name').value.trim();
        const email = $('reg-email').value.trim().toLowerCase();
        const password = $('reg-password').value;
        const confirm = $('reg-confirm').value;

        if (!name) return setError('register-error', 'auth.err.name');
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError('register-error', 'err.email');
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError('register-error', 'auth.err.pw');
        if (password !== confirm) return setError('register-error', 'auth.err.match');

        const users = readUsers();
        if (users.some(u => u.email === email)) return setError('register-error', 'auth.err.exists');

        const salt = newSalt();
        const user = {
            id: Date.now() + '-' + Math.floor(Math.random() * 1e6),
            name, email, salt,
            hash: await hashPassword(password, salt),
            createdAt: new Date().toISOString()
        };
        users.push(user);
        if (!write(USERS_KEY, users)) return setError('register-error', 'auth.err.save');
        startSession(user);
    });

    // --- Connexion via un fournisseur (Google, Facebook) ---
    function socialSignIn(profile, provider) {
        const email = String(profile.email || '').trim().toLowerCase();
        if (!email) return setError('social-error', 'auth.err.socialFail');
        const users = readUsers();
        let user = users.find(u => u.email === email);
        if (!user) {
            user = { id: Date.now() + '-' + Math.floor(Math.random() * 1e6), name: profile.name || email.split('@')[0], email, provider, createdAt: new Date().toISOString() };
            users.push(user);
            if (!write(USERS_KEY, users)) return setError('social-error', 'auth.err.save');
        }
        startSession(user);
    }

    const loadScript = src => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });

    // Google : les scripts sont chargés dès l'ouverture de la page pour que le clic ouvre bien la fenêtre
    let googleClient = null;
    if (GOOGLE_CLIENT_ID) {
        loadScript('https://accounts.google.com/gsi/client').then(() => {
            googleClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'openid email profile',
                callback: async resp => {
                    if (resp.error) return setError('social-error', 'auth.err.socialFail');
                    try {
                        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + resp.access_token } });
                        socialSignIn(await r.json(), 'google');
                    } catch { setError('social-error', 'auth.err.socialFail'); }
                }
            });
        }).catch(() => {});
    }
    $('google-btn').addEventListener('click', () => {
        setError('social-error', null);
        if (!GOOGLE_CLIENT_ID) return setError('social-error', 'auth.err.social', { p: 'Google' });
        if (!googleClient) return setError('social-error', 'auth.err.socialFail');
        googleClient.requestAccessToken();
    });

    let facebookReady = false;
    if (FACEBOOK_APP_ID) {
        loadScript('https://connect.facebook.net/en_US/sdk.js').then(() => {
            FB.init({ appId: FACEBOOK_APP_ID, version: 'v19.0', cookie: false, xfbml: false });
            facebookReady = true;
        }).catch(() => {});
    }
    $('facebook-btn').addEventListener('click', () => {
        setError('social-error', null);
        if (!FACEBOOK_APP_ID) return setError('social-error', 'auth.err.social', { p: 'Facebook' });
        if (!facebookReady) return setError('social-error', 'auth.err.socialFail');
        FB.login(r => {
            if (!r.authResponse) return setError('social-error', 'auth.err.socialFail');
            FB.api('/me', { fields: 'name,email' }, u => (u && u.email) ? socialSignIn(u, 'facebook') : setError('social-error', 'auth.err.socialFail'));
        }, { scope: 'public_profile,email' });
    });

    // --- Déconnexion ---
    $('logout-btn').addEventListener('click', () => {
        try { localStorage.removeItem(SESSION_KEY); } catch {}
        render();
        showForm('login');
    });

    document.addEventListener('nf:lang', () => { render(); refreshErrors(); });

    showForm(location.hash === '#register' ? 'register' : 'login');
    render();
});