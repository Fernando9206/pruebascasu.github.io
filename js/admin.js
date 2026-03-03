import { db } from './firebase.js';
import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    onSnapshot, setDoc, getDocs, writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* â”€â”€ CLOUDINARY â”€â”€ */
const CLOUD_NAME = 'DVHML1XCD';        // tu cloud name
const UPLOAD_PRESET = 'productos_menu';  // tu unsigned preset

/* â”€â”€ CONSTANTS â”€â”€ */
const ADMIN_PASSWORD = 'casuarina2024'; // â† cambia aquÃ­ tu contraseÃ±a
const COL_PRODUCTOS = 'productos';
const DOC_NEGOCIO = doc(db, 'config', 'negocio');

const DEFAULT_PRODUCTS = [
    { name: 'Palomitas de MaÃ­z', desc: 'Palomitas reciÃ©n hechas con mantequilla y sal.', price: 25, emoji: 'ðŸ¿', cat: 'snacks', badges: ['hot'] },
    { name: 'Papas Fritas', desc: 'Crujientes papas estilo kettle, en varios sabores.', price: 30, emoji: 'ðŸ¥”', cat: 'snacks', badges: ['pop'] },
    { name: 'Nachos con Queso', desc: 'Nachos dorados baÃ±ados en salsa de queso caliente.', price: 45, emoji: 'ðŸ«”', cat: 'snacks', badges: [] },
    { name: 'Hot Cheetos', desc: 'Botana de maÃ­z muy picosa, crujiente y adictiva.', price: 20, emoji: 'ðŸŒ¶ï¸', cat: 'snacks', badges: ['pop'] },
    { name: 'Palomitas Ranch', desc: 'Palomitas sabor ranch con toque de queso.', price: 30, emoji: 'ðŸ¿', cat: 'snacks', badges: ['new'] },
    { name: 'Cacahuates Japones', desc: 'Cacahuates cubiertos de harina crujiente japonesa.', price: 18, emoji: 'ðŸ¥œ', cat: 'snacks', badges: [] },
    { name: 'Gomitas de Osito', desc: 'Gomitas de colores con sabores de frutas tropicales.', price: 15, emoji: 'ðŸ»', cat: 'dulces', badges: ['pop'] },
    { name: 'Chocolates Surtidos', desc: 'SelecciÃ³n de chocolates, leche, oscuro y almendra.', price: 35, emoji: 'ðŸ«', cat: 'dulces', badges: [] },
    { name: 'Paleta de Tamarindo', desc: 'Paleta con chamoy, tamarindo y chile en polvo.', price: 12, emoji: 'ðŸ­', cat: 'dulces', badges: ['hot'] },
    { name: 'MazapÃ¡n', desc: 'Tradicional mazapÃ¡n de cacahuate, suave y dulce.', price: 8, emoji: 'ðŸŸ¤', cat: 'dulces', badges: [] },
    { name: 'Rebanada de Pay', desc: 'Pay de manzana casero con canela y azÃºcar.', price: 40, emoji: 'ðŸ¥§', cat: 'dulces', badges: ['new'] },
    { name: 'Agua Fresca', desc: 'Agua de sandÃ­a, horchata o jamaica. Refrescante.', price: 20, emoji: 'ðŸ¹', cat: 'bebidas-frias', badges: ['pop'] },
    { name: 'Limonada', desc: 'Limonada natural con menta fresca y hielo.', price: 25, emoji: 'ðŸ‹', cat: 'bebidas-frias', badges: [] },
    { name: 'Smoothie de Fresa', desc: 'Batido de fresas naturales, leche y vainilla.', price: 40, emoji: 'ðŸ“', cat: 'bebidas-frias', badges: ['new'] },
    { name: 'Refresco', desc: 'Variedad de refrescos frÃ­os de tu elecciÃ³n.', price: 22, emoji: 'ðŸ¥¤', cat: 'bebidas-frias', badges: [] },
    { name: 'Agua Mineral', desc: 'Agua mineral natural con gas para refrescarte.', price: 15, emoji: 'ðŸ’§', cat: 'bebidas-frias', badges: [] },
    { name: 'TÃ© FrÃ­o de LimÃ³n', desc: 'TÃ© helado con limÃ³n y miel, perfecto para el calor.', price: 28, emoji: 'ðŸµ', cat: 'bebidas-frias', badges: ['hot'] },
    { name: 'CafÃ© Americano', desc: 'CafÃ© de grano negro fuerte, servido bien caliente.', price: 30, emoji: 'â˜•', cat: 'bebidas-calientes', badges: ['pop'] },
    { name: 'CafÃ© con Leche', desc: 'Espresso suave con leche vaporizada y canela.', price: 35, emoji: 'ðŸ§‹', cat: 'bebidas-calientes', badges: [] },
    { name: 'Chocolate Caliente', desc: 'Chocolate espeso cremoso con malvaviscos.', price: 38, emoji: 'ðŸ«', cat: 'bebidas-calientes', badges: ['hot'] },
    { name: 'TÃ© de Manzanilla', desc: 'Tranquilo tÃ© de manzanilla con miel y limÃ³n.', price: 20, emoji: 'ðŸŒ¼', cat: 'bebidas-calientes', badges: [] },
    { name: 'Ensalada de Frutas', desc: 'Fruta fresca de temporada con chile y limÃ³n.', price: 35, emoji: 'ðŸ±', cat: 'saludable', badges: ['new'] },
    { name: 'Mix de Nueces', desc: 'Mezcla de nueces, almendras y arÃ¡ndanos secos.', price: 45, emoji: 'ðŸ¥œ', cat: 'saludable', badges: [] },
    { name: 'Granola Bar', desc: 'Barra de granola con avena, miel y semillas.', price: 25, emoji: 'ðŸŒ¾', cat: 'saludable', badges: ['pop'] },
    { name: 'Yogurt con Granola', desc: 'Yogurt natural con granola crujiente y miel.', price: 40, emoji: 'ðŸ¥›', cat: 'saludable', badges: [] },
];

