/* main.js — index.html logic */

/* Nav scroll */
window.addEventListener('scroll', () => {
  document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 10);
});

/* Hamburger */
document.getElementById('hamburger')?.addEventListener('click', () => {
  const links = document.getElementById('navLinks');
  if (!links) return;
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '70px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = 'white';
  links.style.padding = '16px 24px';
  links.style.boxShadow = 'var(--shadow)';
  links.style.zIndex = '999';
});

/* Load featured products on index.html */
async function renderFeatured() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;

  let products = [];
  try {
    const res = await fetch('data/productos.json');
    products = await res.json();
  } catch {
    container.innerHTML = '<p style="text-align:center;color:var(--gray-4)">No se pudieron cargar los productos.</p>';
    return;
  }

  const featured = products.filter(p => p.destacado && p.disponible);
  if (!featured.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--gray-4)">Sin productos destacados.</p>';
    return;
  }

  container.innerHTML = featured.map(p => buildProductCard(p)).join('');
}

function buildProductCard(p) {
  const name = currentLang === 'en' && p.nombre_en ? p.nombre_en : p.nombre;
  const desc = currentLang === 'en' && p.descripcion_en ? p.descripcion_en : p.descripcion;
  const waMsg = encodeURIComponent(p.whatsapp_msg || `Hola, me interesa ${p.nombre}`);
  const img = p.imagen
    ? `<img src="${p.imagen}" alt="${name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-card__placeholder\\'><span class=\\'material-icons\\'>diamond</span></div>'">`
    : `<div class="product-card__placeholder"><span class="material-icons">diamond</span></div>`;

  return `
    <div class="product-card">
      <div class="product-card__img">${img}</div>
      <div class="product-card__body">
        <div class="product-card__cat">${p.categoria}</div>
        <div class="product-card__name">${name}</div>
        <p class="product-card__desc">${desc || ''}</p>
        <div class="product-card__footer">
          <div class="product-card__price">${p.moneda}${p.precio.toLocaleString()}</div>
          <div class="product-card__actions">
            <button class="add-cart-btn" onclick='addToCart(${JSON.stringify(p)})' title="${t('add_cart')}">
              <span class="material-icons" style="font-size:1rem">add_shopping_cart</span>
            </button>
            <a href="https://wa.me/18091234567?text=${waMsg}" target="_blank" rel="noopener" class="wa-btn" title="WhatsApp">
              <span class="material-icons" style="font-size:.9rem">chat</span>
            </a>
          </div>
        </div>
      </div>
    </div>`;
}

/* Scroll reveal */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.feature-card, .product-card, .testimonio-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });

  renderFeatured();
});
