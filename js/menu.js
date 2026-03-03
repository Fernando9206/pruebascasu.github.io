import { db, analytics } from './firebase.js';
import {
    collection, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

/* â”€â”€ WHATSAPP NUMBER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Pon aquÃ­ el nÃºmero del negocio con cÃ³digo de paÃ­s, sin +, espacios ni guiones
   Ejemplo MÃ©xico: 521XXXXXXXXXX  (52 = MÃ©xico, 1 = opcional, 10 dÃ­gitos)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const WA_NUMBER = '3315277392'; // â† CAMBIA ESTE NÃšMERO

/* â”€â”€ STATE â”€â”€ */
let allProducts = [];
let activeCategory = 'todos';
let searchQuery = '';
let cart = {};          // { firestoreId: { product, qty } }
let currentProduct = null;
let isOpen = true;      // controlled by Firestore config
let modalCarouselIdx = 0;
let modalPhotos = [];

/* â”€â”€ DOM â”€â”€ */
const menuGrid = document.getElementById('menu-grid');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const sectionLabel = document.getElementById('section-label');
const statProducts = document.getElementById('stat-products');
const openBadge = document.getElementById('open-badge');
const badgeText = document.getElementById('badge-text');
const closedBanner = document.getElementById('closed-banner');
const promosSection = document.getElementById('promos-section');
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const promoPrev = document.getElementById('promo-prev');
const promoNext = document.getElementById('promo-next');
const prodOverlay = document.getElementById('prod-overlay');
const prodModalClose = document.getElementById('prod-modal-close');
const modalPhotoTrack = document.getElementById('modal-photo-track');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');
const modalDots = document.getElementById('modal-dots');
const modalBadges = document.getElementById('modal-badges');
const modalName = document.getElementById('modal-name');
const modalDesc = document.getElementById('modal-desc');
const modalPrice = document.getElementById('modal-price');
const modalCat = document.getElementById('modal-cat');
const modalAddBtn = document.getElementById('modal-add-btn');
const cartFab = document.getElementById('cart-fab');
const cartFabBadge = document.getElementById('cart-fab-badge');
const cartPanelOverlay = document.getElementById('cart-panel-overlay');
const cartPanelClose = document.getElementById('cart-panel-close');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotal = document.getElementById('cart-total');
const sendWhatsappBtn = document.getElementById('send-whatsapp-btn');

const CAT_NAMES = {
    snacks: 'ðŸ¿ Snacks', dulces: 'ðŸ¬ Dulces',
    'bebidas-frias': 'ðŸ§ƒ Bebidas FrÃ­as',
    'bebidas-calientes': 'â˜• Bebidas Calientes',
    saludable: 'ðŸ¥— Saludable'
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FIREBASE LISTENERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

// Products
onSnapshot(collection(db, 'productos'), snap => {
    allProducts = snap.docs
        .map(d => ({ firestoreId: d.id, ...d.data() }))
        .filter(p => p.available !== false);
    statProducts.textContent = allProducts.length;
    renderGrid();
}, err => console.error('productos:', err));

// Status
onSnapshot(doc(db, 'config', 'negocio'), snap => {
    const status = snap.exists() ? (snap.data().status || 'open') : 'open';
    isOpen = status !== 'closed';
    if (!isOpen) {
        closedBanner.classList.remove('hidden');
        openBadge.style.background = 'rgba(248,113,113,.12)';
        openBadge.style.borderColor = 'rgba(248,113,113,.3)';
        openBadge.style.color = '#f87171';
        badgeText.textContent = 'Cerrado';
        document.querySelector('.open-dot').style.background = '#f87171';
    } else {
        closedBanner.classList.add('hidden');
        openBadge.style.cssText = '';
        badgeText.textContent = 'Abierto';
    }
    // Re-render grid to update button states
    renderGrid();
}, err => console.error('config:', err));

// Promotions
let promoCarouselIdx = 0;
let promoSlides = [];
let promoAutoTimer = null;

onSnapshot(collection(db, 'promociones'), snap => {
    const activePromos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.activa !== false)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!activePromos.length) {
        promosSection.style.display = 'none';
        return;
    }
    promosSection.style.display = 'block';
    promoSlides = activePromos;
    buildPromoCarousel(activePromos);
}, err => console.error('promociones:', err));

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PROMO CAROUSEL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function buildPromoCarousel(promos) {
    carouselTrack.innerHTML = '';
    carouselDots.innerHTML = '';
    promoCarouselIdx = 0;

    promos.forEach((p, i) => {
        const slide = document.createElement('div');
        slide.className = 'promo-slide';

        const imgHTML = p.imageUrl
            ? `<div class="promo-slide-img-wrap"><img class="promo-slide-img" src="${p.imageUrl}" alt="${p.titulo}" loading="lazy" /></div>`
            : `<div class="promo-slide-placeholder">ðŸ”¥</div>`;

        const badgeHTML = p.badgeText
            ? `<span class="promo-slide-badge">${p.badgeText}</span>` : '';
        const periodHTML = p.periodo
            ? `<div class="promo-slide-periodo">ðŸ“… ${p.periodo}</div>` : '';

        slide.innerHTML = `
                    ${imgHTML}
                    <div class="promo-slide-body">
                        ${periodHTML}
                        <div class="promo-slide-title">${p.titulo}</div>
                        <div class="promo-slide-desc">${p.desc || ''}</div>
                        ${badgeHTML}
                    </div>`;
        carouselTrack.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goPromoSlide(i));
        carouselDots.appendChild(dot);
    });

    updatePromoCarousel();
    startPromoAuto();
}