/* â”€â”€ STATE â”€â”€ */
let liveProducts = [];    // populated by onSnapshot
let liveStatus = 'open';
let activeFilter = 'all';
let pendingDeleteId = null;

/* â”€â”€ DOM REFS â”€â”€ */
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const pwdInput = document.getElementById('pwd-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const statusHint = document.getElementById('status-hint');
const statusToggle = document.getElementById('status-toggle-btn');
const prodList = document.getElementById('prod-list');
const countPill = document.getElementById('prod-count-pill');
const toastWrap = document.getElementById('toast-wrap');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmTextEl = document.getElementById('confirm-text');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');
const syncIndicator = document.getElementById('sync-indicator');
const addProductBtn = document.getElementById('add-product-btn');

/* â”€â”€ CAT NAMES â”€â”€ */
const CAT_NAMES = { snacks: 'Snack', dulces: 'Dulce', 'bebidas-frias': 'Beb. FrÃ­a', 'bebidas-calientes': 'Beb. Caliente', saludable: 'Saludable' };

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LOGIN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function doLogin() {
    if (pwdInput.value === ADMIN_PASSWORD) {
        loginScreen.style.display = 'none';
        app.classList.add('visible');
        initApp();
    } else {
        loginError.classList.add('show');
        pwdInput.value = '';
        pwdInput.focus();
    }
}
loginBtn.addEventListener('click', doLogin);
pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('logout-btn').addEventListener('click', () => {
    app.classList.remove('visible');
    loginScreen.style.display = 'flex';
    pwdInput.value = '';
    loginError.classList.remove('show');
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• INIT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function initApp() {
    initEmojiPicker();
    startListeners();
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FIRESTORE LISTENERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function startListeners() {
    // Products â€” real-time
    onSnapshot(collection(db, COL_PRODUCTOS), (snap) => {
        liveProducts = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        syncIndicator.style.display = 'flex';
        renderProductList();
    }, err => { toast('âŒ Error al conectar con Firebase', true); console.error(err); });

    // Status â€” real-time
    onSnapshot(DOC_NEGOCIO, (snap) => {
        liveStatus = snap.exists() ? (snap.data().status || 'open') : 'open';
        renderStatus();
    }, console.error);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATUS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function renderStatus() {
    if (liveStatus === 'open') {
        statusBadge.className = 'status-badge open';
        statusText.textContent = 'Abierto';
        statusHint.textContent = 'El menÃº muestra el indicador verde de "Abierto"';
        statusToggle.className = 'toggle-btn close-action';
        statusToggle.textContent = 'ðŸ”’ Marcar como Cerrado';
    } else {
        statusBadge.className = 'status-badge closed';
        statusText.textContent = 'Cerrado';
        statusHint.textContent = 'El menÃº muestra el banner de "Cerrado" a los clientes';
        statusToggle.className = 'toggle-btn open-action';
        statusToggle.textContent = 'ðŸ”“ Marcar como Abierto';
    }
}

statusToggle.addEventListener('click', async () => {
    const next = liveStatus === 'open' ? 'closed' : 'open';
    try {
        await setDoc(DOC_NEGOCIO, { status: next });
        toast(next === 'closed' ? 'ðŸ”’ Negocio marcado como Cerrado' : 'ðŸ”“ Negocio marcado como Abierto');
    } catch (e) { toast('âŒ Error al actualizar estado', true); console.error(e); }
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ADD PRODUCT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
initEmojiPickerSetup(); // declared below
function initEmojiPickerSetup() { } // placeholder â€” called after DOM ready

function initEmojiPicker() {
    const row = document.getElementById('emoji-row');
    const emojis = ['ðŸ¿', 'ðŸ¥”', 'ðŸŒ®', 'ðŸŒ­', 'ðŸ§†', 'ðŸ¥œ', 'ðŸ«', 'ðŸ¬', 'ðŸ­', 'ðŸ§', 'ðŸ¥§', 'ðŸ°', 'ðŸ¹', 'ðŸ§ƒ', 'ðŸ¥¤', 'â˜•', 'ðŸ§‹', 'ðŸµ', 'ðŸ’§', 'ðŸ“', 'ðŸ‹', 'ðŸŽ', 'ðŸ¥—', 'ðŸŒ¾', 'ðŸ¥›', 'ðŸŒ¶ï¸', 'ðŸ»', 'ðŸŸ¤', 'ðŸº', 'ðŸ«”'];
    emojis.forEach(e => {
        const btn = document.createElement('span');
        btn.className = 'emoji-opt'; btn.textContent = e; btn.title = e;
        btn.addEventListener('click', () => {
            document.getElementById('f-emoji').value = e;
            document.querySelectorAll('.emoji-opt').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
        });
        row.appendChild(btn);
    });
    document.getElementById('f-emoji').addEventListener('input', function () {
        document.querySelectorAll('.emoji-opt').forEach(x => x.classList.toggle('selected', x.textContent === this.value.trim()));
    });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MULTI-PHOTO UPLOAD (Products) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const MAX_PHOTOS = 5;
const fImgInput = document.getElementById('f-img');
const multiZone = document.getElementById('multi-upload-zone');
const previewsGrid = document.getElementById('photo-previews-grid');
const countLabel = document.getElementById('photo-count-label');
const countNum = document.getElementById('photo-count-num');
let selectedFiles = []; // array of File objects

function updatePhotoUI() {
    previewsGrid.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'photo-thumb-wrap';

        const img = document.createElement('img');
        img.alt = file.name;
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; };
        reader.readAsDataURL(file);

        const del = document.createElement('button');
        del.className = 'photo-thumb-del';
        del.type = 'button';
        del.title = 'Eliminar foto';
        del.innerHTML = 'âœ•';
        del.addEventListener('click', e => {
            e.stopPropagation();
            selectedFiles.splice(idx, 1);
            updatePhotoUI();
        });

        const badge = document.createElement('div');
        badge.className = 'photo-order-badge';
        badge.textContent = idx === 0 ? 'Principal' : `#${idx + 1}`;

        wrap.appendChild(img);
        wrap.appendChild(del);
        wrap.appendChild(badge);
        previewsGrid.appendChild(wrap);
    });

    const count = selectedFiles.length;
    countLabel.style.display = count > 0 ? 'block' : 'none';
    countNum.textContent = count;

    // Show / hide hint overlay
    const hint = document.getElementById('multi-upload-hint');
    hint.style.display = count >= MAX_PHOTOS ? 'none' : '';
    // Disable file input when full
    fImgInput.disabled = count >= MAX_PHOTOS;
}

function addFiles(fileList) {
    const remaining = MAX_PHOTOS - selectedFiles.length;
    if (remaining <= 0) return toast(`âš ï¸ MÃ¡ximo ${MAX_PHOTOS} fotos por producto`, true);
    const toAdd = Array.from(fileList)
        .filter(f => f.type.startsWith('image/'))
        .slice(0, remaining);
    selectedFiles = [...selectedFiles, ...toAdd];
    updatePhotoUI();
    fImgInput.value = '';
}

fImgInput.addEventListener('change', e => { if (e.target.files.length) addFiles(e.target.files); });

// Drag & drop
multiZone.addEventListener('dragover', e => { e.preventDefault(); multiZone.classList.add('dragover'); });
multiZone.addEventListener('dragleave', () => multiZone.classList.remove('dragover'));
multiZone.addEventListener('drop', e => {
    e.preventDefault(); multiZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

function clearAllPhotos() {
    selectedFiles = [];
    fImgInput.value = '';
    updatePhotoUI();
}

/* Upload ONE image to Cloudinary â†’ returns secure_url */
async function uploadOneImage(file, progressWrap, progressBar, idx, total) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Upload failed');
    // Update progress bar proportionally
    progressBar.style.width = ((idx + 1) / total * 100) + '%';
    return data.secure_url;
}

/* Upload all selected photos â†’ returns array of URLs */
async function uploadAllPhotos() {
    if (!selectedFiles.length) return [];
    const progressWrap = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    progressWrap.style.display = 'block';
    progressBar.style.width = '5%';
    const urls = [];
    for (let i = 0; i < selectedFiles.length; i++) {
        const url = await uploadOneImage(selectedFiles[i], progressWrap, progressBar, i, selectedFiles.length);
        urls.push(url);
    }
    setTimeout(() => { progressWrap.style.display = 'none'; progressBar.style.width = '0%'; }, 500);
    return urls;
}

/* Generic single-file uploader (used by promos) */
async function uploadImage(file) {
    const progressWrap = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    progressWrap.style.display = 'block';
    progressBar.style.width = '10%';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    let pct = 10;
    const tick = setInterval(() => { pct = Math.min(pct + 8, 85); progressBar.style.width = pct + '%'; }, 300);
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        clearInterval(tick);
        if (!response.ok || data.error) throw new Error(data.error?.message || 'Upload failed');
        progressBar.style.width = '100%';
        setTimeout(() => { progressWrap.style.display = 'none'; progressBar.style.width = '0%'; }, 400);
        return data.secure_url;
    } catch (e) { clearInterval(tick); progressWrap.style.display = 'none'; throw e; }
}

addProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('f-name').value.trim();
    const price = parseFloat(document.getElementById('f-price').value);
    const cat = document.getElementById('f-cat').value;
    const emoji = document.getElementById('f-emoji').value.trim() || 'ðŸ¿';
    const desc = document.getElementById('f-desc').value.trim();
    const badges = [];
    if (document.getElementById('b-hot').checked) badges.push('hot');
    if (document.getElementById('b-new').checked) badges.push('new');
    if (document.getElementById('b-pop').checked) badges.push('pop');

    if (!name) return toast('âš ï¸ Escribe el nombre del producto', true);
    if (!price || price <= 0) return toast('âš ï¸ Ingresa un precio vÃ¡lido', true);
    if (!cat) return toast('âš ï¸ Selecciona una categorÃ­a', true);

    addProductBtn.disabled = true;
    try {
        let photos = [];
        if (selectedFiles.length) {
            addProductBtn.innerHTML = `â³ Subiendo ${selectedFiles.length} foto(s)...`;
            photos = await uploadAllPhotos();
        }
        addProductBtn.innerHTML = 'â³ Guardando...';
        const productData = { name, price, cat, emoji, desc, badges, available: true, photos };
        // Backward-compat: also set imageUrl to first photo
        if (photos.length > 0) productData.imageUrl = photos[0];
        await addDoc(collection(db, COL_PRODUCTOS), productData);
        toast(`âœ… "${name}" agregado al menÃº`);
        ['f-name', 'f-price', 'f-desc', 'f-emoji'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('f-cat').value = '';
        ['b-hot', 'b-new', 'b-pop'].forEach(id => document.getElementById(id).checked = false);
        document.querySelectorAll('.emoji-opt').forEach(x => x.classList.remove('selected'));
        clearAllPhotos();
    } catch (e) { toast('âŒ Error al guardar producto', true); console.error(e); }
    addProductBtn.disabled = false;
    addProductBtn.innerHTML = 'âœš Agregar al menÃº';
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PRODUCT LIST â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderProductList();
    });
});

function renderProductList() {
    let filtered = liveProducts;
    if (activeFilter === 'avail') filtered = liveProducts.filter(p => p.available !== false);
    if (activeFilter === 'out') filtered = liveProducts.filter(p => p.available === false);

    countPill.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
    prodList.innerHTML = '';

    if (filtered.length === 0) {
        prodList.innerHTML = `<div class="prod-empty"><div class="ei">ðŸ—‚ï¸</div><p>${liveProducts.length === 0 ? 'Sin productos. Usa "Cargar productos de ejemplo" para empezar.' : 'No hay productos en esta categorÃ­a.'}</p></div>`;
        return;
    }

    filtered.forEach(p => {
        const isAvail = p.available !== false;
        const badgeHTML = (p.badges || []).map(b => {
            const cl = { hot: 'pb-hot', new: 'pb-new', pop: 'pb-pop' }[b] || '';
            const lb = { hot: 'Favorito', new: 'Nuevo', pop: 'Popular' }[b] || b;
            return `<span class="pb ${cl}">${lb}</span>`;
        }).join('');

        const firstPhoto = (p.photos && p.photos.length > 0) ? p.photos[0] : p.imageUrl;
        const thumbHTML = firstPhoto
            ? `<img class="prod-thumb" src="${firstPhoto}" alt="${p.name}" loading="lazy" />`
            : `<div class="prod-emoji">${p.emoji || 'ðŸ¿'}</div>`;

        const row = document.createElement('div');
        row.className = `prod-item ${isAvail ? '' : 'unavailable'}`;
        row.innerHTML = `
        ${thumbHTML}
        <div class="prod-info">
          <div class="prod-name">${p.name}</div>
          <div class="prod-meta">
            <span class="prod-cat">${CAT_NAMES[p.cat] || p.cat}</span>
            <span class="prod-price">$${p.price} MXN</span>
            <div class="prod-badges">${badgeHTML}</div>
          </div>
        </div>
        <div class="prod-actions">
          <button class="avail-toggle ${isAvail ? 'available' : 'unavailable'}" data-id="${p.firestoreId}">
            ${isAvail ? 'âœ… Disponible' : 'â›” Sin inventario'}
          </button>
          <button class="delete-btn" data-id="${p.firestoreId}" title="Eliminar">ðŸ—‘</button>
        </div>`;
        prodList.appendChild(row);
    });


    prodList.querySelectorAll('.avail-toggle').forEach(btn => btn.addEventListener('click', () => toggleAvailability(btn.dataset.id)));
    prodList.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => askDelete(btn.dataset.id)));
}

