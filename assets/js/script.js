document.addEventListener('DOMContentLoaded', () => {
    // 1. Panier : stocké dans le navigateur, puis redirection vers la page de paiement
    const CART_KEY = 'novafaith-cart';
    const readCart = () => {
        try {
            const c = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(c) ? c : [];
        } catch { return []; }
    };
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) cartBadge.textContent = readCart().reduce((n, i) => n + (i.qty || 0), 0);

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const { id, name, price, img } = button.dataset;
            const cart = readCart();
            const item = cart.find(i => i.id === id);
            if (item) item.qty++;
            else cart.push({ id, name, price: parseFloat(price), img, qty: 1 });
            try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
            window.location.href = '/assets/includes/detail.html';
        });
    });

    // 2. Menu hamburger (mobile)
    const hamburger = document.getElementById('hamburger');
    const navOverlay = document.getElementById('nav-overlay');

    if (hamburger && navOverlay) {
        const setMenu = open => {
            hamburger.classList.toggle('active', open);
            navOverlay.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
        };
        const toggleMenu = () => setMenu(!navOverlay.classList.contains('active'));

        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

        // Fermer le menu après avoir cliqué sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });
    }

    // 3. Formulaire de contact (envoi réel via Formspree)
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm && formStatus) {
        const setStatus = (msg, ok) => {
            formStatus.textContent = msg;
            formStatus.style.color = ok ? '#ffffff' : '#ff8a80';
            formStatus.style.marginTop = '20px';
        };

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = this.elements['name'].value.trim();
            const email = this.elements['email'].value.trim();
            const message = this.elements['message'].value.trim();

            if (!name || !message) return setStatus('Please fill in all the fields.', false);
            if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus('Please enter a valid email address.', false);
            if (this.elements['_gotcha'] && this.elements['_gotcha'].value) return; // anti-spam : un robot a rempli le piège

            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'SENDING...';
            btn.style.opacity = '0.7';
            btn.disabled = true;
            formStatus.textContent = '';

            try {
                const res = await fetch(this.action, {
                    method: 'POST',
                    body: new FormData(this),
                    headers: { Accept: 'application/json' }
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);

                setStatus('Message sent. God bless you!', true);
                btn.innerText = 'SENT ✅';
                btn.style.backgroundColor = '#4CAF50';
                btn.style.color = 'white';
                this.reset();
            } catch {
                setStatus('Something went wrong. Please try again in a moment.', false);
                btn.innerText = 'ERROR';
                btn.style.backgroundColor = '#e53935';
                btn.style.color = 'white';
            }

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = 'white';
                btn.style.color = 'black';
                btn.style.opacity = '1';
                btn.disabled = false;
                formStatus.textContent = '';
            }, 4000);
        });
    }

    // 4. Bouton "Retour en haut" + barre de progression
    const backToTopBtn = document.getElementById('backToTop');
    const progressBar = document.getElementById('myBar');

    window.addEventListener('scroll', () => {
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('show', window.scrollY > 300);
        }

        if (progressBar) {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progressBar.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + "%";
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mise à jour de l'année dans le footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }


    // 5. Lien actif dans la navbar (selon la section visible)
    const navAnchors = document.querySelectorAll('.nav-inline a[href^="#"]');
    const sections = [...navAnchors].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (sections.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-40% 0px -50% 0px' });
        sections.forEach(sec => observer.observe(sec));
    }

    // 6. Diaporama (auto, points, swipe)
    const slider = document.getElementById('about-slider');
    if (slider) {
        const slides = [...slider.querySelectorAll('.slide')];
        const dotsBox = slider.querySelector('.slider-dots');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let index = 0, timer = null, touchX = null;

        const go = i => {
            index = (i + slides.length) % slides.length;
            slides.forEach((s, k) => s.classList.toggle('active', k === index));
            dots.forEach((d, k) => d.classList.toggle('active', k === index));
        };
        const stop = () => clearInterval(timer);
        const start = () => { stop(); if (slides.length > 1 && !reduceMotion) timer = setInterval(() => go(index + 1), 5000); };

        const dots = slides.map((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-label', 'Image ' + (i + 1));
            b.addEventListener('click', () => { go(i); start(); });
            dotsBox.appendChild(b);
            return b;
        });


        if (slides.length < 2) dotsBox.hidden = true;

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        slider.addEventListener('focusin', stop);
        slider.addEventListener('focusout', start);

        slider.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; stop(); }, { passive: true });
        slider.addEventListener('touchend', e => {
            if (touchX !== null) {
                const dx = e.changedTouches[0].clientX - touchX;
                if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
            }
            touchX = null;
            start();
        });

        go(0);
        start();
    }

    // 7. Compte : affiche le prénom dans la navbar si l'utilisateur est connecté
    const accountLabel = document.getElementById('account-label');
    if (accountLabel) {
        try {
            const session = JSON.parse(localStorage.getItem('novafaith-session'));
            if (session && session.name) accountLabel.textContent = session.name.split(' ')[0];
        } catch {}
    }

    // 8. Page courante : met en évidence son lien dans la navbar
    document.querySelectorAll('.nav-inline a').forEach(a => {
        if (a.pathname === location.pathname) a.classList.add('active');
    });
});