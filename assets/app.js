/* KRSAANGI storefront prototype — shared shell.
   Catalog comes from window.KR_DATA (generated from the live Shopify feed).
   In production the same shapes are served by the Storefront API + metafields. */
(() => {
  'use strict';
  const D = window.KR_DATA, P = D.products, COL = D.collections, LEX = D.lexicon;
  const byId = new Map(P.map(p => [p.id, p])), byHandle = new Map(P.map(p => [p.handle, p]));
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const img = (src, w) => src + (src.includes('?') ? '&' : '?') + 'width=' + w;
  const srcset = (src, ws) => ws.map(w => `${img(src, w)} ${w}w`).join(', ');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // cross-page transitions (CSS @view-transition) can be interrupted by a quick second navigation; that is harmless, so don't report it
  const quietVT = e => ['ready', 'finished', 'updateCallbackDone'].forEach(k => e.viewTransition?.[k]?.catch(() => {}));
  addEventListener('pagereveal', quietVT); addEventListener('pageswap', quietVT);

  /* ── CMS-editable settings (theme settings / metaobject in production) ── */
  const SHOP = 'https://krsaangi.us';
  const SETTINGS = {
    // Verified on krsaangi.us/pages/contact. "Complimentary US shipping" is not published on the live site, so it is not claimed.
    announcement: 'Ships from the USA · International shipping to select countries, rates at checkout',
    tagline: 'Carefully curated. Tastefully designed.',           // the line on Krsaangi's own logo
    logo: 'https://cdn.shopify.com/s/files/1/0808/4704/4859/files/image0_5.jpg?v=1776374911', // official asset from the live theme
    email: 'krsaangi.info@gmail.com',
    instagram: 'https://www.instagram.com/krsaangi/',
    /* Live Instagram feed: a JSON URL from a feed service (e.g. Behold.so) or a small serverless proxy for
       the Instagram Graph API that keeps the token server-side. Empty means the curated fallback is shown.
       TODO(Akhil): set this. See docs/instagram-feed.md. */
    instagramFeedUrl: '',
    askPromptDelay: 10,                                            // seconds on site (this session) before the Ask prompt
    account: SHOP + '/account',                                    // Shopify customer accounts (email + one-time code)
    whatsappChannel: '#whatsapp-channel-pending',                  // not supplied yet, never invented
    whatsappChat: '#whatsapp-number-pending',
    /* Free shipping. The site only shows the message; Shopify applies the real rate at checkout.
       TODO(Vidya): confirm the threshold is on the subtotal before discounts (that is what this uses).
       TODO(Akhil): set up the matching free-shipping rate in Shopify admin (Settings → Shipping and delivery). */
    freeShippingThreshold: 400,
    /* "Email me my bag". POSTs { email, consent, items, url } as JSON. Empty means not connected yet.
       TODO(Akhil): point at Klaviyo or a small function using the Shopify customer API. See docs/abandoned-checkout.md. */
    cartCaptureUrl: '',
    /* GA4 measurement ID, e.g. 'G-XXXXXXX'. Empty means nothing is loaded and events stay in window.dataLayer.
       TODO(Akhil): set it. See docs/telemetry.md for joining this site's events with Shopify's checkout data. */
    ga4Id: '',
  };
  /* FILMS — the one place to swap video. REELS is the list of Krsaangi's own films (Shopify CDN; a film is
     { src, poster }). FILM_SLOTS says where each plays: numbers are positions in REELS, and `feature` is the
     handle of a product whose own Shopify video backs the Vintage Kanjivarams banner. To change a film,
     replace an entry in REELS or change a number here. Nothing else needs editing. */
  const reel = (id, n) => ({ src: `https://cdn.shopify.com/videos/c/vp/${id}/${id}.HD-720p-1.6Mbps-${n}.mp4`, poster: `https://cdn.shopify.com/s/files/1/0808/4704/4859/files/preview_images/${id}.thumbnail.0000000000.jpg` });
  const REELS = [reel('1de7aaf90acb4587b4dedd3f5914a242', 86636389), reel('45219f3dd7f04a2c8ae94ee3ba59ede0', 86636390), reel('5a19e023a74548a2b707bdaa0fb8c37d', 86636264),
    reel('fc07db86af2148eba0d405928a0351d4', 86636998), reel('1feae496c21e422589b2657fab9c5a24', 86636997), reel('a82e1539eadf49aea60309adf6ec5fa3', 86637000)];
  const FILM_SLOTS = { hero: 0, heroSides: [4, 5], band: [1, 2, 3], instagram: [4, 5], feature: 'pazhamai-project-vintage-recreation-saree-118' };

  /* ── icons: one thin-line family ─────────────────────────────────────── */
  const I = {
    search: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
    user: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.7"/><path d="M4.5 20.5c1-4 4-5.6 7.5-5.6s6.500 1.600 7.500 5.600"/></svg>',
    heart: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.500-4.600-7.500-10.100A4.300 4.300 0 0 1 12 7.300a4.300 4.300 0 0 1 7.500 2.600C19.500 15.400 12 20 12 20Z"/></svg>',
    bag: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.500h14l-1 12H6l-1-12Z"/><path d="M9 8.500V7a3 3 0 0 1 6 0v1.500"/></svg>',
    menu: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.500 8h17M3.500 16h17"/></svg>',
    x: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    plus: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    filter: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.500c.6 4.600 3.400 7.400 8 8-4.600.6-7.400 3.400-8 8-.6-4.600-3.400-7.400-8-8 4.600-.6 7.400-3.400 8-8Z"/></svg>',
    zoom: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500M11 8.500v5M8.500 11h5"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.500 8 12 4l8.500 4v8.500L12 20.500 3.500 16.500V8Z"/><path d="M3.500 8 12 12l8.500-4M12 12v8.500"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.500" y="6" width="17" height="12.500" rx="1"/><path d="m4 7 8 6.500L20 7"/></svg>',
    hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/></svg>',
    chat: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4v-11Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5L7 4.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    moon: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/></svg>',
    sun: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>',
    ig: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.7"/><circle cx="16.7" cy="7.3" r=".6" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="1"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.500A9.400 9.400 0 0 0 3.900 16.700L2.700 21.300l4.700-1.200A9.400 9.400 0 1 0 12 2.500Zm0 1.700a7.700 7.700 0 1 1-3.900 14.300l-.3-.2-2.700.7.7-2.600-.2-.3A7.700 7.700 0 0 1 12 4.200Zm-3.300 3.700c-.2 0-.5 0-.7.300-.300.300-1 1-1 2.300s1 2.700 1.100 2.900c.100.200 1.900 3 4.700 4.100 2.300.900 2.800.700 3.300.700.500-.100 1.600-.700 1.800-1.300.200-.600.200-1.200.200-1.300-.100-.100-.300-.200-.600-.300l-1.900-.900c-.300-.100-.500-.100-.700.200l-.800 1c-.100.200-.300.200-.600.100-.300-.200-1.200-.500-2.200-1.400-.800-.700-1.400-1.600-1.500-1.900-.200-.300 0-.400.100-.600l.400-.500.300-.500c.100-.200 0-.400 0-.500l-.900-2.100c-.200-.500-.400-.400-.600-.400Z"/></svg>',
  };

  const inColl = (p, k) => (p.colls || [p.collection]).includes(k);
  const counts = {}; P.forEach(p => (p.colls || [p.collection]).forEach(k => counts[k] = (counts[k] || 0) + 1));

  /* ── helpers on products ─────────────────────────────────────────────── */
  const newest = P.reduce((m, p) => p.published > m ? p.published : m, '');
  const dayDiff = (a, b) => (new Date(a) - new Date(b)) / 864e5;
  const status = p => p.available ? 'in' : p.preorder ? 'pre' : 'out';
  const STATUS = { in: 'In Stock', pre: 'Pre-order', out: 'Sold out' };
  const isNew = p => dayDiff(newest, p.published) <= 10;
  const collName = p => COL[p.collection]?.name || '';
  const kicker = p => [collName(p), p.weave && p.weave !== collName(p) && !collName(p).includes(p.weave) && !collName(p).includes(p.weave.split(' ')[0]) ? p.weave : (p.type !== 'Saree' && !collName(p).includes(p.type) ? p.type : '')].filter(Boolean).join(' · ');
  const url = p => `product.html?h=${encodeURIComponent(p.handle)}`;
  const dot = c => c ? `<i class="dot ${c.hex === 'multi' ? 'dot--multi' : ''}" style="${c.hex === 'multi' ? '' : 'background:' + c.hex}"></i>` : '';
  const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const preWindow = p => p.preorder ? `${fmtDate(p.preorder.from)} – ${fmtDate(p.preorder.to)}, ${p.preorder.to.slice(0, 4)}` : '';
  const availHTML = p => `<span class="avail avail--${status(p)}">${STATUS[status(p)]}</span>`;

  /* ── appearance: follows the system on first visit, then remembers the customer's choice ── */
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  function setTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('kr_theme', root.dataset.theme); } catch { /* choice lasts for this page */ }
    paintTheme();
  }
  function paintTheme() {
    const d = isDark();
    $$('[data-theme-toggle]').forEach(b => { b.setAttribute('aria-pressed', d); b.querySelector('[data-ico]').innerHTML = d ? I.sun : I.moon; b.querySelector('[data-lbl]').textContent = d ? 'Light' : 'Dark'; b.setAttribute('aria-label', d ? 'Switch to light appearance' : 'Switch to dark appearance'); });
  }

  /* ── analytics: one typed event layer (GA4 / Shopify pixel in prod) ──── */
  /* One event layer for the whole site. GA4 event names and parameters, so the same events work in
     GA4 (when SETTINGS.ga4Id is set), GTM or a Shopify custom pixel. Nothing personal is recorded:
     keys that name a person are dropped, and any value that looks like an email or phone number is removed.
     Add ?debug=1 to any URL to print every event in the console for this browser session (?debug=0 stops it). */
  window.dataLayer = window.dataLayer || [];
  const DEBUG = (() => { try { const q = location.search; if (/[?&]debug=1\b/.test(q)) sessionStorage.setItem('kr_debug', '1'); if (/[?&]debug=0\b/.test(q)) sessionStorage.removeItem('kr_debug'); return sessionStorage.getItem('kr_debug') === '1'; } catch { return false; } })();
  const PII_KEY = /^(email|e_?mail|phone|tel|name|first_?name|last_?name|address|address\d|zip|postcode)$/i;
  const PII_VAL = /[^\s@]+@[^\s@]+\.[^\s@]+|\+?\d[\d\s().-]{7,}\d/;
  const scrub = v => Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' && !(v instanceof Function) ? Object.fromEntries(Object.entries(v).filter(([k, x]) => x !== undefined && !PII_KEY.test(k) && !(typeof x === 'string' && !/(^|_)id$|variant|coupon/.test(k) && PII_VAL.test(x))).map(([k, x]) => [k, scrub(x)])) : v;
  function track(event, props = {}) {
    const { event_callback, ...rest } = props;
    const data = scrub(rest);
    window.dataLayer.push({ event, ...data });
    if (window.gtag && SETTINGS.ga4Id) window.gtag('event', event, { ...data, ...(event_callback ? { event_callback, transport_type: 'beacon' } : {}) });
    else event_callback?.();
    if (DEBUG) console.log(`%c[track] ${event}`, 'color:#B8923A;font-weight:600', data);
  }
  function loadGA4() {
    const id = SETTINGS.ga4Id; if (!id) return;
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false });     // page_view is sent by track() with page_type
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id); document.head.append(s);
  }
  /* GA4 item shape. ids are Shopify product ids; item_variant is the size where there is one. */
  const gaItem = (p, extra = {}) => ({ item_id: String(p.id), item_name: p.name, item_brand: 'Krsaangi', item_category: p.type, item_category2: p.weave || undefined, item_category3: COL[p.collection]?.name, price: p.price, ...extra });
  const lineItems = () => bag.map(l => { const p = byId.get(l.id), v = variantOf(p, l.vid); return gaItem(p, { item_variant: v?.title, price: v?.price ?? p.price, quantity: l.qty }); });
  const bagValue = () => bag.reduce((s, l) => { const p = byId.get(l.id); return s + (variantOf(p, l.vid)?.price ?? p.price) * l.qty; }, 0);

  /* ── persistent state ────────────────────────────────────────────────── */
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: state lives for this page only */ } },
  };
  const variantOf = (p, vid) => p.variants.find(v => v.id === vid) || null;
  let bag = store.get('kr_bag', []).filter(l => byId.has(l.id)).map(l => ({ id: l.id, vid: l.vid || byId.get(l.id).vid, qty: l.qty }));
  let wish = new Set(store.get('kr_wish', []).filter(id => byId.has(id)));
  const bagCount = () => bag.reduce((n, l) => n + l.qty, 0);
  const emit = name => document.dispatchEvent(new CustomEvent(name));
  /* Adds one real Shopify variant. Refuses anything Shopify reports as unavailable. */
  function addToBag(id, { open = true, source = 'pdp', vid } = {}) {
    const p = byId.get(id);
    /* Only an in-stock variant can go to checkout. Pre-order is a scaffold: Shopify would reject a sold-out
       variant in the cart permalink. To make it purchasable, Krsaangi either turns on "Continue selling when
       out of stock" for that variant, or adds a pre-order app / selling plan (Shopify "purchase options"), which
       also carries deposit-or-full payment and the fulfilment date. TODO(Vidya): pre-order payment rules. */
    if (!p || status(p) !== 'in') return false;
    if (p.variants.length > 1 && !vid) { location.href = url(p) + '#size'; return false; }       // a size must be chosen on the product page
    vid = vid || p.vid;
    const v = variantOf(p, vid);
    if (v && !v.available) { toast(`Size ${v.title} is sold out.`); return false; }
    const line = bag.find(l => l.vid === vid);
    if (line) line.qty += 1; else bag.push({ id, vid, qty: 1 });
    store.set('kr_bag', bag);
    track('add_to_cart', { currency: 'USD', value: v?.price ?? p.price, source, items: [gaItem(p, { item_variant: v?.title, price: v?.price ?? p.price, quantity: 1 })] });
    emit('kr:bag');
    if (open) openCart();
    return true;
  }
  function setQty(vid, q) {
    if (q <= 0) { const l = bag.find(x => x.vid === vid), p = l && byId.get(l.id), v = p && variantOf(p, vid); bag = bag.filter(x => x.vid !== vid); if (p) track('remove_from_cart', { currency: 'USD', value: (v?.price ?? p.price) * l.qty, items: [gaItem(p, { item_variant: v?.title, price: v?.price ?? p.price, quantity: l.qty })] }); }
    else bag.find(l => l.vid === vid).qty = q;
    store.set('kr_bag', bag); emit('kr:bag');
  }
  /* Shopify cart permalink: hands the exact variants and quantities to Krsaangi's own secure Shopify checkout. */
  const checkoutUrl = code => `${SHOP}/cart/${bag.map(l => `${l.vid}:${l.qty}`).join(',')}${code ? '?discount=' + encodeURIComponent(code) : ''}`;
  function toggleWish(id) {
    wish.has(id) ? wish.delete(id) : wish.add(id);
    store.set('kr_wish', [...wish]); emit('kr:wish');
    { const p = byId.get(id); track(wish.has(id) ? 'add_to_wishlist' : 'remove_from_wishlist', { currency: 'USD', value: p.price, items: [gaItem(p)] }); }
    toast(wish.has(id) ? 'Saved to your wishlist' : 'Removed from your wishlist', wish.has(id) ? { label: 'View', href: 'collection.html?wishlist=1' } : null);
  }

  /* ── product card ────────────────────────────────────────────────────── */
  function card(p, { eager = false, sizes = '(max-width:640px) 50vw, (max-width:1180px) 33vw, 25vw' } = {}) {
    const st = status(p), a = p.images[0], b = p.images[1];
    const label = st === 'pre' ? '<span class="pc__label pc__label--pre">Pre-order</span>' : st === 'out' ? '<span class="pc__label pc__label--out">Sold out</span>' : (isNew(p) ? '<span class="pc__label">New</span>' : '');
    const alt = `${p.name}${p.colorLine ? ', ' + p.colorLine : ''} — ${kicker(p)}`;
    return `<article class="pc ${st === 'out' ? 'is-out' : ''}" data-id="${p.id}">
      <a class="pc__media" href="${url(p)}" tabindex="-1" aria-hidden="true">
        <img src="${img(a.src, 600)}" srcset="${srcset(a.src, [320, 480, 640, 900])}" sizes="${sizes}" width="${a.w || 3}" height="${a.h || 4}" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
        ${b ? `<img class="pc__alt" src="${img(b.src, 600)}" srcset="${srcset(b.src, [320, 480, 640, 900])}" sizes="${sizes}" alt="" loading="lazy" decoding="async">` : ''}
        ${label}${p.media ? `<span class="vtag">${I.play} Video</span>` : ''}
      </a>
      <div class="pc__quickwrap">
        <button class="pc__wish" data-wish="${p.id}" aria-pressed="${wish.has(p.id)}" aria-label="Save ${esc(p.name)} to wishlist">${I.heart}</button>
        <button class="pc__quick" data-quick="${p.id}">Quick view</button>
      </div>
      <div class="pc__body">
        <p class="pc__coll">${esc(kicker(p))}</p>
        <h3 class="pc__name"><a href="${url(p)}" aria-label="${esc(alt)}">${esc(p.name)}</a></h3>
        <p class="pc__color">${p.color ? dot(p.color) + dot(p.color2) : ''}<span>${esc(p.colorLine)}</span></p>
        <div class="pc__foot"><span class="price">${money(p.price)}${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ''}</span>${availHTML(p)}</div>
      </div></article>`;
  }

  /* ══ SEARCH ENGINE ══════════════════════════════════════════════════════
     Natural-language query → structured intent over catalog attributes.
     Aliases widen discovery ("dark red" finds Arakku) but the exact
     traditional colour name always stays on the product. */
  const FAMILY_WORDS = {
    red: 'Red', reds: 'Red', 'dark red': 'Red', 'deep red': 'Red', scarlet: 'Red', burgundy: 'Red',
    pink: 'Pink', pinks: 'Pink', rose: 'Pink', fuchsia: 'Pink',
    blue: 'Blue', blues: 'Blue', turquoise: 'Blue', azure: 'Blue',
    green: 'Green', greens: 'Green',
    purple: 'Purple', purples: 'Purple', eggplant: 'Purple', plum: 'Purple', mauve: 'Purple',
    yellow: 'Yellow & Gold', gold: 'Yellow & Gold', golden: 'Yellow & Gold',
    orange: 'Orange', saffron: 'Orange',
    ivory: 'Ivory & Neutrals', white: 'Ivory & Neutrals', cream: 'Ivory & Neutrals', neutral: 'Ivory & Neutrals', beige: 'Ivory & Neutrals', grey: 'Ivory & Neutrals', gray: 'Ivory & Neutrals',
    brown: 'Earth & Brown', earthy: 'Earth & Brown',
    black: 'Black', multicolor: 'Multicolor', multicolour: 'Multicolor', multi: 'Multicolor',
  };
  const FAMILIES = ['Red', 'Pink', 'Purple', 'Blue', 'Green', 'Yellow & Gold', 'Orange', 'Ivory & Neutrals', 'Earth & Brown', 'Black', 'Multicolor'];
  const FAMILY_HEX = { Red: '#8C2430', Pink: '#C2456B', Purple: '#5E2D79', Blue: '#1E5F92', Green: '#2F6B46', 'Yellow & Gold': '#D9A21B', Orange: '#C9602A', 'Ivory & Neutrals': '#E9DFC8', 'Earth & Brown': '#6B4A32', Black: '#1C1B1A', Multicolor: 'multi' };
  const FAMILY_ALIAS = { Reds: 'Red', Pinks: 'Pink', Purples: 'Purple', Blues: 'Blue', Greens: 'Green' };   // old plural links keep working
  const EXACT = new Map(LEX.filter(l => !(l.term in FAMILY_WORDS)).map(l => [l.term, l]));
  const colourTerms = [...new Set([...EXACT.keys(), ...Object.keys(FAMILY_WORDS)])].sort((a, b) => b.length - a.length);
  const colourRe = new RegExp('\\b(' + colourTerms.map(t => t.replace(/ /g, '\\s+')).join('|') + ')\\b');
  const WEAVES = [
    ['Kanchi Cotton', /\bkanchi cottons?\b/],
    ['Kanjivaram', /\b(kanjivarams?|kanjeevarams?|kanchipuram|kancheepuram|kanchi pattu|pattu)\b/],
    ['Gadwal', /\bgadwals?\b/], ['Jamdani', /\bjamdanis?\b/], ['Madurai Sungudi', /\bsungudi\b/], ['Moirang Phee', /\bmoirang( phee)?\b/],
    ['Ajrakh', /\bajrakhs?\b/], ['Patola', /\bpatolas?\b/], ['Baluchari', /\bbalucharis?\b/], ['Pochampally Ikat', /\bpochampally( ikats?)?\b/],
    ['Odisha Ikat', /\b(odisha|orissa)( ikats?)?\b/], ['Ikat', /\bikats?\b/], ['Silk Cotton', /\bsilk[- ]cottons?\b/], ['Kotpad', /\bkotpad\b/],
    ['Bhujodi', /\bbhujodi\b/], ['Tussar', /\btussars?\b/], ['Kodalikaruppur', /\bkodali\w*\b/],
  ];
  const TYPES = [['Blouse', /\bblouses?\b/], ['Jewellery', /\b(jewel(le)?ry|jhumkas?|necklaces?|earrings?|chokers?)\b/], ['Accessory', /\b(clutch(es)?|potlis?|bags?|accessor(y|ies))\b/], ['Kids', /\b(kids?|girls?|children|pavadai)\b/], ['Saree', /\b(sarees?|saris?)\b/]];
  const MOTIFS = [['Checks', /\b(checks?|checked|kattam|plaids?)\b/], ['Stripes', /\b(stripes?|striped)\b/], ['Butta', /\bbuttas?\b/], ['Peacock', /\b(peacock motif|mayil)\b/], ['Bird', /\b(birds?|pakshi|kili|annam)\b/], ['Paisley', /\b(paisley|manga|mango motif)\b/], ['Floral', /\b(floral|flowers?)\b/], ['Jaal', /\bjaal\b/]];
  const BORDERS = [['Korvai', /\bkorvai\b/], ['Small Border', /\bsmall borders?\b/], ['Temple', /\btemple( borders?)?\b/], ['Rettapettu', /\brettapettu\b/]];
  // Curation rules: occasion/style words that the catalog does not tag yet. Each rule is stated to the customer.
  const RULES = [
    [/\b(wedding|bridal|bride|muhurtham|reception)\b/, { weave: 'Kanjivaram', zari: 'Zari', type: 'Saree' }, 'Wedding', 'Kanjivaram silk with zari'],
    [/\b(vintage|heirloom|old[- ]world|retro)( style| inspired)?\b/, { collections: ['pazhamai', 'maathey'] }, 'Vintage', 'Pazhamai & Maathey'],
    [/\b(light ?weight|light|breathable|airy)\b/, { fabrics: ['Cotton', 'Khadi', 'Silk Cotton', 'Silk'] }, 'Lightweight', 'Gadwal, silk cotton, cotton & khadi'],
    [/\b(everyday|daily|office|casual)\b/, { fabrics: ['Cotton', 'Khadi', 'Silk Cotton'] }, 'Everyday', 'Cotton, khadi & silk cotton'],
    [/\b(festive|festival|pooja|puja|temple visit|traditional)\b/, { type: 'Saree', fabrics: ['Pure Silk', 'Silk', 'Silk Cotton'] }, 'Festive', 'Silks & silk cottons'],
    [/\b(gift|gifting|present)\b/, { types: ['Jewellery', 'Accessory', 'Blouse'] }, 'Gifting', 'Jewellery, potlis & blouses'],
  ];
  const STOP = new Set('a an the with and or for in of to me my i show find need want looking something some that is are style inspired piece pieces please under over color colour colored coloured border borders zari no ready ship stock from by on it this any need'.split(' '));

  // typo tolerance: snap unknown words to the catalog vocabulary
  const VOCAB = new Set(('kanjivaram gadwal jamdani sungudi pochampally ikat ajrakh moirang patola baluchari kotpad bhujodi tussar korvai kattam butta zari saree blouse jewellery clutch potli vintage wedding bridal festive lightweight ' +
    colourTerms.join(' ') + ' ' + Object.values(COL).map(c => c.name.toLowerCase()).join(' ')).split(/\s+/).filter(w => w.length > 3));
  // every word Krsaangi already uses in a title or description counts as correctly spelled
  const KNOWN = new Set(P.flatMap(p => (p.sourceTitle + ' ' + p.story).toLowerCase().split(/[^a-z]+/)).filter(w => w.length > 3));
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function fixTypos(q) {
    let fixed = false;
    const out = q.split(/\s+/).map(w => {
      if (w.length < 4 || VOCAB.has(w) || KNOWN.has(w) || STOP.has(w) || /\d/.test(w)) return w;
      let best = null, bd = w.length > 7 ? 4 : w.length > 4 ? 3 : 2;
      const grams = x => new Set(Array.from({ length: x.length - 1 }, (_, i) => x.slice(i, i + 2)));
      const gw = grams(w), shared = v => [...grams(v)].filter(g => gw.has(g)).length;
      for (const v of VOCAB) { const d = lev(w, v) - shared(v) / 10; if (d < bd) { bd = d; best = v; } } // ties go to the word sharing more letter pairs
      if (best) { fixed = true; return best; }
      return w;
    }).join(' ');
    return { q: out, fixed };
  }

  function interpret(raw) {
    const f = { families: [], borderFamilies: [], colors: [], borderColors: [], collections: [], fabrics: [], types: [], motifs: [], borders: [] };
    const notes = [];
    let { q, fixed } = fixTypos(raw.toLowerCase().replace(/[^\w\s$<>&+-]/g, ' ').replace(/\s+/g, ' ').trim());
    const corrected = fixed ? q : null;
    const take = (re, fn) => { const m = q.match(re); if (m) { q = q.replace(m[0], ' '); fn(m); } return !!m; };
    take(/\bbetween \$?(\d+)\s*(?:and|-|to)\s*\$?(\d+)/, m => { f.min = +m[1]; f.max = +m[2]; notes.push(['Price', `${money(f.min)} – ${money(f.max)}`]); });
    take(/\b(?:under|below|less than|up ?to|within|<)\s*\$?\s*(\d+)/, m => { f.max = +m[1]; notes.push(['Price', 'under ' + money(f.max)]); });
    take(/\b(?:over|above|more than|from|>)\s*\$?\s*(\d+)/, m => { f.min = +m[1]; notes.push(['Price', 'over ' + money(f.min)]); });
    take(/\b(ready to ship|ready-to-ship|in stock|available now|available|ships now)\b/, () => { f.avail = 'in'; notes.push(['Availability', 'In stock']); });
    take(/\bsize\s*(\d{2})\b|\b(\d{2})\s*size\b/, m => { f.size = m[1] || m[2]; notes.push(['Size', f.size]); });
    take(/\bpre-?orders?\b/, () => { f.avail = 'pre'; notes.push(['Availability', 'Preorder']); });
    take(/\b(no|without|zero|non)[- ]zari\b|\bzari[- ]free\b/, () => { f.zari = 'No Zari'; notes.push(['Zari', 'No zari']); });
    take(/\b(with )?zari\b/, () => { f.zari = 'Zari'; notes.push(['Zari', 'With zari']); });
    const colour = (term, target, label) => {
      term = term.replace(/\s+/g, ' ');
      const ex = EXACT.get(term);
      if (ex) { f[target === 'body' ? 'colors' : 'borderColors'].push(ex.name); notes.push([label, ex.name]); }
      else {
        const fam = FAMILY_WORDS[term]; f[target === 'body' ? 'families' : 'borderFamilies'].push(fam);
        const inc = [...new Set(P.filter(p => (target === 'body' ? p.color : p.color2)?.family === fam).map(p => (target === 'body' ? p.color : p.color2).name))].filter(n => n.toLowerCase() !== term).slice(0, 3);
        notes.push([label, fam + (inc.length ? ` — incl. ${inc.join(', ')}` : '')]);
      }
    };
    const borderRe = new RegExp('\\b(?:with |and )?(?:an? )?' + colourRe.source.replace(/^\\b|\\b$/g, '') + '\\s+borders?\\b');
    while (take(borderRe, m => colour(m[1], 'border', 'Border colour')));
    let guard = 0; while (guard++ < 3 && take(colourRe, m => colour(m[1], 'body', 'Colour')));
    for (const [name, re] of WEAVES) take(re, () => { f.weave = name; notes.push(['Weave', name]); });
    for (const c of Object.values(COL)) {
      const n = c.name.toLowerCase().replace(/ (silks|ikats|sarees)$/, '');
      if (n.length > 4 && counts[c.key] && c.key !== 'kanjivaram') take(new RegExp('\\b' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'), () => { f.collections.push(c.key); notes.push(['Collection', c.name]); });
    }
    for (const [name, re] of TYPES) take(re, () => { f.types.push(name); if (name !== 'Saree') notes.push(['Category', name]); });
    for (const [name, re] of MOTIFS) take(re, () => { f.motifs.push(name); notes.push(['Motif', name]); });
    for (const [name, re] of BORDERS) take(re, () => { f.borders.push(name); notes.push(['Border', name]); });
    for (const [re, add, label, expl] of RULES) take(re, () => {
      if (add.weave && !f.weave) f.weave = add.weave;
      if (add.zari && !f.zari) f.zari = add.zari;
      if (add.type && !f.types.length) f.types.push(add.type);
      if (add.types && !f.types.length) f.types.push(...add.types);
      if (add.collections && !f.collections.length) f.collections.push(...add.collections);
      if (add.fabrics) f.fabrics.push(...add.fabrics);
      notes.push([label, expl, true]);
    });
    const rest = q.split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    return { f, notes, rest, corrected };
  }
  const hay = p => (p._hay ||= (p.name + ' ' + p.sourceTitle + ' ' + p.story + ' ' + collName(p) + ' ' + (p.weave || '') + ' ' + p.colorLine).toLowerCase());
  function matches(p, f, skip = {}) {
    if (f.max != null && p.price > f.max) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.avail && status(p) !== f.avail) return false;
    if (f.zari && p.zari !== f.zari) return false;
    if (f.weave && p.weave !== f.weave && !(f.weave === 'Ikat' && /Ikat|Patola/.test(p.weave || ''))) return false;
    if (f.size && !p.sizes.includes(f.size)) return false;
    if (f.collections.length && !f.collections.includes(p.collection)) return false;
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.fabrics.length && !f.fabrics.includes(p.fabric)) return false;
    if (f.families.length && !f.families.includes(p.color?.family)) return false;
    if (f.colors.length && !f.colors.includes(p.color?.name)) return false;
    if (!skip.border) {
      if (f.borderFamilies.length && !f.borderFamilies.includes(p.color2?.family)) return false;
      if (f.borderColors.length && !f.borderColors.includes(p.color2?.name)) return false;
    }
    if (!skip.motif) {
      if (f.motifs.length && !f.motifs.every(m => p.motif?.includes(m))) return false;
      if (f.borders.length && !f.borders.every(b => p.border?.includes(b))) return false;
    }
    return true;
  }
  function runSearch(raw) {
    const it = interpret(raw);
    const structured = it.notes.length > 0;
    const score = p => {
      let s = 0; const h = hay(p);
      for (const w of it.rest) { if (p.name.toLowerCase().includes(w)) s += 6; else if (h.includes(w)) s += 2; }
      if (status(p) === 'in') s += 1.5; else if (status(p) === 'pre') s += .5;
      return s;
    };
    const rank = list => list.map(p => [score(p), p]).sort((a, b) => b[0] - a[0] || (b[1].published > a[1].published ? 1 : -1)).map(x => x[1]);
    let res = P.filter(p => matches(p, it.f));
    if (it.rest.length) { const t = res.filter(p => it.rest.every(w => hay(p).includes(w))); if (t.length || !structured) res = t; }
    let relaxed = null;
    if (!res.length && structured) {
      res = P.filter(p => matches(p, it.f, { border: true })); if (res.length) relaxed = 'border colour';
      if (!res.length) { res = P.filter(p => matches(p, it.f, { border: true, motif: true })); if (res.length) relaxed = 'border and motif'; }
      if (!res.length && it.f.max != null) { const f2 = { ...it.f, max: it.f.max * 1.25 }; res = P.filter(p => matches(p, f2, { border: true, motif: true })); if (res.length) relaxed = 'price (within 25% above)'; }
    }
    return { ...it, results: rank(res), relaxed };
  }

  /* ── recommendations (rule-based, explainable) ───────────────────────── */
  const near = (a, b, pct) => Math.abs(a.price - b.price) <= a.price * pct;
  const inStockFirst = (a, b) => (status(a) === 'in' ? 0 : status(a) === 'pre' ? 1 : 2) - (status(b) === 'in' ? 0 : status(b) === 'pre' ? 1 : 2);
  const recs = {
    love(p, n = 8) {
      return P.filter(x => x.id !== p.id && x.type === p.type).map(x => {
        let s = 0;
        if (x.collection === p.collection) s += 3; if (x.weave && x.weave === p.weave) s += 2;
        if (x.color?.family === p.color?.family) s += 3; if (x.color2 && x.color2?.family === p.color2?.family) s += 1;
        if (near(p, x, .2)) s += 2; if ((x.motif || []).some(m => p.motif?.includes(m))) s += 1;
        if (status(x) === 'in') s += 2;
        return [s, x];
      }).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
    },
    twist(p, n = 4) { // same palette, different weave
      if (!p.color || p.type !== 'Saree') return [];
      return P.filter(x => x.id !== p.id && x.type === 'Saree' && x.color?.family === p.color.family && x.weave !== p.weave).sort(inStockFirst).slice(0, n);
    },
    look(p, n = 4) { // blouse, jewellery, potli — colour-matched first
      const fams = [p.color2?.family, p.color?.family].filter(Boolean);
      const pick = type => P.filter(x => x.type === type && x.id !== p.id && status(x) === 'in')
        .sort((a, b) => (fams.indexOf(b.color?.family) >= 0) - (fams.indexOf(a.color?.family) >= 0));
      const out = [];
      const b = pick('Blouse'), j = pick('Jewellery'), a = pick('Accessory');
      [b[0], j[0], a[0], j[1], b[1]].forEach(x => x && x.type !== p.type && out.push(x));
      return out.slice(0, n);
    },
    stepUp(p) {
      if (p.type !== 'Saree') return null;
      return P.filter(x => x.type === 'Saree' && x.weave === p.weave && x.price > p.price * 1.12 && x.price < p.price * 1.6 && status(x) === 'in')
        .sort((a, b) => (b.color?.family === p.color?.family) - (a.color?.family === p.color?.family) || a.price - b.price)[0] || null;
    },
  };

  /* ══ SHELL ═════════════════════════════════════════════════════════════ */
  const cLink = k => `collection.html?c=${k}`;
  /* Navigation is built from the catalog. A collection that is not named in a group below is added to
     "Krsaangi Collectives" automatically, so a new collection in Shopify appears without a code change. */
  const NAV_GROUPS = [
    ['Krsaangi Collectives', ['mythili', 'maathey', 'swara', 'pazhamai', 'snigdha', 'kattam', 'vriksha', 'mithila', 'pracheen', 'kanjivaram']],
    ['Weaves', ['gadwal', 'jamdani', 'patola', 'pochampally', 'odisha', 'ikat', 'baluchari', 'kanchicotton', 'silkcotton', 'sungudi', 'ponduru', 'kotpad', 'bhujodi', 'moirang', 'kodali']],
    ['Jewellery & More', ['varnika', 'terracotta', 'blouses', 'potlis', 'pavadai', 'kids', 'accessories']],
  ];
  { const named = new Set(NAV_GROUPS.flatMap(g => g[1])); Object.keys(COL).forEach(k => { if (!named.has(k)) NAV_GROUPS[0][1].push(k); }); }
  const DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const navKeys = keys => keys.filter(k => { if (!COL[k]) return false; if (!counts[k]) { if (DEV) console.info(`[nav] collection "${k}" hidden: it has no products`); return false; } return true; });
  const NAV = NAV_GROUPS.map(([title, keys]) => [title, navKeys(keys)]);
  const WEAVE_NAV = [['Kanjivaram', cLink('kanjivaram')], ...NAV[1][1].map(k => [COL[k].name.replace(/ (Silks|Ikats)$/, m => m === ' Ikats' ? ' Ikat' : ''), cLink(k)])];

  /* TODO(Vidya): final occasion grouping and rules. Until then each occasion is a set of ordinary catalog
     filters (the same ones on the collection page), so a rule can be changed here in one place.
     Keys: type, weave, fabric, zari, border, avail (lists of values) and max (price ceiling in USD). */
  const OCCASIONS = [
    { key: 'bridal', label: 'Bridal', note: 'Kanjivaram silks with zari', filter: { type: ['Saree'], weave: ['Kanjivaram'], zari: ['Zari'] } },
    { key: 'wedding-guest', label: 'Wedding Guest', note: 'Kanjivaram silks with zari, up to $600', filter: { type: ['Saree'], weave: ['Kanjivaram'], zari: ['Zari'], max: 600 } },
    { key: 'festive', label: 'Festive', note: 'Silks and silk cottons', filter: { type: ['Saree'], fabric: ['Pure Silk', 'Silk', 'Silk Cotton'] } },
    { key: 'temple', label: 'Temple & Traditional', note: 'Kanjivarams with korvai borders', filter: { type: ['Saree'], weave: ['Kanjivaram'], border: ['Korvai'] } },
    { key: 'celebrations', label: 'Celebrations', note: 'Kanjivarams in stock', filter: { type: ['Saree'], weave: ['Kanjivaram'], avail: ['in'] } },
    { key: 'everyday', label: 'Everyday Elegance', note: 'Cotton, khadi and silk cotton', filter: { type: ['Saree'], fabric: ['Cotton', 'Khadi', 'Silk Cotton'] } },
    { key: 'gifting', label: 'Gifting', note: 'Jewellery, potlis and blouses', filter: { type: ['Jewellery', 'Accessory', 'Blouse'] } },
  ];
  const occLink = k => `collection.html?occasion=${k}`;
  const firstImg = k => (P.find(p => inColl(p, k) && status(p) === 'in') || P.find(p => inColl(p, k)))?.images[0].src || COL[k]?.image;
  const feat = (href, src, title, sub, cls = '') => `<a class="mega__feat ${cls}" href="${href}"><figure><img src="${img(src, 640)}" alt="" loading="lazy"></figure><p>${title}</p><span>${sub}</span></a>`;

  const logoImg = w => `<img src="${img(SETTINGS.logo, w)}" srcset="${img(SETTINGS.logo, w)} 1x, ${img(SETTINGS.logo, w * 2)} 2x" alt="Krsaangi" width="1280" height="748" decoding="async">`;
  const themeBtn = cls => `<button class="tool ${cls}" data-theme-toggle aria-pressed="false"><span data-ico>${I.moon}</span><span data-lbl>Dark</span></button>`;
  function headerHTML() {
    const sw = FAMILIES.map(f => `<li><a href="collection.html?family=${encodeURIComponent(f)}"><i class="dot ${f === 'Multicolor' ? 'dot--multi' : ''}" style="${f === 'Multicolor' ? '' : 'background:' + FAMILY_HEX[f]}"></i>${f}</a></li>`).join('');
    const coll = k => COL[k] ? `<li><a href="${cLink(k)}" data-img="${esc(COL[k].image || '')}" data-cap="${esc(COL[k].name)}">${COL[k].name} <small>${esc(COL[k].subtitle || '')}</small></a></li>` : '';
    return `<a class="skip" href="#main">Skip to content</a>
    <div class="bar" role="region" aria-label="Announcement"><span>${SETTINGS.announcement}</span></div>
    <header class="hdr" id="hdr">
      <div class="wrap hdr__in">
        <div class="hdr__left">
          <button class="tool hdr__menu" data-open="mnav">${I.menu}<span>Menu</span></button>
          <nav class="hdr__nav" aria-label="Primary">
            ${['Shop', 'Collections', 'Weaves', 'Occasion', 'Stories'].map(n => `<button aria-expanded="false" aria-controls="mega-${n.toLowerCase()}" data-mega="${n.toLowerCase()}">${n}</button>`).join('')}
          </nav>
        </div>
        <a class="logo" href="index.html" aria-label="Krsaangi home">${logoImg(360)}</a>
        <div class="hdr__tools">
          <button class="tool" data-open="search">${I.search}<span>Search</span></button>
          <button class="tool tool--desk" data-open="account">${I.user}<span>Account</span></button>
          <a class="tool tool--desk" href="collection.html?wishlist=1">${I.heart}<span>Saved</span><span class="count" data-wishcount hidden></span></a>
          ${themeBtn('tool--desk')}
          <button class="tool" data-open="cart">${I.bag}<span>Bag</span><span class="count" data-bagcount hidden></span></button>
        </div>
      </div>
      <div class="mega" id="mega">
        <div class="wrap">
          <div class="mega__panel" id="mega-shop">
            <div class="mega__col"><h3>Shop</h3><ul>
              <li><a href="collection.html?sort=new">New Arrivals</a></li><li><a href="collection.html?avail=in">In Stock</a></li>
              <li><a href="collection.html?type=Saree">Sarees</a></li><li><a href="${cLink('blouses')}">Blouses</a></li><li><a href="collection.html?type=Jewellery">Jewellery</a></li><li><a href="collection.html?type=Accessory">Accessories</a></li><li><a href="collection.html?type=Kids">Kids</a></li>
            </ul></div>
            <div class="mega__col mega__col--3"><h3>Shop by colour</h3><ul class="mega__sw">${sw}</ul></div>
            ${feat('collection.html?sort=new', firstImg('mythili'), 'New to Krsaangi', 'The latest from the loom', 'mega__feat--end" style="grid-column:7 / span 3')}
            ${feat('collection.html?avail=in', firstImg('gadwal'), 'In Stock', 'Dispatched from the USA', '')}
          </div>
          <div class="mega__panel" id="mega-collections">
            <div class="mega__col mega__col--3"><h3>${NAV[0][0]}</h3><ul>${NAV[0][1].map(coll).join('')}</ul></div>
            <div class="mega__col mega__col--wide"><h3>${NAV[1][0]}</h3><ul class="mega__cols2">${NAV[1][1].map(k => `<li><a href="${cLink(k)}" data-img="${esc(COL[k].image || '')}" data-cap="${esc(COL[k].name)}">${COL[k].name}</a></li>`).join('')}</ul></div>
            <div class="mega__col"><h3>${NAV[2][0]}</h3><ul>${NAV[2][1].map(k => `<li><a href="${cLink(k)}" data-img="${esc(COL[k].image || '')}" data-cap="${esc(COL[k].name)}">${COL[k].name}</a></li>`).join('')}</ul></div>
            <a class="mega__feat mega__feat--end" href="${cLink('pazhamai')}" id="megaCollFeat"><figure><img src="${img(COL.pazhamai.image, 640)}" alt="" loading="lazy"></figure><p>Pazhamai</p><span>Recreating the Kanjivarams of another era</span></a>
          </div>
          <div class="mega__panel" id="mega-weaves">
            <div class="mega__col" style="grid-column:span 6"><h3>Sarees by weave</h3><ul class="mega__cols2">${WEAVE_NAV.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}</ul></div>
            ${feat(cLink('kanjivaram'), COL.kanjivaram?.image || firstImg('mythili'), 'Kanjivaram', 'Pure silk, korvai borders, temple reku', 'mega__feat--end" style="grid-column:7 / span 3')}
            ${feat(cLink('sungudi'), COL.sungudi.image, 'Madurai Sungudi', 'Every dot tied by hand', '')}
          </div>
          <div class="mega__panel" id="mega-occasion">
            <div class="mega__col mega__col--wide"><h3>Shop by occasion</h3><ul>${OCCASIONS.map(o => `<li><a href="${occLink(o.key)}">${o.label} <small>${esc(o.note)}</small></a></li>`).join('')}</ul></div>
            ${feat(occLink('bridal'), firstImg('pazhamai'), 'The bridal edit', 'Kanjivaram silks with zari', 'mega__feat--end" style="grid-column:7 / span 3')}
            ${feat(occLink('gifting'), firstImg('potlis'), 'Gifting', 'Potlis, jewellery and blouses', '')}
          </div>
          <div class="mega__panel" id="mega-stories">
            <div class="mega__col mega__col--wide"><h3>Stories</h3><ul>
              <li><a href="about.html">About Us</a></li><li><a href="index.html#journal">Journal</a></li><li><a href="index.html#weaves">Weave guide</a></li><li><a href="${SETTINGS.instagram}" target="_blank" rel="noopener">Instagram @krsaangi</a></li><li><a href="notes.html">Studio notes</a></li></ul></div>
            ${feat(cLink('pazhamai'), COL.pazhamai.image, 'Pazhamai', 'How a vintage Kanjivaram is recreated', 'mega__feat--end" style="grid-column:7 / span 3')}
            ${feat(cLink('kattam'), COL.kattam.image, 'Project Kattam', 'The many forms of the check', '')}
          </div>
        </div>
      </div>
    </header>`;
  }

  function mobileNavHTML() {
    const grp = (title, inner, open = false) => `<li><details ${open ? 'open' : ''}><summary>${title}<i></i></summary><div class="mnav__sub">${inner}</div></details></li>`;
    const a = (h, t) => `<a href="${h}">${t}</a>`;
    return `<aside class="drawer drawer--left mnav" id="mnav" role="dialog" aria-modal="true" aria-label="Menu" inert>
      <div class="drawer__head"><span class="logo">${logoImg(240)}</span><button class="tool" data-close>${I.x}<span>Close</span></button></div>
      <div class="drawer__body">
        <button class="cg__form" data-open="search" style="width:100%;height:54px;margin-bottom:12px;color:var(--stone);gap:12px;font-size:16px">${I.search}<span>Search sarees, colours, weaves</span></button>
        <ul class="mnav__list">
          ${grp('Shop', a('collection.html?sort=new', 'New Arrivals') + a('collection.html?avail=in', 'In Stock') + a('collection.html?type=Saree', 'Sarees') + a(cLink('blouses'), 'Blouses') + a('collection.html?type=Jewellery', 'Jewellery') + a('collection.html?type=Accessory', 'Accessories') + a('collection.html?type=Kids', 'Kids'), true)}
          ${grp('Collections', NAV.filter((g, i) => i !== 1).map(([t, keys]) => `<h4>${t}</h4>` + keys.map(k => a(cLink(k), COL[k].name)).join('')).join(''))}
          ${grp('Weaves', WEAVE_NAV.map(([n, h]) => a(h, n)).join(''))}
          ${grp('Occasion', OCCASIONS.map(o => a(occLink(o.key), o.label)).join(''))}
          ${grp('Colour', FAMILIES.map(f => `<a href="collection.html?family=${encodeURIComponent(f)}"><i class="dot ${f === 'Multicolor' ? 'dot--multi' : ''}" style="${f === 'Multicolor' ? '' : 'background:' + FAMILY_HEX[f]}"></i>${f}</a>`).join(''))}
          ${grp('Stories', a('about.html', 'About Us') + a('index.html#journal', 'Journal') + a('index.html#weaves', 'Weave guide') + a('notes.html', 'Studio notes'))}
        </ul>
        <div class="mnav__util">
          <button data-open="account">${I.user} Account: sign in or create</button>
          <a href="collection.html?wishlist=1">${I.heart} Saved items</a>
          <button data-open="ask">${I.chat} Ask us a question</button>
          <a href="${SETTINGS.whatsappChat}" data-wa><span style="color:#1F8F4E;width:20px;height:20px;display:grid">${I.wa}</span> Chat with us on WhatsApp</a>
          <a href="${SETTINGS.instagram}" target="_blank" rel="noopener">${I.ig} Instagram @krsaangi</a>
          <button data-theme-toggle aria-pressed="false"><span data-ico style="display:grid">${I.moon}</span><span><span data-lbl>Dark</span> appearance</span></button>
        </div>
      </div></aside>`;
  }

  function footerHTML() {
    const col = (t, links) => `<div><h3>${t}</h3><ul>${links.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}</ul></div>`;
    return `<div class="reku"></div><footer class="ftr"><div class="wrap">
      <div class="ftr__top">
        <div class="ftr__brand"><span class="logo">${logoImg(480)}</span><p>Indian textile heritage, curated for the modern collector.</p>
          <p style="user-select:all;color:var(--paper)">${SETTINGS.email}</p></div>
        ${col('Shop', [['New Arrivals', 'collection.html?sort=new'], ['Sarees', 'collection.html?type=Saree'], ['Blouses', cLink('blouses')], ['Jewellery', 'collection.html?type=Jewellery'], ['Accessories', 'collection.html?type=Accessory'], ['In Stock', 'collection.html?avail=in']])}
        ${col('Discover', [['About Us', 'about.html'], ['Weaves', 'index.html#weaves'], ['Journal', 'index.html#journal'], ['Care Guide', '#care'], ['Size Guide', '#size']])}
        ${col('Help', [['Ask us a question', '#ask'], ['Contact', SHOP + '/pages/contact'], ['Shipping', '#shipping'], ['Returns', '#returns'], ['Order status', SETTINGS.account]])}
        <div><h3>Connect</h3><ul><li><a href="${SETTINGS.instagram}" target="_blank" rel="noopener">Instagram @krsaangi</a></li><li><a href="${SETTINGS.whatsappChat}" data-wa>WhatsApp</a></li><li><a href="mailto:${SETTINGS.email}">Email</a></li><li><a href="${SETTINGS.account}">Your account</a></li></ul></div>
      </div>
      <div class="ftr__legal"><span>© ${new Date().getFullYear()} Krsaangi. Prices in USD.</span><nav aria-label="Legal"><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#accessibility">Accessibility</a><button data-theme-toggle aria-pressed="false" style="display:inline-flex;gap:6px;align-items:center"><span data-ico style="display:grid;width:16px">${I.moon}</span><span><span data-lbl>Dark</span> appearance</span></button></nav></div>
    </div></footer>
    <div class="proto-note"><div class="wrap">Prototype. Products, variants, prices, availability, photography, film and collection copy are from krsaangi.us; structured attributes are derived from Krsaangi’s own descriptions. Anything not yet verified is marked as sample or pending. <a href="notes.html">Studio notes &amp; taxonomy</a></div></div>`;
  }

  function overlaysHTML() {
    return `<div class="scrim" id="scrim"></div>
    ${mobileNavHTML()}
    <section class="search" id="search" role="dialog" aria-modal="true" aria-label="Search" inert>
      <div class="wrap">
        <form class="search__bar" id="searchForm" role="search">
          ${I.search}<label class="sr" for="searchInput">Search Krsaangi</label>
          <input id="searchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try “green kanjivaram with purple border”" aria-controls="searchOut">
          <button type="button" class="icon-btn" data-close aria-label="Close search">${I.x}</button>
        </form>
        <div class="search__body" id="searchOut" aria-live="polite"></div>
      </div>
    </section>
    <aside class="drawer drawer--right" id="cart" role="dialog" aria-modal="true" aria-label="Shopping bag" inert>
      <div class="drawer__head"><h2>Your bag <span class="muted num" data-bagn style="font:500 var(--t-sm) var(--sans)"></span></h2><button class="icon-btn" data-close aria-label="Close bag">${I.x}</button></div>
      <div class="ship" id="cartShip" hidden>
        <p class="ship__msg" id="shipMsg" aria-live="polite"></p>
        <div class="ship__bar" role="progressbar" aria-label="Progress towards free shipping" aria-valuemin="0" aria-valuemax="100" id="shipBar"><i id="shipFill"></i></div>
      </div>
      <div class="drawer__body" id="cartBody"></div>
      <div class="drawer__foot" id="cartFoot"></div>
    </aside>
    <div class="modal" id="quick" role="dialog" aria-modal="true" aria-label="Quick view" inert><div class="modal__box" id="quickBox"></div></div>
    <aside class="drawer drawer--right" id="account" role="dialog" aria-modal="true" aria-label="Your account" inert>
      <div class="drawer__head"><h2>Your account</h2><button class="icon-btn" data-close aria-label="Close account panel">${I.x}</button></div>
      <div class="drawer__body">
        <p class="eyebrow eyebrow--accent">Krsaangi account</p>
        <h3 class="h3" style="margin:12px 0">Create your Krsaangi account</h3>
        <p style="font-size:16px;color:var(--ink-2)">Save your favourites, view your orders and enjoy a faster shopping experience.</p>
        <p style="margin:20px 0 12px"><a class="btn btn--full" href="${SETTINGS.account}" data-acct="signin">Sign in or create account</a></p>
        <p class="securenote">${I.lock}<span>You continue on Krsaangi’s secure Shopify sign-in. Enter your email and you are sent a one-time code. There is no password to remember, and only your email is asked for.</span></p>
        <nav class="acct__list" aria-label="Account">
          <a href="https://account.krsaangi.us/orders" data-acct="orders">View your orders and order status ${I.arrow}</a>
          <a href="https://account.krsaangi.us/profile" data-acct="profile">Your details and addresses ${I.arrow}</a>
          <a href="collection.html?wishlist=1">Saved items ${I.arrow}</a>
          <a href="${SHOP}/account/logout" data-acct="signout">Sign out ${I.arrow}</a>
        </nav>
      </div>
    </aside>
    <aside class="drawer drawer--right ask" id="ask" role="dialog" aria-modal="true" aria-labelledby="askTitle" inert>
      <div class="drawer__head"><div><h2 id="askTitle">Ask us a question</h2><p>Need help finding a saree or have a question? Ask us here.</p></div><button class="icon-btn" data-close>${I.x}<span>Close</span></button></div>
      <div class="drawer__body" id="cgBody"><div class="cg__log" id="cgLog" aria-live="polite"></div></div>
      <div class="drawer__foot">
        <form class="ask__form" id="cgForm"><label class="sr" for="cgInput">Type your question</label><input id="cgInput" autocomplete="off" enterkeyhint="send" placeholder="Type your question here..."><button class="btn" type="submit">Send</button></form>
        <p class="ask__note">Answers come from the Krsaangi catalogue. For anything else, our team will help.</p>
      </div>
    </aside>
    <div class="help" role="group" aria-label="Help and contact">
      <button class="help__ask" data-open="ask">${I.chat}<span><span class="help__long">Ask us a question</span><span class="help__short">Ask us</span></span></button>
      <a class="help__wa" href="${SETTINGS.whatsappChat}" data-wa>${I.wa}<span>WhatsApp</span></a>
      <a class="help__ig" href="${SETTINGS.instagram}" target="_blank" rel="noopener" data-ig aria-label="Instagram (opens in a new tab)">${I.ig}<span>Instagram</span></a>
    </div>
    <div class="modal ask-prompt" id="askPrompt" role="dialog" aria-modal="true" aria-labelledby="apTitle" inert>
      <div class="modal__box">
        <button class="icon-btn modal__close" data-close aria-label="Close">${I.x}</button>
        <div class="ap">
          <p class="eyebrow eyebrow--accent">Krsaangi</p>
          <h2 class="h3" id="apTitle">Can we help you find <em>something?</em></h2>
          <p>Ask about a saree, a colour, a size or availability. We answer from the Krsaangi catalogue, and our team is here for anything else.</p>
          <form class="ask__form" id="apForm"><label class="sr" for="apInput">Type your question</label><input id="apInput" autocomplete="off" enterkeyhint="send" placeholder="Type your question here..."><button class="btn" type="submit">Send</button></form>
          <div class="prompts">${['Find a saree', 'Check availability', 'Help with sizing'].map(t => `<button type="button" data-ap="${t}">${t}</button>`).join('')}</div>
          <button class="link" data-close style="justify-self:center">No thanks, keep browsing</button>
        </div>
      </div>
    </div>
    <div class="toast" id="toast" role="status"></div>`;
  }

  /* ── overlay manager: focus trap, Esc, scroll lock ───────────────────── */
  let active = null, lastFocus = null;
  function open(id) {
    const el = $('#' + id); if (!el) return;
    if (active && active !== el) close(false);
    closeMega();
    lastFocus = lastFocus || document.activeElement;
    active = el; el.inert = false; el.classList.add('is-on'); $('#scrim').classList.add('is-on'); document.body.classList.add('is-locked');
    const f = el.querySelector('input:not([type=hidden])') || el.querySelector('[data-close]');
    setTimeout(() => f?.focus({ preventScroll: true }), 60);
  }
  function close(restore = true) {
    if (!active) return;
    const was = active.id;
    active.classList.remove('is-on'); active.inert = true; active = null;
    document.dispatchEvent(new CustomEvent('kr:closed', { detail: was }));
    $('#scrim').classList.remove('is-on'); document.body.classList.remove('is-locked');
    if (restore) { lastFocus?.focus?.({ preventScroll: true }); lastFocus = null; }
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if ($('.lightbox.is-on')) return; if (active) close(); else closeMega(true); }
    if (e.key === 'Tab' && active) {
      const f = $$('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])', active).filter(n => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (e.key === '/' && !active && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ── mega menu ───────────────────────────────────────────────────────── */
  let megaTimer, megaBtn = null;
  function openMega(name, btn) {
    clearTimeout(megaTimer);
    $$('.mega__panel').forEach(p => p.classList.toggle('is-on', p.id === 'mega-' + name));
    $$('[data-mega]').forEach(b => b.setAttribute('aria-expanded', b === btn));
    $('#mega').classList.add('is-on'); $('#hdr').classList.add('is-open'); megaBtn = btn;
  }
  function closeMega(refocus) {
    const m = $('#mega'); if (!m?.classList.contains('is-on')) return;
    m.classList.remove('is-on'); $('#hdr').classList.remove('is-open');
    $$('[data-mega]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (refocus) megaBtn?.focus(); megaBtn = null;
  }
  function bindMega() {
    const hdr = $('#hdr');
    $$('[data-mega]').forEach(b => {
      b.addEventListener('mouseenter', () => { megaTimer = setTimeout(() => openMega(b.dataset.mega, b), megaBtn ? 0 : 90); });
      b.addEventListener('mouseleave', () => clearTimeout(megaTimer));
      b.addEventListener('click', () => b.getAttribute('aria-expanded') === 'true' ? closeMega() : openMega(b.dataset.mega, b));
      b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMega(b.dataset.mega, b); $('#mega-' + b.dataset.mega + ' a')?.focus(); } });
    });
    hdr.addEventListener('mouseleave', () => { megaTimer = setTimeout(() => closeMega(), 160); });
    $('#mega').addEventListener('mouseenter', () => clearTimeout(megaTimer));
    hdr.addEventListener('focusout', e => { if (!hdr.contains(e.relatedTarget)) closeMega(); });
    // collections panel: the feature image follows the link under the pointer
    const featEl = $('#megaCollFeat');
    $$('#mega-collections a[data-img]').forEach(a => {
      const swap = () => { if (!a.dataset.img) return; const im = $('img', featEl); im.src = img(a.dataset.img, 640); $('p', featEl).textContent = a.dataset.cap; $('span', featEl).textContent = $('small', a)?.textContent || ''; featEl.href = a.href; };
      a.addEventListener('mouseenter', swap); a.addEventListener('focus', swap);
    });
    let stuck = false;
    const onScroll = () => { const s = scrollY > 40; if (s !== stuck) { stuck = s; hdr.classList.toggle('is-stuck', s); } };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ── toast ───────────────────────────────────────────────────────────── */
  let toastT;
  function toast(msg, action) {
    const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<a href="${action.href}" style="text-decoration:underline;text-underline-offset:3px">${action.label}</a>` : ''}`;
    t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  /* ── cart drawer ─────────────────────────────────────────────────────── */
  /* Free-shipping progress: one persistent bar, so width changes animate (instantly under reduced motion). */
  let lastGap = null;
  function paintShipping(sub) {
    const T = SETTINGS.freeShippingThreshold, box = $('#cartShip'); if (!box || !T) return;
    box.hidden = !bagCount(); if (box.hidden) { lastGap = null; return; }
    const gap = Math.max(0, T - sub), pct = Math.min(100, sub / T * 100), done = gap <= 0;
    $('#shipFill').style.width = pct + '%';
    $('#shipBar').setAttribute('aria-valuenow', Math.round(pct));
    box.classList.toggle('is-done', done);
    $('#shipMsg').innerHTML = done ? `${I.check} You’ve unlocked FREE shipping.` : `You’re just <b>${money(Math.ceil(gap))}</b> away from FREE shipping!`;
    if (gap !== lastGap) {
      if (renderCart.quiet) { lastGap = gap; return; }   // the silent render on page load is not a change
      if (done && lastGap > 0) track('free_shipping_unlocked', { value: sub, currency: 'USD', threshold: SETTINGS.freeShippingThreshold });
      else if (!done) track('free_shipping_progress', { gap: Math.ceil(gap), value: sub, currency: 'USD', threshold: SETTINGS.freeShippingThreshold });
      lastGap = gap;
    }
  }
  /* Complete the look: one row. With a saree in the bag it offers matching blouses, jewellery and potlis;
     under the free-shipping threshold it is sorted so the first pieces close the gap (priced at or just
     above what is left), with lower-priced pieces after. Only in-stock, one-tap items. */
  function lookFor(lines, sub) {
    const has = new Set(bag.map(l => l.id));
    const sarees = lines.filter(l => l.p.type === 'Saree').map(l => l.p);
    const seeds = sarees.length ? sarees : lines.map(l => l.p);
    const pool = [], seen = new Set();
    const push = x => { if (x && !has.has(x.id) && !seen.has(x.id) && status(x) === 'in' && x.variants.length <= 1) { seen.add(x.id); pool.push(x); } };
    seeds.forEach(p => (p.type === 'Saree' ? recs.look(p, 10) : []).forEach(push));
    seeds.forEach(p => recs.love(p, 12).forEach(push));
    const gap = SETTINGS.freeShippingThreshold - sub;
    // if nothing that goes with the bag closes the gap, add in-stock pieces priced at or just above it, nearest colour first
    if (gap > 0 && !pool.some(x => x.price >= gap)) {
      const fams = new Set(seeds.flatMap(p => [p.color?.family, p.color2?.family]).filter(Boolean));
      P.filter(x => x.price >= gap && x.price <= gap * 1.6).sort((a, b) => (fams.has(b.color?.family) - fams.has(a.color?.family)) || a.price - b.price).slice(0, 40).forEach(push);
    }
    if (gap > 0) {
      const closes = pool.filter(x => x.price >= gap).sort((a, b) => a.price - b.price);
      const rest = pool.filter(x => x.price < gap).sort((a, b) => b.price - a.price);
      return [...closes, ...rest].slice(0, 3);
    }
    return pool.slice(0, 3);
  }
  function renderCart() {
    const n = bagCount();
    $$('[data-bagcount]').forEach(e => { e.hidden = !n; e.textContent = n; });
    $$('[data-wishcount]').forEach(e => { e.hidden = !wish.size; e.textContent = wish.size; });
    const body = $('#cartBody'), foot = $('#cartFoot'); if (!body) return;
    $('[data-bagn]').textContent = n ? `(${n})` : '';
    if (!n) {
      paintShipping(0);
      const sug = P.filter(p => status(p) === 'in' && p.type === 'Saree').slice(0, 3);
      body.innerHTML = `<div class="empty" style="padding:24px 0"><p class="eyebrow">Your bag is empty</p><h3 class="h3">Start with something <em>in stock.</em></h3>
        <div class="empty__acts"><a class="btn btn--sm" href="collection.html?avail=in">Shop In Stock</a><button class="btn btn--ghost btn--sm" data-open="ask">Ask us a question</button></div></div>
        <div class="pairs"><h3>Just in</h3>${sug.map(p => pairRow(p)).join('')}</div>`;
      foot.innerHTML = ''; foot.hidden = true; return;
    }
    foot.hidden = false;
    const lines = bag.map(l => ({ ...l, p: byId.get(l.id), v: variantOf(byId.get(l.id), l.vid) }));
    const sub = lines.reduce((s, l) => s + (l.v?.price ?? l.p.price) * l.qty, 0);
    paintShipping(sub);
    const look = lookFor(lines, sub), gap = SETTINGS.freeShippingThreshold - sub;
    const capture = $('#capEmail') ? { email: $('#capEmail').value, ok: $('#capOk').checked } : { email: '', ok: false };
    body.innerHTML = lines.map(({ p, v, vid, qty }) => `<div class="line">
        <a class="line__img" href="${url(p)}"><img src="${img(p.images[0].src, 240)}" alt="${esc(p.name)}"></a>
        <div class="line__txt"><p class="pc__coll">${esc(kicker(p))}</p><h3><a href="${url(p)}">${esc(p.name)}</a></h3><p>${esc(p.colorLine)}</p>
          ${v ? `<p style="color:var(--ink)"><b>Size ${esc(v.title)}</b></p>` : ''}
          <p>${availHTML(p)} <span class="muted" style="margin-left:6px">Dispatched from the USA</span></p>
          <div class="line__row"><div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}"><button data-qty="${vid}" data-d="-1" aria-label="Decrease quantity">${I.minus}</button><span aria-live="polite">${qty}</span><button data-qty="${vid}" data-d="1" aria-label="Increase quantity">${I.plus}</button></div><span class="price">${money((v?.price ?? p.price) * qty)}</span></div>
          <button class="line__rm" data-qty="${vid}" data-d="-99">Remove</button>
        </div></div>`).join('') +
      (look.length ? `<section class="pairs" aria-labelledby="lookH"><h3 id="lookH">Complete the look</h3>
          ${gap > 0 ? `<p class="fine" style="margin:-6px 0 6px">Chosen to go with your bag. The first ${look.filter(x => x.price >= gap).length > 1 ? 'pieces' : 'piece'} would also bring free shipping.</p>` : ''}
          ${look.map(p => pairRow(p, 'complete_the_look', gap > 0 && p.price >= gap)).join('')}</section>` : '') +
      `<form class="capture" id="capForm" novalidate>
        <h3>Email me my bag</h3>
        <p class="fine">We’ll send a link back to this bag. Optional.</p>
        <label class="sr" for="capEmail">Email address</label>
        <input id="capEmail" type="email" autocomplete="email" placeholder="Email address" value="${esc(capture.email)}">
        <label class="capture__ok"><input type="checkbox" id="capOk" ${capture.ok ? 'checked' : ''}><span>Yes, email me a link to my bag. Krsaangi uses this email only to send it.</span></label>
        <button class="btn btn--ghost btn--sm" type="submit">Email my bag</button>
        <p class="form-note" id="capNote" role="status"></p>
      </form>`;
    const code = $('#discCode')?.value.trim() || '';
    foot.innerHTML = `<div class="disc"><label class="sr" for="discCode">Discount code (optional)</label><input id="discCode" placeholder="Discount code (optional)" autocomplete="off" value="${esc(code)}"><span class="fine" style="align-self:center">Applied at checkout</span></div>
      <a class="btn btn--full checkout-btn" id="checkoutLink" href="${checkoutUrl(code)}" data-checkout><span>Checkout securely</span><span class="num">${money(sub)}</span></a>
      <p class="securenote">${I.lock}<span>You finish on Krsaangi’s secure Shopify checkout, where shipping, taxes and payment options are shown before you pay.</span></p>`;
  }
  const pairRow = (p, src = 'cart_cross_sell', closes = false) => `<div class="pair"><a href="${url(p)}"><img src="${img(p.images[0].src, 160)}" alt="" loading="lazy"></a><a href="${url(p)}"><b>${esc(p.name)}</b><small>${esc(p.type === 'Saree' ? kicker(p) : p.type)} · ${money(p.price)}${p.variants.length === 1 ? ' · Size ' + esc(p.variants[0].title) : ''}</small>${closes ? '<small class="pair__ship">Adds free shipping</small>' : ''}</a>${p.variants.length > 1 ? `<a class="btn btn--ghost btn--sm" href="${url(p)}#size" style="padding:0 12px">Choose size</a>` : `<button data-add="${p.id}" data-src="${src}" aria-label="Add ${esc(p.name)} to bag">Add</button>`}</div>`;
  function openCart() { const was = $('#cart')?.classList.contains('is-on'); renderCart(); open('cart'); if (!was) track('view_cart', { currency: 'USD', value: bagValue(), items: lineItems() }); }

  /* ── quick view ──────────────────────────────────────────────────────── */
  function coreSpecs(p) {
    const rows = [];
    if (p.weave) rows.push(['Weave', p.weave]);
    if (p.fabric) rows.push(['Fabric', p.fabric]);
    if (p.color) rows.push(['Colour', p.colorLine]);
    if (p.zari) rows.push(['Zari', p.zari === 'Zari' ? 'With zari' : 'No zari', p.zariNote]);
    if (p.border?.length) rows.push(['Border', p.border.join(', ')]);
    if (p.motif?.length) rows.push(['Motif', p.motif.join(', ')]);
    if (p.technique) rows.push(['Technique', p.technique]);
    if (p.blouse) rows.push(['Blouse', p.blouse]);
    return rows;
  }
  const specsHTML = rows => `<dl class="specs">${rows.map(([k, v, n]) => `<dt>${k}</dt><dd>${esc(v)}${n ? `<small>${esc(n)}</small>` : ''}</dd>`).join('')}</dl>`;
  const ctaLabel = p => ({ in: 'Add to bag', pre: 'Pre-order', out: 'Sold out' }[status(p)]);
  function openQuick(id) {
    const p = byId.get(id); if (!p) return;
    track('quick_view', { items: [gaItem(byId.get(id))] });
    $('#quickBox').innerHTML = `<button class="icon-btn modal__close" data-close aria-label="Close quick view">${I.x}</button>
      <div class="qv"><div class="qv__imgs">${p.images.slice(0, 3).map((im, i) => `<img src="${img(im.src, i ? 480 : 900)}" alt="${i ? '' : esc(p.name)}">`).join('')}</div>
      <div class="qv__txt"><p class="eyebrow">${esc(kicker(p))}</p><h2>${esc(p.name)}</h2>
        ${p.colorLine ? `<p class="info__colour" style="font-size:1.2rem">${dot(p.color)}${dot(p.color2)}${esc(p.colorLine)}</p>` : ''}
        <div class="info__price" style="padding-block:14px"><span class="price">${money(p.price)}</span>${availHTML(p)}</div>
        ${p.preorder ? `<p class="fine">Estimated dispatch ${preWindow(p)} <span class="sample-tag">Sample data</span></p>` : ''}
        ${specsHTML(coreSpecs(p).slice(0, 5))}
        ${p.variants.length ? `<p class="onesize"><b>${p.variants.length > 1 ? 'Sizes' : 'Size'}</b><span>${p.variants.map(v => esc(v.title) + (v.available ? '' : ' (sold out)')).join(' · ')}</span></p>` : ''}
        <div class="qv__acts">${status(p) === 'pre' ? `<a class="btn" href="${url(p)}">See pre-order details</a>` : p.variants.length > 1 && status(p) !== 'out' ? `<a class="btn" href="${url(p)}#size">Choose a size</a>` : `<button class="btn" data-add="${p.id}" data-src="quick_view" ${status(p) === 'out' ? 'disabled' : ''}>${ctaLabel(p)}</button>`}
          <button class="wishbtn info__acts" data-wish="${p.id}" aria-pressed="${wish.has(p.id)}" aria-label="Save to wishlist" style="border:1px solid var(--ink);border-radius:var(--r);display:grid;place-items:center">${I.heart}</button></div>
        <a class="link" href="${url(p)}" style="justify-self:start">View full details ${I.arrow}</a></div></div>`;
    open('quick');
  }

  /* ── predictive search overlay ───────────────────────────────────────── */
  const EXAMPLES = ['green kanjivaram with purple border', 'red wedding saree under $600', 'blue saree ready to ship', 'vintage style kanjivaram', 'pink saree with green border', 'lightweight saree under $300'];
  const JOURNAL = [
    { t: 'Recreating the Kanjivarams of another era', k: 'pazhamai', tag: 'Collections' },
    { t: 'Kattam: the many forms of the check', k: 'kattam', tag: 'Craft' },
    { t: 'Sungudi: every dot tied by hand', k: 'sungudi', tag: 'Weaves' },
  ];
  function renderSearch(q) {
    const out = $('#searchOut'); q = q.trim();
    if (!q) {
      const fresh = P.filter(p => status(p) === 'in' && p.type === 'Saree').slice(0, 4);
      out.innerHTML = `<div class="search__side">
          <div><h3>Try asking</h3><ul>${EXAMPLES.map(e => `<li><button data-sq="${esc(e)}">${esc(e)}</button></li>`).join('')}</ul></div>
          <div><h3>Colours</h3><ul>${['Arakku', 'Vadamalli', 'Ramar Blue', 'Manthulir', 'Turmeric'].map(c => `<li><button data-sq="${c}">${dot(LEX.find(l => l.name === c))}${c}</button></li>`).join('')}</ul></div>
        </div><div class="search__main"><h3>Ready to ship</h3><div class="sres">${fresh.map(p => card(p)).join('')}</div></div>`;
      return;
    }
    const r = runSearch(q), ql = q.toLowerCase();
    clearTimeout(renderSearch.t); renderSearch.t = setTimeout(() => track('search', { search_term: q, results: r.results.length, where: 'overlay' }), 1200);
    const colls = Object.values(COL).filter(c => c.name.toLowerCase().includes(ql) || (r.f.weave && c.weave === r.f.weave) || r.f.collections.includes(c.key)).slice(0, 5);
    const weaves = WEAVE_NAV.filter(([n]) => n.toLowerCase().includes(ql) || n === r.f.weave).slice(0, 3);
    const cols = LEX.filter(l => l.hex !== 'multi' && (l.term.startsWith(ql) || r.f.colors.includes(l.name))).filter((l, i, a) => a.findIndex(x => x.name === l.name) === i).slice(0, 4);
    const famCols = [...new Set([...r.f.families, ...r.f.borderFamilies])];
    const stories = JOURNAL.filter(j => r.f.collections.includes(j.k) || j.t.toLowerCase().includes(ql) || (r.f.weave === 'Kanjivaram' && j.k !== 'sungudi') || (r.f.weave === 'Madurai Sungudi' && j.k === 'sungudi')).slice(0, 2);
    const side = [
      colls.length && `<div><h3>Collections</h3><ul>${colls.map(c => `<li><a href="${cLink(c.key)}">${c.name} <small>${counts[c.key] ? '' : ''}${esc(c.subtitle || '')}</small></a></li>`).join('')}</ul></div>`,
      weaves.length && `<div><h3>Weaves</h3><ul>${weaves.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}</ul></div>`,
      (cols.length || famCols.length) && `<div><h3>Colours</h3><ul>${famCols.map(f => `<li><a href="collection.html?family=${encodeURIComponent(f)}"><i class="dot" style="background:${FAMILY_HEX[f]}"></i>${f} <small>family</small></a></li>`).join('')}${cols.map(c => `<li><a href="collection.html?q=${encodeURIComponent(c.name)}">${dot(c)}${c.name}</a></li>`).join('')}</ul></div>`,
      stories.length && `<div><h3>Stories</h3><ul>${stories.map(j => `<li><a href="${cLink(j.k)}">${j.t} <small>${j.tag}</small></a></li>`).join('')}</ul></div>`,
    ].filter(Boolean).join('') || `<div><h3>Try asking</h3><ul>${EXAMPLES.slice(0, 4).map(e => `<li><button data-sq="${esc(e)}">${esc(e)}</button></li>`).join('')}</ul></div>`;
    const und = r.notes.length ? `<div class="understood"><span>Understood as</span>${r.notes.map(([k, v, rule]) => `<span class="chip" ${rule ? 'title="Curation rule — this occasion is not yet tagged on products"' : ''}><b>${k}</b>${esc(v)}</span>`).join('')}</div>` : '';
    const corr = r.corrected ? `<p class="fine" style="margin-bottom:10px">Showing results for “${esc(r.corrected)}”.</p>` : '';
    let main;
    if (r.results.length) {
      main = `${corr}${und}${r.relaxed ? `<p class="fine" style="margin:-8px 0 16px">No exact match, so we relaxed ${r.relaxed}. These are the closest pieces.</p>` : ''}
        <h3>${r.results.length} piece${r.results.length > 1 ? 's' : ''}</h3><div class="sres">${r.results.slice(0, 8).map(p => card(p)).join('')}</div>
        ${r.results.length > 8 ? `<p class="search__more"><a class="link" href="collection.html?q=${encodeURIComponent(q)}">View all ${r.results.length} results ${I.arrow}</a></p>` : ''}`;
    } else {
      const alt = P.filter(p => status(p) === 'in' && p.type === 'Saree').slice(0, 4);
      main = `${corr}${und}<div class="empty" style="padding:0 0 28px"><h3 class="h3">Nothing matches <em>“${esc(q)}”</em> yet.</h3><p class="muted">Try a colour, a weave or a price, or ask us and we will look with you.</p>
        <div class="empty__acts"><button class="btn btn--sm" data-open="ask">Ask us a question</button><a class="btn btn--ghost btn--sm" href="collection.html?avail=in">Shop In Stock</a></div></div>
        <h3>Ready to ship</h3><div class="sres">${alt.map(p => card(p)).join('')}</div>`;
    }
    out.innerHTML = `<div class="search__side">${side}</div><div class="search__main">${main}</div>`;
  }
  function openSearch(q) { open('search'); const i = $('#searchInput'); if (q != null) i.value = q; renderSearch(i.value); }

  /* ══ CONCIERGE ═════════════════════════════════════════════════════════
     Retrieval only: every answer is assembled from catalog fields or an
     approved policy snippet. Anything else gets the "not verified" reply
     and a human handoff. Production: Claude with catalog/policy tools and
     the same refusal rule (see notes.html). */
  const POLICY = [
    [/\b(ship|shipping|deliver|delivery|international|countries|customs)\b/, 'We ship from the USA, with international shipping to select countries. Shipping rates are shown at checkout.', 'From our contact page'],
    [/\b(email|contact|reach|phone|call)\b/, `You can email us at ${SETTINGS.email}.`, 'From our contact page'],
    [/\b(silver|sterling)\b/, 'Varnika pieces have a silver-tone finish. They are not made of pure or sterling silver.', 'From the Varnika collection note'],
    [/\b(account|sign in|log ?in|password|register)\b/, 'You can sign in or create an account with just your email. We send a one-time code, so there is no password to remember.', 'Tap Account at the top of the page'],
    [/\b(pay|payment|card|apple pay|paypal|shop pay)\b/, 'You pay on our secure Shopify checkout. The payment options available to you are shown there before you pay.', 'Checkout is handled by Shopify'],
  ];
  const UNVERIFIED = /\b(return|refund|exchange|cancel|care|wash|dry clean|iron|store|certif|silk mark|gst|duty|tax|falls?|pico|stitch|tailor|length|width|weight|custom|discount|coupon|sale|emi|installment|afterpay|klarna)\b/;
  const cgLog = () => $('#cgLog');
  const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const say = (html, wide) => { const d = document.createElement('div'); d.className = 'msg msg--ai' + (wide ? ' msg--wide' : ''); d.innerHTML = `<p class="msg__from"><span>Krsaangi</span><time>${clock()}</time></p>${html}`; cgLog().append(d); scrollCg(); return d; };
  const extra = html => { const d = document.createElement('div'); d.innerHTML = html; const el = d.firstElementChild; cgLog().append(el); scrollCg(); return el; };
  const scrollCg = () => { const b = $('#cgBody'); b.scrollTo({ top: b.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); };
  const handoff = `<div class="prompts"><a href="${SETTINGS.whatsappChat}" data-wa data-handoff>Chat with us on WhatsApp</a><a href="mailto:${SETTINGS.email}" data-handoff>Email ${SETTINGS.email}</a></div>`;
  const cgCard = (p, why) => `<a class="cg-card" href="${url(p)}" data-cgrec="${p.id}"><img src="${img(p.images[0].src, 320)}" alt="${esc(p.name)}" loading="lazy"><b>${esc(p.name)}</b><small>${esc(why)}</small><span class="price">${money(p.price)}</span>${availHTML(p)}</a>`;
  function whyLine(p, f) {
    const bits = [];
    if (p.colorLine) bits.push(p.colorLine);
    if (p.weave) bits.push(p.weave);
    if (f.size && p.variants.length) bits.push('size ' + f.size);
    else if (f.zari && p.zari) bits.push(p.zari === 'Zari' ? 'with zari' : 'no zari');
    else if (p.border?.includes('Korvai')) bits.push('korvai border');
    return bits.join(' · ');
  }
  const CHOICES = ['Find a saree', 'Check availability', 'Help with sizing', 'Shipping question', 'Preorder question', 'Talk to our team'];
  function cgStart() {
    if (cgLog().children.length) return;
    say(`<p>Namaste! Welcome to Krsaangi 👋</p><p>How can we help you today?</p><p>You can ask us about sarees, colours, sizes, availability, shipping, preorders, or anything else you’re looking for.</p>`);
    extra(`<div class="choices">${CHOICES.map(t => `<button data-cg="${t}">${t}</button>`).join('')}</div>`);
  }
  const inStockSarees = () => P.filter(p => p.type === 'Saree' && status(p) === 'in').length;
  function cgAnswer(text) {
    const t = text.toLowerCase().trim();
    if (t === 'find a saree') return say(`<p>Of course. Tell us the colour, the occasion or your budget. For example: “green saree under $500”.</p><p>Or choose one of these:</p><div class="prompts">${['Wedding sarees', 'Kanjivarams', 'Sarees under $500', 'Sarees ready to ship', 'Help me choose a colour'].map(x => `<button data-cg="${x}">${x}</button>`).join('')}</div>`);
    if (t === 'check availability') return say(`<p>Right now ${inStockSarees()} sarees are in stock and ready to ship.</p><p>Type the name or colour of the piece you have in mind and we’ll tell you whether it is available.</p><div class="prompts"><button data-cg="Sarees ready to ship">Show sarees in stock</button><button data-cg="Blouses ready to ship">Show blouses in stock</button></div>`);
    if (t === 'shipping question') return say(`<p>${POLICY[0][1]}</p><p class="msg__why">${POLICY[0][2]}. For delivery times to your address, our team can confirm.</p>${handoff}`);
    if (t === 'preorder question' || /\bpre-?orders?\b/.test(t) && !/\b(show|find|saree)\b/.test(t)) { track('ask_handoff', { reason: 'preorder' }); return say(`<p>We don’t have verified information about preorder terms here yet.</p><p class="msg__why">Our team can tell you whether a piece can be woven to order and how long it takes.</p>${handoff}`); }
    if (t === 'talk to our team' || /\b(human|person|someone|agent|team)\b/.test(t)) { track('ask_handoff', { reason: 'asked' }); return say(`<p>Of course. You can reach the Krsaangi team directly:</p>${handoff}`); }
    if (/help me choose a colou?r|which colou?r|what colou?r/.test(t)) {
      const avail = FAMILIES.filter(f => f !== 'Multicolor' && P.some(p => p.type === 'Saree' && status(p) === 'in' && p.color?.family === f));
      return say(`<p>Gladly. Which colour family are you drawn to? We’ll show what is in stock, with the traditional name of each shade.</p><div class="prompts">${avail.map(f => `<button data-cg="${f.toLowerCase().replace(' & gold', '').replace(' & neutrals', '').replace('earth & ', '')} sarees ready to ship"><i class="dot" style="display:inline-block;vertical-align:-2px;margin-right:6px;background:${FAMILY_HEX[f]}"></i>${f}</button>`).join('')}</div>`);
    }
    if (/\b(my order|order status|track|tracking|where is my)\b/.test(t)) {
      track('ask_handoff', { reason: 'order' });
      return say(`<p>You can see your orders and their status in your account.</p><div class="prompts"><a href="https://account.krsaangi.us/orders">View your orders</a></div><p class="msg__why">You sign in with your email and a one-time code. If something looks wrong, our team can help.</p>${handoff}`);
    }
    const r = runSearch(text);
    if ((t === 'help with sizing' || /\b(siz(e|es|ing)|fit|measure\w*)\b/.test(t)) && !r.f.size) {
      const sz = [...new Set(P.filter(p => p.type === 'Blouse' && status(p) === 'in').flatMap(p => p.sizes))].sort();
      return say(`<p>Sarees are one size, so there is no size to choose.</p><p>Blouses do come in sizes. Each blouse page has a <b>Select size</b> box that shows the sizes for that blouse, and any size that is sold out cannot be added.</p><p>Which blouse size do you wear?</p><div class="prompts">${sz.map(z => `<button data-cg="Blouses in size ${z}">Size ${z}</button>`).join('')}</div><p class="msg__why">For exact measurements we don’t have verified information here. Our team can confirm before you buy.</p>${handoff}`);
    }
    const productish = r.notes.length || r.results.length && r.rest.length;
    for (const [re, ans, src] of POLICY) if (re.test(t) && !r.notes.some(n => n[0] === 'Colour' || n[0] === 'Weave' || n[0] === 'Category')) return say(`<p>${ans}</p><p class="msg__why">${src}</p>`);
    if (UNVERIFIED.test(t) && !r.f.weave && !r.f.families.length) { track('ask_handoff', { reason: 'unverified' }); return say(`<p>We don’t have verified information about that here.</p><p class="msg__why">Our team can answer this for you directly.</p>${handoff}`); }
    if (productish && r.results.length) {
      const top = r.results.filter(p => status(p) !== 'out').slice(0, 5);
      const list = top.length ? top : r.results.slice(0, 5);
      const inN = r.results.filter(p => status(p) === 'in').length;
      const und = r.notes.map(([k, v]) => `${k.toLowerCase()}: ${v}`).join('; ');
      const lead = r.relaxed ? `We couldn’t match everything exactly, so we relaxed ${r.relaxed}. These are the closest.`
        : top.length ? `Yes, we have ${inN === 1 ? 'one piece' : inN + ' pieces'} in stock that match. Here ${list.length === 1 ? 'it is' : `are ${list.length} of them`}:`
        : `These match, but they are sold out at the moment. We’re showing them so you can ask about a re-weave.`;
      const ruleNote = r.notes.filter(n => n[2]).map(n => `For “${n[0].toLowerCase()}” we looked at ${n[1]}.`).join(' ');
      say(`<p>${lead}</p>${und ? `<p class="msg__why">We looked for ${esc(und)}. ${ruleNote}</p>` : ''}`);
      extra(`<div class="cg-cards" role="list">${list.map(p => cgCard(p, whyLine(p, r.f))).join('')}</div>`);
      return say(`<p>Tap a picture to see the piece. Would you like to narrow it down?</p><div class="prompts"><a href="collection.html?q=${encodeURIComponent(text)}">See all ${r.results.length}</a>${r.f.avail ? '' : `<button data-cg="${esc(text)} ready to ship">Only in stock</button>`}${r.f.max ? '' : `<button data-cg="${esc(text)} under $500">Under $500</button>`}</div>`);
    }
    if (productish) return say(`<p>We couldn’t find a piece that matches that. Would you like to try a different colour or budget?</p><div class="prompts"><button data-cg="Sarees ready to ship">Sarees ready to ship</button><button data-cg="Kanjivarams">Kanjivarams</button></div>`);
    track('ask_handoff', { reason: 'unknown' });
    return say(`<p>We don’t have verified information about that here.</p><p class="msg__why">We can help with sarees, colours, sizes, prices and availability. For anything else, our team will answer.</p>${handoff}`);
  }
  function cgSend(text) {
    text = text.trim(); if (!text) return;
    $$('.choices', cgLog()).forEach(c => c.remove());
    const me = document.createElement('div'); me.className = 'msg msg--me'; me.textContent = text; cgLog().append(me);
    const wait = say('<span class="typing" aria-label="Krsaangi is typing"><i></i><i></i><i></i></span>');
    setTimeout(() => { wait.remove(); try { cgAnswer(text); } catch { say(`<p>Sorry, something went wrong on our side. Please try again, or reach our team:</p>${handoff}`); } }, reduced ? 0 : 520);
  }

  /* ── reveal on scroll + rails ────────────────────────────────────────── */
  function reveal(root = document) {
    if (reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');
    const io = reveal.io ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    $$('[data-reveal]:not(.is-in)', root).forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); else io.observe(el); });
    // Safety net: content must never stay hidden if the observer is throttled (background tabs, embedded previews).
    if (!reveal.bound) {
      reveal.bound = true; let last = 0;
      const sweep = () => { const now = Date.now(); if (now - last < 120) return; last = now; $$('[data-reveal]:not(.is-in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .94) el.classList.add('is-in'); }); };
      addEventListener('scroll', sweep, { passive: true });
    }
  }
  function bindRail(rail, nav) {
    if (!rail || !nav) return;
    const [prev, next] = $$('button', nav);
    const step = () => rail.clientWidth * .8;
    const upd = () => { prev.disabled = rail.scrollLeft < 8; next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8; };
    prev.onclick = () => rail.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' });
    next.onclick = () => rail.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' });
    rail.addEventListener('scroll', upd, { passive: true }); upd();
  }
  const railNav = label => `<div class="rail-nav" aria-label="${label}"><button aria-label="Previous">${I.left}</button><button aria-label="Next">${I.right}</button></div>`;

  /* ── live Instagram feed: any JSON source, normalised; cached 1 hour; falls back to what the page had ── */
  const IG_TTL = 36e5;
  function normaliseIG(j) {
    const list = Array.isArray(j) ? j : j.posts || j.data || j.items || [];
    return list.map(x => {
      const type = String(x.mediaType || x.media_type || '').toUpperCase();
      const isVideo = type === 'VIDEO' || type === 'REEL';
      const pic = x.sizes?.medium?.mediaUrl || x.thumbnailUrl || x.thumbnail_url || (!isVideo && (x.mediaUrl || x.media_url)) || x.image;
      return pic && (x.permalink || x.url) ? { href: x.permalink || x.url, src: pic, video: isVideo, alt: (x.prunedCaption || x.caption || '').slice(0, 120) } : null;
    }).filter(Boolean).slice(0, 8);
  }
  async function instagramFeed(el, max = 6) {
    const url = SETTINGS.instagramFeedUrl; if (!el || !url) return false;
    let posts = null;
    const cached = store.get('kr_ig', null);
    if (cached && cached.url === url && Date.now() - cached.at < IG_TTL) posts = cached.posts;
    if (!posts) {
      try { const r = await fetch(url, { headers: { accept: 'application/json' } }); if (!r.ok) throw 0; posts = normaliseIG(await r.json()); if (posts.length) store.set('kr_ig', { url, at: Date.now(), posts }); }
      catch { return false; }   // keep the fallback that is already on the page
    }
    if (!posts?.length) return false;
    el.innerHTML = posts.slice(0, max).map(x => `<a class="reel" href="${esc(x.href)}" target="_blank" rel="noopener" data-ig aria-label="${esc(x.alt || 'A Krsaangi post')} (opens Instagram in a new tab)">
        <img src="${esc(x.src)}" alt="" loading="lazy" decoding="async"><span class="reel__cap"><span>${x.video ? I.play + ' Reel' : I.ig.replace('class="ico"', 'style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4"') + ' @krsaangi'}</span></span></a>`).join('');
    el.dataset.live = '1';
    return true;
  }

  /* ── the "Ask us a question" prompt: after SETTINGS.askPromptDelay seconds on the site this session,
     once per session, never over an open panel, never again once dismissed ── */
  function askPrompt() {
    const K = 'kr_ask_time', delay = SETTINGS.askPromptDelay * 1000;
    let off = false; try { off = sessionStorage.getItem('kr_ask_shown') === '1' || localStorage.getItem('kr_ask_dismissed') === '1'; } catch { off = true; }
    if (off) return;
    let spent = 0; try { spent = +sessionStorage.getItem(K) || 0; } catch { /* starts at zero */ }
    let since = Date.now(), timer = null, sent = false;
    const save = () => { if (document.visibilityState === 'visible') spent += Date.now() - since; since = Date.now(); try { sessionStorage.setItem(K, spent); } catch { /* fine */ } };
    const busy = () => active || $('.lightbox.is-on') || $('#mega.is-on');
    let done = false;
    const show = () => {
      if (done) return;
      save();
      if (spent < delay) return arm();
      if (busy()) { timer = setTimeout(show, 1500); return; }   // wait until the cart, search or viewer is closed
      done = true; clearTimeout(timer);
      try { sessionStorage.setItem('kr_ask_shown', '1'); } catch { /* fine */ }
      open('askPrompt'); track('ask_prompt_shown');
    };
    const arm = () => { clearTimeout(timer); if (done) return; if (document.visibilityState === 'visible') timer = setTimeout(show, Math.max(250, delay - spent)); };
    document.addEventListener('visibilitychange', () => { save(); arm(); });
    addEventListener('pagehide', save);
    document.addEventListener('kr:closed', e => {
      if (e.detail !== 'askPrompt' || sent) return;
      try { localStorage.setItem('kr_ask_dismissed', '1'); } catch { /* fine */ }
      track('ask_prompt_dismissed');
    });
    const handOff = text => { sent = true; close(false); track('ask_submit', { from: 'prompt' }); open('ask'); cgStart(); if (text) cgSend(text); };
    $('#apForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#apInput').value.trim(); if (v) handOff(v); else $('#apInput').focus(); });
    $('#askPrompt').addEventListener('click', e => { const b = e.target.closest('[data-ap]'); if (b) handOff(b.dataset.ap); });
    arm();
  }

  /* ── global delegation ───────────────────────────────────────────────── */
  const closeHelp = () => { $('#helpMenu')?.classList.remove('is-on'); $('[data-helpmenu]')?.setAttribute('aria-expanded', 'false'); };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open],[data-close],[data-wish],[data-quick],[data-add],[data-qty],[data-sq],[data-cg],[data-checkout],[data-wa],[data-ig],[data-cgrec],[data-handoff],[data-helpmenu],[data-theme-toggle],[data-acct],#scrim, a[href^="#"]');
    if (!e.target.closest('.help, .help-menu')) closeHelp();
    if (!t) return;
    if (t.id === 'scrim' || t.hasAttribute('data-close')) return close();
    if (t.hasAttribute('data-helpmenu')) { const on = $('#helpMenu').classList.toggle('is-on'); t.setAttribute('aria-expanded', on); return; }
    if (t.hasAttribute('data-theme-toggle')) return setTheme(!isDark());
    if (t.dataset.open) { e.preventDefault(); closeHelp(); const id = t.dataset.open === 'concierge' ? 'ask' : t.dataset.open; if (id === 'search') return openSearch(); if (id === 'cart') return openCart(); if (id === 'ask') { track('ask_open'); open('ask'); return cgStart(); } return open(id); }
    if (t.dataset.wish) { e.preventDefault(); toggleWish(+t.dataset.wish); return; }
    if (t.dataset.quick) { e.preventDefault(); return openQuick(+t.dataset.quick); }
    if (t.dataset.add) { e.preventDefault(); const src = t.dataset.src || 'pdp'; if (src === 'complete_the_look') track('rec_add_to_cart', { item_id: t.dataset.add, source: 'complete_the_look' }); else if (/cross|step/.test(src)) track(src.includes('step') ? 'upsell_click' : 'cross_sell_click', { id: +t.dataset.add }); return addToBag(+t.dataset.add, { source: src, vid: t.dataset.vid ? +t.dataset.vid : undefined }); }
    if (t.dataset.qty) { const l = bag.find(x => x.vid === +t.dataset.qty); if (l) setQty(l.vid, l.qty + +t.dataset.d); return; }
    if (t.dataset.sq) { const i = $('#searchInput'); i.value = t.dataset.sq; renderSearch(i.value); i.focus(); return; }
    if (t.dataset.cg) return cgSend(t.dataset.cg);
    if (t.hasAttribute('data-checkout')) {
      // send begin_checkout first, then go to Shopify (at most 800 ms wait when GA4 is loaded)
      e.preventDefault(); checkingOut = true;
      const href = t.href; let gone = false; const go = () => { if (!gone) { gone = true; location.href = href; } };
      track('begin_checkout', { currency: 'USD', value: bagValue(), items: lineItems(), coupon: $('#discCode')?.value.trim() || undefined, event_callback: go });
      setTimeout(go, 800); return;
    }   // the link itself goes to Shopify
    if (t.dataset.acct) track('account_click', { target: t.dataset.acct });
    if (t.hasAttribute('data-cgrec')) track('ask_recommendation_click', { items: [gaItem(byId.get(+t.dataset.cgrec))] });
    if (t.hasAttribute('data-handoff')) track('ask_handoff', { via: t.textContent.trim() });
    if (t.hasAttribute('data-wa')) track('whatsapp_click', { where: t.className || 'link' });
    if (t.hasAttribute('data-ig')) track('instagram_click', { where: t.className || 'link' });
    const h = t.getAttribute('href');
    if (h === '#ask') { e.preventDefault(); track('ask_open'); open('ask'); return cgStart(); }
    if (h && h.startsWith('#') && h.length > 1 && !document.getElementById(h.slice(1))) {
      e.preventDefault();
      toast(h.includes('whatsapp') ? `Krsaangi’s WhatsApp number hasn’t been added yet. For now, please email ${SETTINGS.email}.` : 'This page is outside the prototype.');
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 'discCode') $('#checkoutLink').href = checkoutUrl(e.target.value.trim()); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHelp(); });
  document.addEventListener('kr:bag', renderCart);
  // select_item: a product card opened from any list (collection grid, homepage rail, search, recommendations)
  document.addEventListener('click', e => {
    const a = e.target.closest('.pc a[href*="product.html"], .pair a[href*="product.html"], .cg-card'); if (!a) return;
    const card = a.closest('.pc, .pair, .cg-card'), p = card.classList.contains('pc') ? byId.get(+card.dataset.id) : byHandle.get(new URL(a.href).searchParams.get('h'));
    if (!p) return;
    const list = card.closest('[data-list]')?.dataset.list || card.closest('[id]')?.id || pageType();
    const index = card.parentElement ? [...card.parentElement.children].indexOf(card) : undefined;
    track('select_item', { item_list_id: list, items: [gaItem(p, { index, item_list_id: list })] });
  }, true);
  // exit_with_cart: the visitor leaves the site (not to another page of ours, not to checkout) with items in the bag
  let checkingOut = false, internalNav = false;
  document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (a && a.origin === location.origin && !a.target) internalNav = true; }, true);
  document.addEventListener('submit', () => { internalNav = true; }, true);
  addEventListener('pagehide', () => { if (bagCount() && !checkingOut && !internalNav) track('exit_with_cart', { currency: 'USD', value: bagValue(), items: lineItems() }); });
  addEventListener('pageshow', e => { if (e.persisted) { internalNav = false; checkingOut = false; } });
  const pageType = () => document.body.dataset.page || ({ '': 'home', index: 'home', collection: 'collection', product: 'product', about: 'about', notes: 'notes' }[location.pathname.split('/').pop().replace('.html', '')] || 'other');
  // "Email me my bag": sends only with ticked consent; nothing is sent while no endpoint is configured
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'capForm') return; e.preventDefault();
    const em = $('#capEmail').value.trim(), ok = $('#capOk').checked, note = $('#capNote');
    const bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? 'Enter a valid email address, for example name@example.com.' : !ok ? 'Tick the box to agree to receive the email.' : '';
    note.className = 'form-note ' + (bad ? 'is-err' : '');
    if (bad) { note.textContent = bad; return; }
    if (!SETTINGS.cartCaptureUrl) { note.textContent = 'Emailing your bag isn’t switched on yet. Your bag is saved on this device.'; track('cart_email_unavailable'); return; }
    try {
      const r = await fetch(SETTINGS.cartCaptureUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: em, consent: true, items: bag.map(l => ({ variant_id: l.vid, quantity: l.qty })), url: checkoutUrl() }) });
      if (!r.ok) throw new Error(r.status);
      note.className = 'form-note is-ok'; note.textContent = 'Sent. Check your inbox for a link to your bag.'; track('cart_email_captured');   // no email in the event
    } catch { note.className = 'form-note is-err'; note.textContent = 'We couldn’t send it just now. Your bag is still saved on this device.'; }
  });
  // Welcome back: a returning visitor (new browser session) with items in the bag sees a quiet bar once
  function welcomeBack() {
    let seen = false; try { seen = sessionStorage.getItem('kr_session') === '1'; sessionStorage.setItem('kr_session', '1'); } catch { /* treat as first page */ }
    if (seen || !bagCount() || store.get('kr_wb_off', false)) return;
    const n = bagCount();
    document.querySelector('#hdr').insertAdjacentHTML('afterend', `<div class="wb" id="wb" role="status"><div class="wrap wb__in"><p>Welcome back — your bag is waiting. <span class="muted">${n} ${n === 1 ? 'piece' : 'pieces'}</span></p><button class="link" data-open="cart">View bag</button><button class="icon-btn" id="wbX" aria-label="Dismiss">${I.x}</button></div></div>`);
    $('#wbX').addEventListener('click', () => $('#wb').remove());
    track('welcome_back_shown', { items: n });
  }

  document.addEventListener('kr:wish', () => {
    $$('[data-wish]').forEach(b => b.setAttribute('aria-pressed', wish.has(+b.dataset.wish)));
    $$('[data-wishcount]').forEach(e => { e.hidden = !wish.size; e.textContent = wish.size; });
  });

  function mount() {
    loadGA4();
    // after the page script has set the title and content
    document.addEventListener('DOMContentLoaded', () => track('page_view', { page_type: pageType(), page_location: location.origin + location.pathname, page_title: document.title }), { once: true });
    $('#site-header').innerHTML = headerHTML();
    $('#site-footer').innerHTML = footerHTML();
    document.body.insertAdjacentHTML('beforeend', overlaysHTML());
    bindMega(); renderCart.quiet = true; renderCart(); renderCart.quiet = false; paintTheme(); welcomeBack(); askPrompt();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme);
    let st; $('#searchInput').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => renderSearch(e.target.value), 110); });
    $('#searchForm').addEventListener('submit', e => { e.preventDefault(); const q = $('#searchInput').value.trim(); if (q) location.href = 'collection.html?q=' + encodeURIComponent(q); });
    $('#cgForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#cgInput'); if (i.value.trim()) track('ask_submit', { from: 'drawer' }); cgSend(i.value); i.value = ''; });
    $$('.mnav a').forEach(a => a.addEventListener('click', () => close(false)));
    reveal();
  }

  window.KR = { P, COL, LEX, byId, byHandle, $, $$, esc, money, img, srcset, I, status, STATUS, isNew, collName, kicker, url, dot, card, availHTML, preWindow, fmtDate,
    FAMILIES, FAMILY_HEX, FAMILY_ALIAS, OCCASIONS, NAV, inColl, interpret, runSearch, matches, recs, coreSpecs, specsHTML, ctaLabel, track, toast, addToBag, toggleWish, wish: () => wish, bag: () => bag,
    open, close, openSearch, openCart, openQuick, reveal, bindRail, railNav, cLink, counts, SETTINGS, SHOP, REELS, FILM_SLOTS, instagramFeed, gaItem, JOURNAL, reduced, mount, variantOf, checkoutUrl, isDark };
  mount();
})();