async function toggleAvailability(firestoreId) {
    const p = liveProducts.find(x => x.firestoreId === firestoreId);
    if (!p) return;
    try {
        // Only update availability â€” photos and all other fields remain intact
        const newAvail = p.available === false ? true : false;
        await updateDoc(doc(db, COL_PRODUCTOS, firestoreId), { available: newAvail });
        toast(newAvail ? `âœ… "${p.name}" marcado disponible` : `â›” "${p.name}" marcado sin inventario`);
    } catch (e) { toast('âŒ Error al actualizar disponibilidad', true); console.error(e); }
}

/* â”€â”€ DELETE â”€â”€ */
function askDelete(firestoreId) {
    const p = liveProducts.find(x => x.firestoreId === firestoreId);
    if (!p) return;
    pendingDeleteId = firestoreId;
    confirmTextEl.textContent = `Â¿Eliminar "${p.name}" del menÃº? Esta acciÃ³n no se puede deshacer.`;
    confirmOverlay.classList.add('open');
}
confirmCancel.addEventListener('click', () => { confirmOverlay.classList.remove('open'); pendingDeleteId = null; });
confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) { confirmOverlay.classList.remove('open'); pendingDeleteId = null; } });
confirmOk.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
        await deleteDoc(doc(db, COL_PRODUCTOS, pendingDeleteId));
        toast('ðŸ—‘ï¸ Producto eliminado del menÃº');
    } catch (e) { toast('âŒ Error al eliminar', true); console.error(e); }
    confirmOverlay.classList.remove('open');
    pendingDeleteId = null;
});

