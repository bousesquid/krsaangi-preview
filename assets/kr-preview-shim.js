/* Public preview only (GitHub Pages has no Shopify behind it). Answers the theme's Shopify requests in the
   browser: the catalogue feed from static JSON files, and the cart API (/cart.js, add, change, update, clear)
   from localStorage, with the same rules as tools/theme_mock_server.py: sold-out pieces are refused, a
   preorder purchase option charges 30% today, and line properties are kept. Checkout is a preview page.
   Not part of the Shopify theme. */
(() => {
  const BASE = window.KR_PREVIEW_BASE;
  const KEY = 'kr_preview_cart';
  const real = window.fetch.bind(window);
  const json = (o, status = 200) => Promise.resolve(new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } }));
  let index = null;   // variant id → { p, v }
  async function variants() {
    if (index) return index;
    index = new Map();
    for (let n = 1, pages = 1; n <= pages; n++) {
      const j = await real(`${BASE}data/catalog-${n}.json`).then(r => r.json());
      pages = j.pages;
      j.products.forEach(p => p.variants.forEach(v => index.set(v.id, { p, v })));
    }
    const s = window.KR_THEME?.settings?.stitching;
    if (s) index.set(s.vid, { p: { id: 9100, handle: s.handle, title: s.title, type: 'Service', images: [] }, v: { id: s.vid, title: 'Default Title', available: true, price: Math.round(s.price * 100), plans: [] } });
    return index;
  }
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { items: [], attributes: {} }; } catch { return { items: [], attributes: {} }; } };
  const save = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* private mode */ } };
  const cartJSON = c => {
    const total = c.items.reduce((t, i) => t + i.line_price, 0);
    return { token: 'preview', items: c.items, item_count: c.items.reduce((t, i) => t + i.quantity, 0), total_price: total, original_total_price: total, currency: 'USD', attributes: c.attributes };
  };
  const reprice = i => {
    i.line_price = i.price * i.quantity;
    if (i.selling_plan_allocation) { const a = i.selling_plan_allocation; a.remaining_balance_charge_amount = i.price - a.checkout_charge_amount; }
    return i;
  };
  const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h).toString(36); };

  async function add(body) {
    const idx = await variants(), c = load(), added = [];
    for (const it of body.items || [{ id: body.id, quantity: body.quantity || 1 }]) {
      const hit = idx.get(+it.id);
      if (!hit) return json({ status: 404, message: 'Cart Error', description: 'Cannot find variant' }, 404);
      const { p, v } = hit;
      if (!v.available) return json({ status: 422, message: 'Cart Error', description: `The product '${p.title}' is already sold out.` }, 422);
      const plan = it.selling_plan ? (v.plans || []).find(x => x.id === +it.selling_plan) : null;
      if (it.selling_plan && !plan) return json({ status: 422, message: 'Cart Error', description: 'This selling plan is not available.' }, 422);
      const props = it.properties || {}, key = `${v.id}:${hash(JSON.stringify(props) + (plan ? plan.id : ''))}`;
      let line = c.items.find(i => i.key === key);
      if (line) line.quantity += +(it.quantity || 1);
      else {
        line = { key, id: v.id, variant_id: v.id, product_id: p.id, quantity: +(it.quantity || 1), handle: p.handle, product_type: p.type,
          title: p.title + (v.title === 'Default Title' ? '' : ' - ' + v.title), product_title: p.title, variant_title: v.title === 'Default Title' ? null : v.title,
          price: v.price, original_price: v.price, final_price: v.price, image: p.images?.[0]?.src || null, url: `${BASE}products/${p.handle}`, properties: props,
          selling_plan_allocation: plan ? { price: v.price, checkout_charge_amount: plan.deposit, remaining_balance_charge_amount: v.price - plan.deposit, selling_plan: { id: plan.id, name: 'Preorder: 30% now, balance before dispatch' } } : null };
        c.items.push(line);
      }
      reprice(line); added.push(line.key);
    }
    save(c);
    return json({ items: c.items.filter(i => added.includes(i.key)) });
  }
  function change(body) {
    const c = load(), id = String(body.id), q = +body.quantity;
    const line = c.items.find(i => i.key === id || String(i.variant_id) === id);
    if (!line) return json({ status: 400, message: 'no valid id or line parameter' }, 400);
    if (q <= 0) c.items = c.items.filter(i => i !== line); else reprice(Object.assign(line, { quantity: q }));
    save(c); return json(cartJSON(c));
  }
  function update(body) {
    const c = load();
    for (const [k, q] of Object.entries(body.updates || {})) {
      const line = c.items.find(i => i.key === k || String(i.variant_id) === k);
      if (!line) continue;
      if (+q <= 0) c.items = c.items.filter(i => i !== line); else reprice(Object.assign(line, { quantity: +q }));
    }
    for (const [k, v] of Object.entries(body.attributes || {})) if (v !== null && v !== '') c.attributes[k] = v;
    save(c); return json(cartJSON(c));
  }

  window.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin !== location.origin) return real(input, init);
    const path = url.pathname, body = () => { try { return JSON.parse(init.body || '{}'); } catch { return {}; } };
    if (url.searchParams.get('view') === 'kr-catalog') return real(`${BASE}data/catalog-${url.searchParams.get('page') || 1}.json`, init);
    if (path.endsWith('/cart.js')) return json(cartJSON(load()));
    if (path.endsWith('/cart/add.js')) return add(body());
    if (path.endsWith('/cart/change.js')) return change(body());
    if (path.endsWith('/cart/update.js')) return update(body());
    if (path.endsWith('/cart/clear.js')) { save({ items: [], attributes: {} }); return json(cartJSON(load())); }
    return real(input, init);
  };
})();
