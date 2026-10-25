document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY = 'novafaith-cart';
    const FREE_SHIPPING_FROM = 100; // livraison offerte dès 100 €
    const SHIPPING_FEE = 4.9;

    const $ = id => document.getElementById(id);
    const euro = n => n.toFixed(2) + ' €';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const readCart = () => {
        try {
            const c = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(c) ? c.filter(i => i && i.qty > 0 && isFinite(i.price)) : [];
        } catch { return []; }
    };
    const saveCart = c => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch {} };

    let cart = readCart();

    function render() {
        const empty = cart.length === 0;
        $('empty-cart').hidden = !empty;
        $('checkout-layout').hidden = empty;
        if (empty) return;

        $('cart-items').innerHTML = cart.map((i, idx) => `
            <div class="cart-row">
                <img src="${esc(i.img)}" alt="${esc(i.name)}">
                <div class="cart-info">
                    <strong>${esc(i.name)}</strong>
                    <span>${euro(i.price)}</span>
                </div>
                <div class="qty">
                    <button type="button" data-act="dec" data-i="${idx}" aria-label="Decrease quantity">&minus;</button>
                    <span>${i.qty}</span>
                    <button type="button" data-act="inc" data-i="${idx}" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="remove" data-act="del" data-i="${idx}">Remove</button>
            </div>`).join('');

        const items = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const ship = items >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
        $('sum-items').textContent = euro(items);
        $('sum-ship').textContent = ship === 0 ? 'Free' : euro(ship);
        $('sum-total').textContent = euro(items + ship);
        $('ship-note').textContent = ship === 0
            ? 'Your order qualifies for free shipping.'
            : `Free shipping from ${euro(FREE_SHIPPING_FROM)} (${euro(FREE_SHIPPING_FROM - items)} to go).`;
    }

    $('cart-items').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const i = +b.dataset.i;
        if (b.dataset.act === 'inc') cart[i].qty++;
        if (b.dataset.act === 'dec') cart[i].qty = Math.max(1, cart[i].qty - 1);
        if (b.dataset.act === 'del') cart.splice(i, 1);
        saveCart(cart);
        render();
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

    function validate() {
        const required = ['fullname', 'co-email', 'address', 'zip', 'city', 'country', 'card-name'];
        for (const id of required) {
            if (!$(id).value.trim()) return 'Please fill in all the fields.';
        }
        if (!/^\S+@\S+\.\S+$/.test($('co-email').value)) return 'Please enter a valid email address.';
        if (!luhn($('card-number').value.replace(/\s/g, ''))) return 'The card number is not valid.';

        const m = $('card-exp').value.match(/^(\d{2})\/(\d{2})$/);
        const now = new Date();
        if (!m || +m[1] < 1 || +m[1] > 12 ||
            new Date(2000 + +m[2], +m[1], 1) <= new Date(now.getFullYear(), now.getMonth(), 1)) {
            return 'The expiry date is not valid.';
        }
        if (!/^\d{3,4}$/.test($('card-cvc').value)) return 'The CVC is not valid.';
        return '';
    }

    $('checkout-form').addEventListener('submit', e => {
        e.preventDefault();
        const err = validate();
        $('co-error').textContent = err;
        if (err) return;

        // Simulation : aucune donnée de carte n'est envoyée ni conservée
        const btn = $('place-order');
        btn.disabled = true;
        btn.textContent = 'PROCESSING...';
        setTimeout(() => {
            $('order-number').textContent = '#NF-' + Math.floor(100000 + Math.random() * 900000);
            saveCart([]);
            $('checkout-layout').hidden = true;
            $('confirmation').hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    });

    render();
});