/* â”€â”€ SEED / RESET â”€â”€ */
async function deleteAllProducts() {
    const snap = await getDocs(collection(db, COL_PRODUCTOS));
    if (snap.empty) return 0;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return snap.size;
}

document.getElementById('seed-btn').addEventListener('click', async () => {
    const snap = await getDocs(collection(db, COL_PRODUCTOS));
    const msg = snap.empty
        ? `Â¿Cargar los 25 productos de ejemplo a Firestore?`
        : `Hay ${snap.size} productos. Se borrarÃ¡n TODOS y se cargarÃ¡n los 25 de ejemplo limpios. Â¿Continuar?`;
    if (!confirm(msg)) return;
    try {
        await deleteAllProducts();
        const batch = writeBatch(db);
        DEFAULT_PRODUCTS.forEach(p => {
            batch.set(doc(collection(db, COL_PRODUCTOS)), { ...p, available: true });
        });
        await batch.commit();
        toast(`âœ… Reset completo: 25 productos cargados`);
    } catch (e) { toast('âŒ Error al resetear', true); console.error(e); }
});

document.getElementById('clear-btn').addEventListener('click', async () => {
    const snap = await getDocs(collection(db, COL_PRODUCTOS));
    if (snap.empty) return toast('âš ï¸ No hay productos que eliminar');
    if (!confirm(`Â¿Eliminar los ${snap.size} productos de Firestore? Esta acciÃ³n NO se puede deshacer.`)) return;
    try {
        const n = await deleteAllProducts();
        toast(`ðŸ—‘ï¸ ${n} productos eliminados`);
    } catch (e) { toast('âŒ Error al limpiar', true); console.error(e); }
});


