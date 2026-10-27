document.addEventListener('DOMContentLoaded', () => {
    // Il faut être connecté pour voir ses commandes
    let session = null;
    try { session = JSON.parse(localStorage.getItem('novafaith-session')); } catch {}
    if (!session || !session.email) {
        window.location.replace('/assets/includes/auth.html?next=orders.html');
        return;
    }

    const euro = n => Number(n).toFixed(2) + ' €';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let all = [];
    try { const o = JSON.parse(localStorage.getItem('novafaith-orders')); if (Array.isArray(o)) all = o; } catch {}
    const orders = all.filter(o => o && o.email === session.email).reverse(); // la plus récente d'abord

    document.getElementById('orders-empty').hidden = orders.length > 0;

    document.getElementById('orders-list').innerHTML = orders.map(o => {
        const date = new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const rows = (o.items || []).map(i => `
            <div class="order-row">
                <img src="${esc(i.img)}" alt="${esc(i.name)}">
                <div class="order-name"><strong>${esc(i.name)}</strong><span>${i.qty} × ${euro(i.price)}</span></div>
                <div class="order-line">${euro(i.price * i.qty)}</div>
            </div>`).join('');
        const items = (o.items || []).reduce((s, i) => s + i.price * i.qty, 0);
        return `
        <section class="co-block order-card">
            <div class="order-head"><h2>${esc(o.number)}</h2><span>${esc(date)}</span></div>
            ${rows}
            <div class="order-foot">
                <div class="sum-row"><span>Items</span><span>${euro(items)}</span></div>
                <div class="sum-row"><span>Shipping</span><span>${o.shipping === 0 ? 'Free' : euro(o.shipping)}</span></div>
                <div class="sum-row total"><span>Total</span><span>${euro(o.total)}</span></div>
            </div>
        </section>`;
    }).join('');
});