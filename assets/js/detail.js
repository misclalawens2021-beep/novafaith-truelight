document.addEventListener('DOMContentLoaded', () => {
    // Il faut un compte pour commander : sinon page d'authentification
    const session = NF.session();
    if (!session) {
        window.location.replace('/assets/includes/auth.html?next=detail.html');
        return;
    }

    const FREE_SHIPPING_FROM = 100; // livraison offerte dès 100 €
    const SHIPPING_FEE = 4.9;

    const $ = id => document.getElementById(id);
    const t = NF.t;
    const euro = n => n.toFixed(2) + ' €';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // Panier propre à ce compte (les autres comptes ne le voient pas)
    const cartKey = NF.cartKey();
    let cart = NF.readCart(cartKey).filter(i => i && i.qty > 0 && isFinite(i.price));
    const save = () => NF.saveCart(cart, cartKey);

    let catalog = {}; // id produit -> { colors: [{ id, name, hex, img }] }, lu dans collection.html

    const totals = () => {
        const items = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const ship = items >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
        return { items, ship };
    };

    function render() {
        const empty = cart.length === 0;
        $('empty-cart').hidden = !empty;
        $('checkout-layout').hidden = empty || !$('confirmation').hidden;
        if (empty) return;

        $('cart-items').innerHTML = cart.map((i, idx) => {
            const colors = (catalog[i.id] && catalog[i.id].colors) || [];
            const name = i.color ? NF.colorName(i.color, i.colorName) : '';
            const label = i.color
                ? `<span class="cart-color-name"><i class="dot" style="--c:${esc(i.hex || '#999')}"></i>${esc(name)}</span>` : '';
            const swatches = colors.length > 1
                ? `<div class="cart-colors" role="radiogroup" aria-label="${esc(t('co.color'))}">` + colors.map(c => {
                    const cn = NF.colorName(c.id, c.name);
                    return `<button type="button" class="swatch${c.id === i.color ? ' active' : ''}" role="radio" aria-checked="${c.id === i.color}" data-act="color" data-i="${idx}" data-color="${esc(c.id)}" title="${esc(cn)}" aria-label="${esc(cn)}" style="--c:${esc(c.hex)}"></button>`;
                }).join('') + '</div>' : '';
            return `
            <div class="cart-row">
                <div class="zoom-box"><img src="${esc(i.img)}" alt="${esc(i.name)}"></div>
                <div class="cart-info">
                    <strong>${esc(i.name)}</strong>
                    ${label}
                    <span>${euro(i.price)}</span>
                    ${swatches}
                </div>
                <div class="qty">
                    <button type="button" data-act="dec" data-i="${idx}" aria-label="-">&minus;</button>
                    <span>${i.qty}</span>
                    <button type="button" data-act="inc" data-i="${idx}" aria-label="+">+</button>
                </div>
                <button type="button" class="remove" data-act="del" data-i="${idx}">${t('co.remove')}</button>
            </div>`;
        }).join('');

        const { items, ship } = totals();
        $('sum-items').textContent = euro(items);
        $('sum-ship').textContent = ship === 0 ? t('co.free') : euro(ship);
        $('sum-total').textContent = euro(items + ship);
        $('ship-note').textContent = ship === 0
            ? t('co.freeOk')
            : t('co.freeFrom', { min: euro(FREE_SHIPPING_FROM), left: euro(FREE_SHIPPING_FROM - items) });
    }

    // Nom, prix, couleurs et IMAGES viennent de collection.html : on les change là-bas, le panier suit
    async function syncWithCollection() {
        try {
            const res = await fetch('/assets/includes/collection.html', { cache: 'no-cache' });
            if (!res.ok) return;
            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            const cat = {};
            doc.querySelectorAll('.product-card').forEach(card => {
                const b = card.querySelector('.add-to-cart');
                if (!b) return;
                const img = card.querySelector('.product-img-container img');
                cat[b.dataset.id] = {
                    name: b.dataset.name,
                    price: parseFloat(b.dataset.price),
                    img: img ? img.getAttribute('src') : '',
                    colors: [...card.querySelectorAll('.swatch')].map(s => ({ id: s.dataset.color, name: s.dataset.name, hex: s.dataset.hex, img: s.dataset.img }))
                };
            });
            catalog = cat;
            cart.forEach(item => {
                const p = cat[item.id];
                if (!p) return;
                if (isFinite(p.price)) item.price = p.price;
                item.name = p.name;
                if (!item.color && p.colors.length) item.color = p.colors[0].id;   // ancien panier sans couleur
                const c = p.colors.find(x => x.id === item.color);
                if (c) { item.colorName = c.name; item.hex = c.hex; item.img = c.img || item.img; }
                else if (p.img && !item.color) item.img = p.img;
            });
            save();
            render();
        } catch {}
    }

    $('cart-items').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const i = +b.dataset.i;
        const item = cart[i];
        if (b.dataset.act === 'inc') item.qty++;
        if (b.dataset.act === 'dec') item.qty = Math.max(1, item.qty - 1);
        if (b.dataset.act === 'del') cart.splice(i, 1);
        if (b.dataset.act === 'color') {
            const c = ((catalog[item.id] || {}).colors || []).find(x => x.id === b.dataset.color);
            if (c) {
                Object.assign(item, { color: c.id, colorName: c.name, hex: c.hex, img: c.img || item.img });
                const twin = cart.find((o, k) => k !== i && o.id === item.id && o.color === c.id);
                if (twin) { twin.qty += item.qty; cart.splice(i, 1); }   // même produit, même couleur : on regroupe
            }
        }
        save();
        render();
    });

    // Zoom au survol : l'image grossit autour du pointeur de la souris
    const zoomBox = e => e.target.closest('.zoom-box');
    $('cart-items').addEventListener('mousemove', e => {
        const z = zoomBox(e);
        if (!z) return;
        const r = z.getBoundingClientRect();
        z.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
        z.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
    });

    // Mise en forme des champs carte
    $('card-number').addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    });
    $('card-exp').addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
    });
    $('card-cvc').addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    const luhn = num => {
        let sum = 0, alt = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let d = +num[i];
            if (alt) { d *= 2; if (d > 9) d -= 9; }
            sum += d; alt = !alt;
        }
        return num.length >= 13 && sum % 10 === 0;
    };

    // Renvoie la clé du message d'erreur (traduit à l'affichage)
    function validate() {
        const required = ['fullname', 'co-email', 'address', 'zip', 'city', 'country', 'card-name'];
        for (const id of required) {
            if (!$(id).value.trim()) return 'err.fill';
        }
        if (!/^\S+@\S+\.\S+$/.test($('co-email').value)) return 'err.email';
        if (!luhn($('card-number').value.replace(/\s/g, ''))) return 'co.err.card';

        const m = $('card-exp').value.match(/^(\d{2})\/(\d{2})$/);
        const now = new Date();
        if (!m || +m[1] < 1 || +m[1] > 12 ||
            new Date(2000 + +m[2], +m[1], 1) <= new Date(now.getFullYear(), now.getMonth(), 1)) {
            return 'co.err.exp';
        }
        if (!/^\d{3,4}$/.test($('card-cvc').value)) return 'co.err.cvc';
        return '';
    }

    let errorKey = '';
    const showError = () => { $('co-error').textContent = errorKey ? t(errorKey) : ''; };

    $('checkout-form').addEventListener('submit', e => {
        e.preventDefault();
        errorKey = validate();
        showError();
        if (errorKey) return;

        // Simulation : aucune donnée de carte n'est envoyée ni conservée
        const btn = $('place-order');
        btn.disabled = true;
        btn.textContent = t('co.processing');
        setTimeout(() => {
            const number = '#NF-' + Math.floor(100000 + Math.random() * 900000);
            const { items, ship } = totals();
            // Historique des commandes (affiché dans « My orders », filtré par e-mail)
            try {
                const prev = JSON.parse(localStorage.getItem('novafaith-orders'));
                const orders = Array.isArray(prev) ? prev : [];
                orders.push({
                    number, email: session.email, date: new Date().toISOString(),
                    items: cart.map(({ id, name, price, img, qty, color, colorName, hex }) => ({ id, name, price, img, qty, color, colorName, hex })),
                    shipping: ship, total: items + ship
                });
                localStorage.setItem('novafaith-orders', JSON.stringify(orders));
            } catch {}
            $('order-number').textContent = number;
            cart = [];
            save();
            $('checkout-layout').hidden = true;
            $('confirmation').hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    });

    // Préremplit nom et e-mail avec le compte connecté
    if (session.name) $('fullname').value = session.name;
    $('co-email').value = session.email;

    document.addEventListener('nf:lang', () => { render(); showError(); });

    render();
    syncWithCollection();
});