/* â”€â”€ PROMO IMAGE UPLOAD â”€â”€ */
const prImg = document.getElementById('pr-img');
const prPreviewWrap = document.getElementById('pr-preview-wrap');
const prPreviewEl = document.getElementById('pr-preview');
const prUploadPh = document.getElementById('pr-upload-ph');
const prUploadArea = document.getElementById('pr-upload-area');
let selectedPromoFile = null;

function showPromoPreview(file) {
    selectedPromoFile = file;
    const reader = new FileReader();
    reader.onload = e => { prPreviewEl.src = e.target.result; prPreviewWrap.style.display = 'block'; prUploadPh.style.display = 'none'; };
    reader.readAsDataURL(file);
}
function clearPromoImage() {
    selectedPromoFile = null; prImg.value = '';
    prPreviewEl.src = ''; prPreviewWrap.style.display = 'none'; prUploadPh.style.display = '';
}
prImg.addEventListener('change', e => { if (e.target.files[0]) showPromoPreview(e.target.files[0]); });
document.getElementById('pr-remove').addEventListener('click', e => { e.stopPropagation(); clearPromoImage(); });
prUploadArea.addEventListener('dragover', e => { e.preventDefault(); prUploadArea.classList.add('dragover'); });
prUploadArea.addEventListener('dragleave', () => prUploadArea.classList.remove('dragover'));
prUploadArea.addEventListener('drop', e => {
    e.preventDefault(); prUploadArea.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) showPromoPreview(f);
});

