/* admin.js — panel de administración EBABlue */

/* Contraseña simple en JS — protección básica, no es seguridad real */
const ADMIN_PASS = 'ebablue2025';
const PRODUCTS_KEY = 'eba_admin_products';

let products = [];
let editingId = null;
let deletingId = null;

/* --- Auth --- */
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const pass = document.getElementById('loginPass').value;
  if (pass === ADMIN_PASS) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadProducts();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginPass').value = '';
});

/* --- Products load --- */
async function loadProducts() {
  const saved = localStorage.getItem(PRODUCTS_KEY);
  if (saved) {
    try { products = JSON.parse(saved); renderTable(); return; } catch { /**/ }
  }
  try {
    const res = await fetch('data/productos.json');
    products = await res.json();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    showToast('No se pudo cargar productos.json', 'error');
    products = [];
  }
  renderTable();
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

/* --- Table --- */
function renderTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-4);padding:32px">Sin productos</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td style="color:var(--gray-4)">#${p.id}</td>
      <td><strong>${p.nombre}</strong>${p.destacado ? ' <span style="color:var(--gold);font-size:.75rem">★</span>' : ''}</td>
      <td>${p.categoria}</td>
      <td style="font-weight:600">${p.moneda}${p.precio.toLocaleString()}</td>
      <td><span class="admin-badge ${p.disponible ? 'admin-badge--on' : 'admin-badge--off'}">${p.disponible ? 'Sí' : 'No'}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})" style="margin-right:6px">
          <span class="material-icons" style="font-size:.85rem">edit</span>
        </button>
        <button class="btn btn-sm" onclick="confirmDelete(${p.id})" style="border:1.5px solid #e74c3c;color:#e74c3c">
          <span class="material-icons" style="font-size:.85rem">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

/* --- New product --- */
document.getElementById('newProductBtn').addEventListener('click', () => openModal(null));

function openModal(product) {
  editingId = product ? product.id : null;
  document.getElementById('modalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';

  document.getElementById('fieldId').value = product?.id || '';
  document.getElementById('fieldNombre').value = product?.nombre || '';
  document.getElementById('fieldNombreEn').value = product?.nombre_en || '';
  document.getElementById('fieldCategoria').value = product?.categoria || 'collares';
  document.getElementById('fieldPrecio').value = product?.precio || '';
  document.getElementById('fieldDesc').value = product?.descripcion || '';
  document.getElementById('fieldDescEn').value = product?.descripcion_en || '';
  document.getElementById('fieldImagen').value = product?.imagen || '';
  document.getElementById('fieldWa').value = product?.whatsapp_msg || '';
  document.getElementById('fieldDestacado').checked = product?.destacado || false;
  document.getElementById('fieldDisponible').checked = product?.disponible !== false;

  document.getElementById('productModal').classList.add('open');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  editingId = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('productModal').addEventListener('click', e => {
  if (e.target === document.getElementById('productModal')) closeModal();
});

document.getElementById('modalSave').addEventListener('click', () => {
  const nombre = document.getElementById('fieldNombre').value.trim();
  const precio = Number(document.getElementById('fieldPrecio').value);
  if (!nombre || !precio) { showToast('Completá nombre y precio', 'error'); return; }

  const data = {
    id: editingId || (Math.max(0, ...products.map(p => p.id)) + 1),
    nombre,
    nombre_en: document.getElementById('fieldNombreEn').value.trim(),
    categoria: document.getElementById('fieldCategoria').value,
    precio,
    moneda: 'RD$',
    descripcion: document.getElementById('fieldDesc').value.trim(),
    descripcion_en: document.getElementById('fieldDescEn').value.trim(),
    imagen: document.getElementById('fieldImagen').value.trim(),
    whatsapp_msg: document.getElementById('fieldWa').value.trim(),
    destacado: document.getElementById('fieldDestacado').checked,
    disponible: document.getElementById('fieldDisponible').checked,
  };

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx > -1) products[idx] = data;
  } else {
    products.push(data);
  }

  saveProducts();
  renderTable();
  closeModal();
  showToast(editingId ? 'Producto actualizado' : 'Producto creado', 'success');
});

function editProduct(id) {
  const p = products.find(p => p.id === id);
  if (p) openModal(p);
}

/* --- Delete --- */
function confirmDelete(id) {
  deletingId = id;
  document.getElementById('confirmModal').classList.add('open');
}

document.getElementById('confirmClose').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  deletingId = null;
});
document.getElementById('confirmCancel').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  deletingId = null;
});
document.getElementById('confirmDelete').addEventListener('click', () => {
  if (deletingId === null) return;
  products = products.filter(p => p.id !== deletingId);
  saveProducts();
  renderTable();
  document.getElementById('confirmModal').classList.remove('open');
  deletingId = null;
  showToast('Producto eliminado', 'success');
});

/* --- Export JSON --- */
document.getElementById('exportBtn').addEventListener('click', () => {
  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'productos.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado. Reemplazá data/productos.json en GitHub.', 'success');
});

/* --- Toast --- */
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