function goPromoSlide(idx) {
    promoCarouselIdx = Math.max(0, Math.min(idx, promoSlides.length - 1));
    updatePromoCarousel();
    startPromoAuto();
}

function updatePromoCarousel() {
    carouselTrack.style.transform = `translateX(-${promoCarouselIdx * 100}%)`;
    carouselDots.querySelectorAll('.carousel-dot').forEach((d, i) =>
        d.classList.toggle('active', i === promoCarouselIdx));
    promoPrev.disabled = promoCarouselIdx === 0;
    promoNext.disabled = promoCarouselIdx === promoSlides.length - 1;
}

function startPromoAuto() {
    clearInterval(promoAutoTimer);
    if (promoSlides.length > 1) {
        promoAutoTimer = setInterval(() => {
            promoCarouselIdx = (promoCarouselIdx + 1) % promoSlides.length;
            updatePromoCarousel();
        }, 5000);
    }
}

promoPrev.addEventListener('click', () => goPromoSlide(promoCarouselIdx - 1));
promoNext.addEventListener('click', () => goPromoSlide(promoCarouselIdx + 1));

// Touch swipe for promo carousel
let promoTouchX = 0;
const promoTrackWrap = document.getElementById('carousel-track-wrap');
promoTrackWrap.addEventListener('touchstart', e => { promoTouchX = e.touches[0].clientX; }, { passive: true });
promoTrackWrap.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - promoTouchX;
    if (Math.abs(dx) > 40) goPromoSlide(promoCarouselIdx + (dx < 0 ? 1 : -1));
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CATEGORY FILTERS & SEARCH
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderGrid();
    });
});

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderGrid();
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RENDER GRID
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function renderGrid() {
    let filtered = allProducts;

    if (activeCategory !== 'todos') {
        filtered = filtered.filter(p => p.cat === activeCategory);
    }
    if (searchQuery) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            (p.desc || '').toLowerCase().includes(searchQuery) ||
            (p.cat || '').toLowerCase().includes(searchQuery)
        );
    }

    resultCount.textContent = filtered.length;

    // Section label
    const labelEl = sectionLabel;
    if (searchQuery) {
        labelEl.childNodes[0].textContent = `ðŸ” Resultados para "${searchInput.value}" `;
    } else if (activeCategory !== 'todos') {
        labelEl.childNodes[0].textContent = `${CAT_NAMES[activeCategory] || activeCategory} `;
    } else {
        labelEl.childNodes[0].textContent = 'ðŸ”¥ Todos los productos ';
    }

    menuGrid.innerHTML = '';

    if (!filtered.length) {
        menuGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">ðŸ”</div>
                        <p>No encontramos <strong>"${searchInput.value || activeCategory}"</strong><br>Intenta con otra bÃºsqueda</p>
                    </div>`;
        return;
    }

    filtered.forEach((p, idx) => {
        const card = buildCard(p, idx);
        menuGrid.appendChild(card);
    });

    // After cards are in the DOM, calculate their position-based transform-origin
    // Use requestAnimationFrame to ensure layout has been calculated
    requestAnimationFrame(() => positionCards());
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SMART CARD POSITIONING
   Sets transform-origin per card so hover-scale always
   expands toward the center and never clips outside the viewport.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function positionCards() {
    const cards = menuGrid.querySelectorAll('.menu-card');
    if (!cards.length) return;

    const gridRect = menuGrid.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const cardW = r.width;
        const cardH = r.height;

        // -- Horizontal origin --
        // Distance from card left edge to grid left edge
        const distLeft = r.left - gridRect.left;
        // Distance from card right edge to grid right edge
        const distRight = gridRect.right - r.right;

        let ox;
        if (distLeft < cardW * 0.6) {
            // Card is at or near left edge â†’ expand to the right
            ox = 'left';
        } else if (distRight < cardW * 0.6) {
            // Card is at or near right edge â†’ expand to the left
            ox = 'right';
        } else {
            ox = 'center';
        }

        // -- Vertical origin --
        // If card is in the first row, expand downward
        // Use absolute position relative to viewport
        const distTop = r.top;          // from viewport top
        const distBottom = vh - r.bottom;  // from viewport bottom

        let oy;
        if (distTop < cardH * 1.2) {
            // Near top of viewport â†’ expand downward
            oy = 'top';
        } else if (distBottom < cardH * 1.2) {
            // Near bottom of viewport â†’ expand upward
            oy = 'bottom';
        } else {
            oy = 'center';
        }

        card.style.setProperty('--card-ox', ox);
        card.style.setProperty('--card-oy', oy);
    });
}

// Recalculate on window resize (grid columns can change)
window.addEventListener('resize', () => {
    clearTimeout(window._positionTimer);
    window._positionTimer = setTimeout(() => positionCards(), 120);
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BUILD CARD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function buildCard(p, idx) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.style.animationDelay = `${idx * 0.04}s`;

    // Photo source â€” support multiple photos (photos[]) or legacy imageUrl
    const photos = p.photos && p.photos.length ? p.photos : (p.imageUrl ? [p.imageUrl] : []);
    const hasMultiple = photos.length > 1;

    let imgHTML = '';
    if (photos.length) {
        // Card shows first photo; on hover/tap â†’ modal with carousel
        imgHTML = `
                    <div class="card-img" style="position:relative;background:none;">
                        <img src="${photos[0]}" alt="${p.name}"
                            style="width:100%;height:100%;object-fit:cover;display:block;transition:transform var(--trans);"
                            loading="lazy" />
                        ${hasMultiple ? `<span class="card-photo-count">ðŸ“· ${photos.length}</span>` : ''}
                    </div>`;
    } else {
        imgHTML = `<div class="card-img">${p.emoji || 'ðŸ¿'}</div>`;
    }

    const badgesHTML = (p.badges || []).map(b => {
        const cls = { hot: 'badge-hot', new: 'badge-new', pop: 'badge-pop' }[b] || '';
        const lbl = { hot: 'ðŸ”¥ Favorito', new: 'âœ¨ Nuevo', pop: 'â­ Popular' }[b] || b;
        return `<span class="badge ${cls}">${lbl}</span>`;
    }).join('');

    const addBtnHTML = isOpen
        ? `<button class="card-add-btn" data-id="${p.firestoreId}">ðŸ›’ Pedir</button>`
        : `<button class="card-add-btn" data-id="${p.firestoreId}" disabled style="opacity:.45;cursor:not-allowed;filter:grayscale(1);">ðŸ”’ Cerrado</button>`;

    card.innerHTML = `
                <div class="card-badges">${badgesHTML}</div>
                ${imgHTML}
                <div class="card-body">
                    <div class="card-name">${p.name}</div>
                    ${p.desc ? `<div class="card-desc">${p.desc}</div>` : ''}
                    <div class="card-footer">
                        <div class="card-price"><span class="currency">$</span>${p.price}<span class="currency">MXN</span></div>
                        ${addBtnHTML}
                    </div>
                </div>`;

    // Touch devices â†’ open modal on tap
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    card.addEventListener('click', e => {
        if (e.target.closest('.card-add-btn')) return; // handled separately
        openModal(p);
    });

    // Desktop hover â†’ carousel activates automatically inside the enlarged card
    if (!isTouchDevice && hasMultiple) {
        let hoverIdx = 0;
        let hoverTimer = null;
        const imgEl = card.querySelector('.card-img img');
        card.addEventListener('mouseenter', () => {
            hoverIdx = 0;
            hoverTimer = setInterval(() => {
                hoverIdx = (hoverIdx + 1) % photos.length;
                if (imgEl) imgEl.src = photos[hoverIdx];
            }, 900);
        });
        card.addEventListener('mouseleave', () => {
            clearInterval(hoverTimer);
            if (imgEl) imgEl.src = photos[0];
        });
    }

    // "Pedir" button
    card.querySelector('.card-add-btn').addEventListener('click', e => {
        e.stopPropagation();
        if (!isOpen) return; // block orders when closed
        addToCart(p);
        animateFab();
    });

    return card;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRODUCT MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function openModal(p) {
    currentProduct = p;
    modalCarouselIdx = 0;
    modalPhotos = p.photos && p.photos.length ? p.photos : (p.imageUrl ? [p.imageUrl] : []);

    // Build photo carousel
    modalPhotoTrack.innerHTML = '';
    modalDots.innerHTML = '';
    modalPrev.style.display = 'none';
    modalNext.style.display = 'none';

    if (modalPhotos.length) {
        modalPhotos.forEach((url, i) => {
            const slide = document.createElement('div');
            slide.className = 'modal-photo-slide';
            slide.innerHTML = `<img src="${url}" alt="${p.name}" loading="${i === 0 ? 'eager' : 'lazy'}" />`;
            modalPhotoTrack.appendChild(slide);
        });
        if (modalPhotos.length > 1) {
            modalPrev.style.display = 'grid';
            modalNext.style.display = 'grid';
            modalPhotos.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'modal-carousel-dot' + (i === 0 ? ' active' : '');
                dot.addEventListener('click', () => goModalSlide(i));
                modalDots.appendChild(dot);
            });
        }
    } else {
        // Emoji fallback
        const slide = document.createElement('div');
        slide.className = 'modal-photo-slide';
        slide.textContent = p.emoji || 'ðŸ¿';
        modalPhotoTrack.appendChild(slide);
    }

    // Info
    modalBadges.innerHTML = (p.badges || []).map(b => {
        const cls = { hot: 'badge-hot', new: 'badge-new', pop: 'badge-pop' }[b] || '';
        const lbl = { hot: 'ðŸ”¥ Favorito', new: 'âœ¨ Nuevo', pop: 'â­ Popular' }[b] || b;
        return `<span class="badge ${cls}">${lbl}</span>`;
    }).join('');
    modalName.textContent = p.name;
    modalDesc.textContent = p.desc || '';
    modalPrice.textContent = p.price;
    modalCat.textContent = CAT_NAMES[p.cat] || p.cat || '';

    // "Agregar" button state
    const inCart = cart[p.firestoreId];
    if (!isOpen) {
        modalAddBtn.textContent = 'ðŸ”’ Estamos cerrados';
        modalAddBtn.disabled = true;
        modalAddBtn.style.opacity = '.45';
        modalAddBtn.style.filter = 'grayscale(1)';
        modalAddBtn.style.cursor = 'not-allowed';
    } else {
        modalAddBtn.textContent = inCart ? `âœ… En pedido (${inCart.qty}x) Â· Agregar mÃ¡s` : 'ðŸ›’ Agregar al pedido';
        modalAddBtn.classList.toggle('added', !!inCart);
        modalAddBtn.disabled = false;
        modalAddBtn.style.opacity = '';
        modalAddBtn.style.filter = '';
        modalAddBtn.style.cursor = '';
    }

    prodOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    updateModalCarousel();
}

function closeModal() {
    prodOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Modal carousel navigation
function goModalSlide(idx) {
    modalCarouselIdx = Math.max(0, Math.min(idx, modalPhotos.length - 1));
    updateModalCarousel();
}

function updateModalCarousel() {
    modalPhotoTrack.style.transform = `translateX(-${modalCarouselIdx * 100}%)`;
    modalDots.querySelectorAll('.modal-carousel-dot').forEach((d, i) =>
        d.classList.toggle('active', i === modalCarouselIdx));
    modalPrev.style.opacity = modalCarouselIdx === 0 ? '.35' : '1';
    modalNext.style.opacity = modalCarouselIdx === modalPhotos.length - 1 ? '.35' : '1';
}

modalPrev.addEventListener('click', () => goModalSlide(modalCarouselIdx - 1));
modalNext.addEventListener('click', () => goModalSlide(modalCarouselIdx + 1));
prodOverlay.addEventListener('click', e => { if (e.target === prodOverlay) closeModal(); });
prodModalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Touch swipe on modal carousel
let modalTouchX = 0;
const modalPhotoCarousel = document.getElementById('modal-photo-carousel');
modalPhotoCarousel.addEventListener('touchstart', e => { modalTouchX = e.touches[0].clientX; }, { passive: true });
modalPhotoCarousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - modalTouchX;
    if (Math.abs(dx) > 40) goModalSlide(modalCarouselIdx + (dx < 0 ? 1 : -1));
});

// Add to cart from modal
modalAddBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    if (!isOpen) return; // block orders when closed
    addToCart(currentProduct);
    const qty = cart[currentProduct.firestoreId]?.qty || 1;
    modalAddBtn.textContent = `âœ… En pedido (${qty}x) Â· Agregar mÃ¡s`;
    modalAddBtn.classList.add('added');
    animateFab();
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CART
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function addToCart(p) {
    if (cart[p.firestoreId]) {
        cart[p.firestoreId].qty++;
    } else {
        cart[p.firestoreId] = { product: p, qty: 1 };
    }
    updateCartFab();
}

function removeFromCart(id) {
    delete cart[id];
    updateCartFab();
    renderCartPanel();
}

function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) {
        removeFromCart(id);
    } else {
        updateCartFab();
        renderCartPanel();
    }
}

function getCartCount() {
    return Object.values(cart).reduce((s, v) => s + v.qty, 0);
}

function getCartTotal() {
    return Object.values(cart).reduce((s, v) => s + v.qty * v.product.price, 0);
}

function updateCartFab() {
    const count = getCartCount();
    if (count > 0) {
        cartFab.classList.add('visible');
        cartFabBadge.textContent = count;
    } else {
        cartFab.classList.remove('visible');
        closeCartPanel();
    }
}

function animateFab() {
    cartFab.style.transform = 'scale(1.2)';
    setTimeout(() => { cartFab.style.transform = ''; }, 250);
}

function openCartPanel() {
    renderCartPanel();
    cartPanelOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartPanel() {
    cartPanelOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

cartFab.addEventListener('click', openCartPanel);
cartPanelClose.addEventListener('click', closeCartPanel);
cartPanelOverlay.addEventListener('click', e => { if (e.target === cartPanelOverlay) closeCartPanel(); });

function renderCartPanel() {
    const items = Object.entries(cart);
    if (!items.length) {
        cartItemsList.innerHTML = '<div class="cart-empty-msg">Tu pedido estÃ¡ vacÃ­o ðŸ¥º<br>Agrega algo del menÃº</div>';
        cartTotal.textContent = '$0 MXN';
        return;
    }

    cartItemsList.innerHTML = '';
    items.forEach(([id, { product: p, qty }]) => {
        const firstPhoto = (p.photos && p.photos.length) ? p.photos[0] : p.imageUrl;
        const thumbHTML = firstPhoto
            ? `<img class="cart-item-img" src="${firstPhoto}" alt="${p.name}" />`
            : `<span class="cart-item-emoji">${p.emoji || 'ðŸ¿'}</span>`;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
                    ${thumbHTML}
                    <div class="cart-item-info">
                        <div class="cart-item-name">${p.name}</div>
                        <div class="cart-item-price">$${p.price} MXN c/u Â· Subtotal: $${(p.price * qty)}</div>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn del" data-id="${id}">âˆ’</button>
                        <span class="qty-num">${qty}</span>
                        <button class="qty-btn add" data-id="${id}">+</button>
                    </div>`;
        div.querySelector('.qty-btn.del').addEventListener('click', () => changeQty(id, -1));
        div.querySelector('.qty-btn.add').addEventListener('click', () => changeQty(id, 1));
        cartItemsList.appendChild(div);
    });

    cartTotal.textContent = `$${getCartTotal()} MXN`;
}