async function uploadPromoImage(file) {
    const bar = document.getElementById('pr-progress'); bar.style.display = 'block';
    const pb = document.getElementById('pr-progress-bar'); pb.style.width = '10%';
    const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET);
    let pct = 10;
    const tick = setInterval(() => { pct = Math.min(pct + 8, 85); pb.style.width = pct + '%'; }, 300);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        clearInterval(tick);
        if (!res.ok || data.error) throw new Error(data.error?.message || 'Upload failed');
        pb.style.width = '100%';
        setTimeout(() => { bar.style.display = 'none'; pb.style.width = '0%'; }, 400);
        return data.secure_url;
    } catch (e) { clearInterval(tick); bar.style.display = 'none'; throw e; }
}

/* â”€â”€ ADD PROMO â”€â”€ */
const addPromoBtn = document.getElementById('add-promo-btn');
addPromoBtn.addEventListener('click', async () => {
    const titulo = document.getElementById('pr-titulo').value.trim();
    if (!titulo) return toast('âš ï¸ Escribe el tÃ­tulo de la promociÃ³n', true);
    addPromoBtn.disabled = true;
    try {
        let imageUrl = null;
        if (selectedPromoFile) {
            addPromoBtn.textContent = 'â³ Subiendo imagen...';
            imageUrl = await uploadPromoImage(selectedPromoFile);
        }
        addPromoBtn.textContent = 'â³ Publicando...';
        const data = {
            titulo,
            desc: document.getElementById('pr-desc').value.trim(),
            badgeText: document.getElementById('pr-badge').value.trim(),
            periodo: document.getElementById('pr-periodo').value.trim(),
            activa: true,
            createdAt: Date.now()
        };
        if (imageUrl) data.imageUrl = imageUrl;
        await addDoc(collection(db, 'promociones'), data);
        toast('âœ… PromociÃ³n publicada en el menÃº');
        ['pr-titulo', 'pr-desc', 'pr-badge', 'pr-periodo'].forEach(id => document.getElementById(id).value = '');
        clearPromoImage();
    } catch (e) { toast('âŒ Error al publicar promociÃ³n', true); console.error(e); }
    addPromoBtn.disabled = false;
    addPromoBtn.innerHTML = 'ðŸ”¥ Publicar promociÃ³n';
});

