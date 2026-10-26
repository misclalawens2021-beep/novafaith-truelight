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
            window.location.href = 'detail.html';
        });
    });

    // 2. Menu hamburger (mobile)
    const hamburger = document.getElementById('hamburger');
    const navOverlay = document.getElementById('nav-overlay');

    if (hamburger && navOverlay) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navOverlay.classList.toggle('active');
        });

        // Fermer le menu après avoir cliqué sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navOverlay.classList.remove('active');
            });
        });
    }

    // 3. Formulaire de contact (simulation d'envoi)
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = this.querySelector('button');
            const originalText = btn.innerText;

            btn.innerText = "SENDING...";
            btn.style.opacity = "0.7";
            btn.disabled = true;

            /* Version avec ton serveur Flask (à utiliser à la place du setTimeout ci-dessous) :
            fetch('http://127.0.0.1:5000/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    message: document.getElementById('message').value
                })
            })
            .then(response => response.json())
            .then(data => { ...afficher succès ou erreur selon data.status... });
            */

            setTimeout(() => {
                formStatus.innerHTML = "Message sent. God bless you!";
                formStatus.style.color = "#ffffff";
                formStatus.style.marginTop = "20px";

                btn.innerText = "SENT ✅";
                btn.style.backgroundColor = "#4CAF50";
                btn.style.color = "white";

                this.reset();

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = "white";
                    btn.style.color = "black";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                    formStatus.innerHTML = "";
                }, 3000);
            }, 2000);
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
});