/* cart.js — shared cart logic for index.html and tienda.html */

const CART_KEY = 'eba_cart';
const WA_NUMBER = '18091234567';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  showToast(t('added_cart'), 'success');
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateQty(id, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.precio * i.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

/* --- UI --- */
function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll('#cartBadge').forEach(el => {
    el.textContent = count;
    el.classList.toggle('show', count > 0);
  });
  renderCartDrawer();
}

function renderCartDrawer() {
  const cart = getCart();
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  const totalEl = document.getElementById('cartTotal');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty__icon">🛍️</div><p>${t('cart_empty')}</p></div>`;
    if (foot) foot.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__img">
        ${item.imagen
          ? `<img src="${item.imagen}" alt="${item.nombre}" onerror="this.style.display='none'">`
          : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--teal)"><span class="material-icons">diamond</span></div>'}
      </div>
      <div class="cart-item__info">
        <div class="cart-item__name">${currentLang === 'en' && item.nombre_en ? item.nombre_en : item.nombre}</div>
        <div class="cart-item__price">${item.moneda}${item.precio.toLocaleString()}</div>
        <div class="cart-item__qty">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item__del" onclick="removeFromCart(${item.id})" title="Eliminar">
        <span class="material-icons" style="font-size:1rem">delete_outline</span>
      </button>
    </div>
  `).join('');

  if (foot) {
    foot.style.display = 'block';
    if (totalEl) totalEl.textContent = `RD$${getCartTotal().toLocaleString()}`;
  }
}

function buildWhatsAppOrder() {
  const cart = getCart();
  if (!cart.length) return;
  const lines = cart.map(i => `• ${i.nombre} x${i.qty} — RD$${(i.precio * i.qty).toLocaleString()}`).join('\n');
  const total = `\n*Total: RD$${getCartTotal().toLocaleString()}*`;
  const msg = `Hola EBABlue 👋\nQuisiera hacer este pedido:\n\n${lines}${total}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* --- Drawer toggle --- */
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* --- Toast --- */
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();

  document.getElementById('cartNavBtn')?.addEventListener('click', e => {
    e.preventDefault();
    openCart();
  });
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('cartCheckout')?.addEventListener('click', buildWhatsAppOrder);
});