/* â”€â”€ PROMO LIST (real-time) â”€â”€ */
onSnapshot(collection(db, 'promociones'), snap => {
    const promos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const list = document.getElementById('promo-list');
    list.innerHTML = '';
    if (!promos.length) {
        list.innerHTML = '<div class="prod-empty"><div class="ei">ðŸ”¥</div><p>No hay promociones aÃºn. Â¡Crea la primera!</p></div>';
        return;
    }
    promos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    promos.forEach(p => {
        const isActive = p.activa !== false;
        const row = document.createElement('div');
        row.className = `prod-item${isActive ? '' : ' unavailable'}`;

        // Thumbnail with gradient overlay for description
        let thumbHTML;
        if (p.imageUrl) {
            thumbHTML = `
                        <div style="position:relative;width:60px;height:60px;flex-shrink:0;border-radius:.5rem;overflow:hidden">
                            <img src="${p.imageUrl}" alt="${p.titulo}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" />
                            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%)"></div>
                        </div>`;
        } else {
            thumbHTML = `<div class="prod-emoji">ðŸ”¥</div>`;
        }

        row.innerHTML = `
                    ${thumbHTML}
                    <div class="prod-info">
                        <div class="prod-name">${p.titulo}</div>
                        <div class="prod-meta">
                            <span class="prod-cat" style="${isActive ? 'color:var(--green)' : ''}">${isActive ? 'âœ… Activa' : 'â Inactiva'}</span>
                            ${p.badgeText ? `<span class="prod-cat" style="color:var(--orange)">${p.badgeText}</span>` : ''}
                            ${p.periodo ? `<span class="prod-cat" style="color:var(--teal)">ðŸ“… ${p.periodo}</span>` : ''}
                            ${p.desc ? `<span style="color:var(--muted);font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${p.desc}</span>` : ''}
                        </div>
                    </div>
                    <div class="prod-actions">
                        <button class="avail-toggle ${isActive ? 'available' : 'unavailable'}" data-pid="${p.id}">${isActive ? 'âœ… Activa' : 'â Inactiva'}</button>
                        <button class="delete-btn" data-pid="${p.id}" title="Eliminar">ðŸ—‘</button>
                    </div>`;
        list.appendChild(row);
    });
    // Bind events
    list.querySelectorAll('.avail-toggle[data-pid]').forEach(btn => btn.addEventListener('click', async () => {
        const pr = promos.find(x => x.id === btn.dataset.pid);
        if (!pr) return;
        try { await updateDoc(doc(db, 'promociones', pr.id), { activa: !pr.activa }); toast(pr.activa ? 'â PromociÃ³n desactivada' : 'âœ… PromociÃ³n activada'); }
        catch (e) { toast('âŒ Error al actualizar', true); }
    }));
    list.querySelectorAll('.delete-btn[data-pid]').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Â¿Eliminar esta promociÃ³n? No se puede deshacer.')) return;
        try { await deleteDoc(doc(db, 'promociones', btn.dataset.pid)); toast('ðŸ—‘ï¸ PromociÃ³n eliminada'); }
        catch (e) { toast('âŒ Error al eliminar', true); }
    }));
});

/* â”€â”€ TOAST â”€â”€ */
function toast(msg, warn = false) {
    const t = document.createElement('div');
    t.className = 'toast';
    if (warn) t.style.borderColor = 'rgba(251,191,36,.4)';
    t.textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(() => t.remove(), 2200);
}