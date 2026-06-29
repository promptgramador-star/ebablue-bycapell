/* store.js — tienda.html logic */

let allProducts = [];
let activeCategory = 'all';
let maxPrice = 2000;
let onlyAvail = true;
let searchQuery = '';

async function loadProducts() {
  try {
    const res = await fetch('data/productos.json');
    allProducts = await res.json();
    maxPrice = Math.max(...allProducts.map(p => p.precio), 2000);
    const rangeInput = document.getElementById('priceRange');
    if (rangeInput) {
      rangeInput.max = maxPrice;
      rangeInput.value = maxPrice;
      document.getElementById('priceVal').textContent = maxPrice;
    }
  } catch {
    document.getElementById('productsGrid').innerHTML =
      '<div class="no-results"><span class="material-icons" style="font-size:3rem;margin-bottom:12px">error_outline</span><p>No se pudieron cargar los productos.</p></div>';
    return;
  }
  applyUrlFilter();
  renderProducts();
}

function applyUrlFilter() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    activeCategory = cat;
    document.querySelectorAll('.chip[data-cat]').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === cat);
    });
  }
}

function getFiltered() {
  return allProducts.filter(p => {
    if (onlyAvail && !p.disponible) return false;
    if (activeCategory !== 'all' && p.categoria !== activeCategory) return false;
    if (p.precio > maxPrice) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (currentLang === 'en' && p.nombre_en ? p.nombre_en : p.nombre).toLowerCase();
      const desc = (currentLang === 'en' && p.descripcion_en ? p.descripcion_en : p.descripcion || '').toLowerCase();
      if (!name.includes(q) && !desc.includes(q) && !p.categoria.includes(q)) return false;
    }
    return true;
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('storeCount');
  if (!grid) return;

  const filtered = getFiltered();
  if (countEl) countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-results">
      <span class="material-icons" style="font-size:3rem;margin-bottom:12px;color:var(--gray-3)">search_off</span>
      <p>Sin resultados. Probá otros filtros.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const name = currentLang === 'en' && p.nombre_en ? p.nombre_en : p.nombre;
    const desc = currentLang === 'en' && p.descripcion_en ? p.descripcion_en : p.descripcion;
    const waMsg = encodeURIComponent(p.whatsapp_msg || `Hola, me interesa ${p.nombre}`);
    const img = p.imagen
      ? `<img src="${p.imagen}" alt="${name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-card__placeholder\\'><span class=\\'material-icons\\'>diamond</span></div>'">`
      : `<div class="product-card__placeholder"><span class="material-icons">diamond</span></div>`;
    const unavail = !p.disponible ? '<div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.6);color:white;font-size:.7rem;padding:3px 8px;border-radius:20px">Agotado</div>' : '';

    return `
      <div class="product-card">
        <div class="product-card__img" style="position:relative">${img}${unavail}</div>
        <div class="product-card__body">
          <div class="product-card__cat">${p.categoria}</div>
          <div class="product-card__name">${name}</div>
          <p class="product-card__desc">${desc || ''}</p>
          <div class="product-card__footer">
            <div class="product-card__price">${p.moneda}${p.precio.toLocaleString()}</div>
            <div class="product-card__actions">
              <button class="add-cart-btn" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})' title="${t('add_cart')}" ${!p.disponible ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>
                <span class="material-icons" style="font-size:1rem">add_shopping_cart</span>
              </button>
              <a href="https://wa.me/18091234567?text=${waMsg}" target="_blank" rel="noopener" class="wa-btn" title="WhatsApp">
                <span class="material-icons" style="font-size:.9rem">chat</span>
              </a>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  /* Nav scroll */
  window.addEventListener('scroll', () => {
    document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 10);
  });

  /* Category chips */
  document.querySelectorAll('.chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.cat;
      document.querySelectorAll('.chip[data-cat]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });

  /* Price range */
  const range = document.getElementById('priceRange');
  range?.addEventListener('input', () => {
    maxPrice = Number(range.value);
    document.getElementById('priceVal').textContent = maxPrice;
    renderProducts();
  });

  /* Availability */
  document.getElementById('onlyAvail')?.addEventListener('change', e => {
    onlyAvail = e.target.checked;
    renderProducts();
  });

  /* Search */
  document.getElementById('searchInput')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderProducts();
  });

  /* Clear */
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    activeCategory = 'all';
    searchQuery = '';
    onlyAvail = true;
    document.getElementById('searchInput').value = '';
    document.getElementById('onlyAvail').checked = true;
    const range = document.getElementById('priceRange');
    if (range) {
      maxPrice = Number(range.max);
      range.value = range.max;
      document.getElementById('priceVal').textContent = range.max;
    }
    document.querySelectorAll('.chip[data-cat]').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    renderProducts();
  });

  loadProducts();
});