/* â”€â”€ SEND TO WHATSAPP â”€â”€ */
sendWhatsappBtn.addEventListener('click', () => {
    const items = Object.values(cart);
    if (!items.length) return;

    let msg = `Hola Casuarina Snacks ðŸ”, me gustarÃ­a pedir:\n\n`;
    items.forEach(({ product: p, qty }) => {
        msg += `${qty}x ${p.name} ($${p.price * qty} MXN)\n`;
    });
    msg += `\nTotal estimado: $${getCartTotal()} MXN`;
    msg += `\n\nÂ¿En cuÃ¡nto tiempo puedo pasar por Ã©l?`;

    // ðŸ“Š Registrar evento en Firebase Analytics
    logEvent(analytics, 'click_whatsapp', {
        event_category: 'Ventas',
        event_label: 'Pedido Enviado',
        value: getCartTotal()
    });

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PWA â€” Service Worker + Install Prompt
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
}

let deferredPrompt = null;
const pwaBanner = document.getElementById('pwa-banner');
const pwaInstallBtn = document.getElementById('pwa-install-btn');
const pwaDismissBtn = document.getElementById('pwa-dismiss-btn');

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Show banner after 3 seconds only if not dismissed before
    if (!sessionStorage.getItem('pwa-dismissed')) {
        setTimeout(() => pwaBanner.classList.add('show'), 3000);
    }
});

pwaInstallBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    pwaBanner.classList.remove('show');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
});

pwaDismissBtn.addEventListener('click', () => {
    pwaBanner.classList.remove('show');
    sessionStorage.setItem('pwa-dismissed', '1');
});

window.addEventListener('appinstalled', () => {
    pwaBanner.classList.remove('show');
    deferredPrompt = null;
});
