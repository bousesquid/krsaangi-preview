/* Collection page: faceted filtering over structured textile attributes.
   Facets with fewer than two live options are never shown. */
(() => {
  const { P, COL, LEX, byId, $, $$, esc, money, status, card, runSearch, FAMILIES, FAMILY_HEX, FAMILY_ALIAS, OCCASIONS, inColl, I, track, open, reveal, wish, cLink, toast, gaItem, R, NAV_PARENTS, grpLink, inGroup, parentOf, subKeys, subName } = window.KR;
  const qs = new URLSearchParams(location.search);
  /* Which listing this is comes from Shopify (window.KR_THEME.page): /collections/<handle> or /search?q=.
     Shopify's own collections that are lists rather than places (New Arrivals) become the matching filters. */
  const PG = window.KR_THEME?.page || {};
  const keyOf = h => Object.values(COL).find(k => k.handle === h)?.key;
  const FROM_PATH = new Set();
  const ALIAS = { 'new-arrivals': { sort: 'new' }, 'new-arrivals-in-stock': { sort: 'new', avail: 'in' } };
  if (PG.type === 'search' && PG.query && !qs.get('q')) qs.set('q', PG.query);
  if (PG.type === 'collection' && PG.handle && PG.handle !== 'all' && !qs.get('c')) {
    if (NAV_PARENTS[PG.handle] && !qs.get('g')) { qs.set('g', PG.handle); FROM_PATH.add('g'); }
    else if (keyOf(PG.handle)) { qs.set('c', keyOf(PG.handle)); FROM_PATH.add('c'); }   // already in the address; not repeated as ?c=
    else if (ALIAS[PG.handle]) for (const [k, v] of Object.entries(ALIAS[PG.handle])) { if (!qs.get(k)) qs.set(k, v); }
  }
  // any other Shopify collection: list the products Shopify rendered for it (data-handle on the server grid)
  const serverHandles = PG.type === 'collection' && PG.handle && PG.handle !== 'all' && !qs.get('c') && !qs.get('g') && !ALIAS[PG.handle] ? [...document.querySelectorAll('#grid [data-handle]')].map(n => n.dataset.handle) : null;
  if (PG.type === 'search' && qs.get('type') && !/^(Saree|Blouse|Jewellery|Accessory|Kids)$/.test(qs.get('type'))) qs.delete('type');   // Shopify's own ?type=product
  // old plural colour links (?family=Reds) land on the singular family
  { const f = qs.get('family'); if (f && f.split(',').some(v => FAMILY_ALIAS[v])) { qs.set('family', f.split(',').map(v => FAMILY_ALIAS[v] || v).join(',')); history.replaceState(null, '', location.pathname + '?' + qs); } }
  const occ = OCCASIONS.find(o => o.key === qs.get('occasion'));
  const x = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

  /* ── context: what this page is "about" (not removable) ──────────────── */
  let base = serverHandles ? serverHandles.map(h => P.find(p => p.handle === h)).filter(Boolean) : P, title = serverHandles ? (document.querySelector('#title')?.textContent || 'Collection') : 'All pieces', about = serverHandles ? (document.querySelector('#about')?.textContent || '') : 'Every piece: sarees, blouses, jewellery and accessories.', crumbs = [['Home', R.home]], notes = [], ctxEmpty = null;
  const c = COL[qs.get('c')], q = qs.get('q'), wl = qs.get('wishlist');
  const g = NAV_PARENTS[qs.get('g')] ? qs.get('g') : c && parentOf(c.key);   // main category (Ikat) of this page, if any
  if (NAV_PARENTS[qs.get('g')]) {
    const G = NAV_PARENTS[g]; base = P.filter(p => inGroup(p, g)); title = G.name; about = G.about || G.subtitle;
    crumbs.push(['Sarees', R.shop + '?type=Saree'], [G.name]);
  } else if (c) {
    base = P.filter(p => inColl(p, c.key)); title = c.name; about = c.about || c.subtitle;
    crumbs.push([c.type === 'Saree' || !c.type ? 'Sarees' : c.type === 'Blouse' ? 'Blouses' : c.type, c.type ? `${R.shop}?type=${c.type}` : R.shop + '?type=Saree'], ...(g ? [[NAV_PARENTS[g].name, grpLink(g)]] : []), [c.name]);
    if (!base.length) ctxEmpty = `<p class="eyebrow">Nothing here right now</p><h2 class="h3">${esc(c.name)} has no pieces <em>listed today.</em></h2><p class="muted">New pieces are added often. Ask us and we will tell you what is coming.</p>`;
  } else if (occ) {
    // an occasion is a named set of ordinary filters (OCCASIONS in app.js); they arrive below as removable chips
    title = occ.label; crumbs.push(['Occasion'], [occ.label]);
    about = `A starting selection: ${occ.note}. Remove or change any filter to widen it.`;
  } else if (qs.get('weave')) {
    const w = qs.get('weave'); base = P.filter(p => p.weave === w); title = w; crumbs.push(['Sarees', R.shop + '?type=Saree'], [w]);
    about = (w === 'Kanjivaram' ? COL.kanjivaram?.about : Object.values(COL).find(k => k.weave === w)?.about) || '';
  } else if (q) {
    const r = runSearch(q); base = r.results; notes = r.notes; title = `“${q}”`; crumbs.push(['Search']);
    about = r.relaxed ? `No exact match, so we relaxed ${r.relaxed}. These are the closest pieces.` : (r.corrected ? `Showing results for “${r.corrected}”.` : 'Results are matched on colour, weave, border, motif, price and availability.');
    track('search', { search_term: q, results: base.length, where: 'results_page' });
    if (!base.length) ctxEmpty = `<p class="eyebrow">No results</p><h2 class="h3">Nothing matches <em>“${esc(q)}”</em> yet.</h2><p class="muted">Try a colour, a weave or a price. You can also ask us and we will look with you.</p>`;
  } else if (wl) {
    const ids = wl === '1' ? [...wish()] : wl.split(',').map(Number);
    base = ids.map(id => byId.get(id)).filter(Boolean); title = wl === '1' ? 'Your wishlist' : 'A shared wishlist'; crumbs.push(['Wishlist']);
    about = wl === '1' ? 'Saved on this device. Sign in to keep your wishlist across devices, or share it with family.' : 'Someone shared these pieces with you.';
    if (!base.length) ctxEmpty = `<p class="eyebrow">Nothing saved yet</p><h2 class="h3">Save the pieces you are <em>considering.</em></h2><p class="muted">Tap the heart on any saree to keep it here, then share the list with family before you decide.</p>`;
  } else if (qs.get('colour')) {
    const n = qs.get('colour'), l = LEX.find(e => e.name === n);
    base = P.filter(p => p.color?.name === n || p.color2?.name === n); title = n; crumbs.push(['Colour'], [n]);
    about = `Pieces where ${n} is the body or the border colour.${l ? ` Part of the ${l.family} family.` : ''}`;
  }

  /* ── facet model ─────────────────────────────────────────────────────── */
  const FACETS = [
    { key: 'avail', label: 'Availability', get: p => [status(p)], names: { in: 'In Stock', pre: 'Preorder available', out: 'Sold out' }, order: ['in', 'pre', 'out'], open: true },
    { key: 'type', label: 'Category', get: p => [p.type], names: { Saree: 'Sarees', Blouse: 'Blouses', Jewellery: 'Jewellery', Accessory: 'Accessories', Kids: 'Kids' } },
    // Size reads the real Shopify variants: a product matches only if that size is available to buy
    { key: 'size', label: 'Size', get: p => p.sizes, order: ['32', '34', '36', '38', '40', '42', '44', '46', '48'], open: true, hint: 'Sizes in stock, from each product’s variants' },
    { key: 'price', label: 'Price', range: true, open: true },
    { key: 'weave', label: 'Weave', get: p => p.weave ? [p.weave] : [], open: true },
    { key: 'family', label: 'Colour', get: p => [p.color?.family, p.color2?.family].filter(Boolean), order: FAMILIES, swatch: true, open: true, hint: 'Body or border' },
    { key: 'collection', label: 'Collection', get: p => [p.collection], names: Object.fromEntries(Object.values(COL).map(k => [k.key, k.name])) },
    { key: 'fabric', label: 'Fabric', get: p => p.fabric ? [p.fabric] : [] },
    { key: 'zari', label: 'Zari', get: p => p.zari ? [p.zari] : [], names: { Zari: 'With zari', 'No Zari': 'No zari' } },
    { key: 'border', label: 'Border', get: p => p.border || [] },
    { key: 'motif', label: 'Pattern & motif', get: p => p.motif || [] },
  ];
  const sel = Object.fromEntries(FACETS.filter(f => !f.range).map(f => [f.key, new Set()]));
  const lo = base.length ? Math.floor(Math.min(...base.map(p => p.price)) / 5) * 5 : 0, hi = base.length ? Math.ceil(Math.max(...base.map(p => p.price)) / 5) * 5 : 0;
  let pmin = lo, pmax = hi, sort = qs.get('sort') || 'new', shown = 24, cols = 3;

  // filters arriving in the URL become removable chips
  const pre = (k, v) => v && v.split(',').forEach(s => sel[k].add(s));
  pre('avail', qs.get('avail')); pre('type', qs.get('type')); pre('size', qs.get('size')); pre('family', qs.get('family')); pre('zari', qs.get('zari'));
  ['weave', 'collection', 'fabric', 'border', 'motif'].forEach(k => pre(k, qs.get('f_' + k)));
  if (occ) { for (const [k, v] of Object.entries(occ.filter)) if (k !== 'max') v.forEach(x => sel[k].add(x)); }
  if (qs.get('min')) pmin = Math.max(lo, +qs.get('min')); if (qs.get('max')) pmax = Math.min(hi, +qs.get('max'));
  if (occ?.filter.max && !qs.get('max')) pmax = Math.min(hi, occ.filter.max);
  if (!c && !qs.get('g') && !q && !wl && !occ && !qs.get('weave') && !qs.get('colour')) {
    const t = [...sel.type][0], a = [...sel.avail][0], f = [...sel.family][0];
    if (sel.type.size === 1 && !a && !f) { title = { Saree: 'Sarees', Blouse: 'Blouses', Jewellery: 'Jewellery', Accessory: 'Accessories', Kids: 'Kids' }[t]; about = t === 'Saree' ? 'Kanjivarams, Gadwals, ikats, jamdanis and regional handlooms.' : ''; }
    else if (a === 'in' && sel.avail.size === 1) { title = 'In Stock'; about = 'Only pieces in stock today. Dispatched from the USA.'; }
    else if (a === 'pre') { title = 'Preorder available'; about = `Selected sold-out Kanjivarams, woven specifically for you. Estimated dispatch ${window.KR.SETTINGS.preorderDispatch}.`; }
    else if (f && sel.family.size === 1) { title = f; about = `Every piece whose body or border falls in the ${f} family, each with its traditional colour name.`; }
    else if (qs.get('sort') === 'new') { title = 'New Arrivals'; about = 'The latest additions across every collection.'; }
    crumbs.push([title]);
  }

  const pass = (p, skip) => {
    for (const f of FACETS) {
      if (f.key === skip) continue;
      if (f.range) { if (p.price < pmin || p.price > pmax) return false; continue; }
      const s = sel[f.key]; if (s.size && !f.get(p).some(v => s.has(v))) return false;
    }
    return true;
  };
  // Default order is newest first by publish time. Sold-out pieces keep their place; nothing is demoted unless the customer filters.
  const byNew = (a, b) => (b.published > a.published ? 1 : b.published < a.published ? -1 : 0);
  const sorters = { new: byNew, low: (a, b) => a.price - b.price || byNew(a, b), high: (a, b) => b.price - a.price || byNew(a, b) };
  const activeCount = () => Object.values(sel).reduce((n, s) => n + s.size, 0) + (pmin > lo || pmax < hi ? 1 : 0);

  /* ── render filters (same markup in sidebar and mobile drawer) ───────── */
  function filtersHTML(prefix) {
    return FACETS.map(f => {
      if (f.range) {
        if (hi - lo < 10) return '';
        return `<details class="fgroup" ${f.open ? 'open' : ''} data-f="price"><summary>Price<i></i></summary><div class="fgroup__body"><div class="range">
          <div class="range__track"><div class="range__fill" data-fill></div>
            <input type="range" min="${lo}" max="${hi}" step="5" value="${pmin}" data-r="min" aria-label="Minimum price">
            <input type="range" min="${lo}" max="${hi}" step="5" value="${pmax}" data-r="max" aria-label="Maximum price"></div>
          <div class="range__vals"><label>$<span class="sr">Minimum price</span><input type="number" inputmode="numeric" min="${lo}" max="${hi}" step="5" value="${pmin}" data-n="min" id="${prefix}-min"></label><span>to</span>
            <label>$<span class="sr">Maximum price</span><input type="number" inputmode="numeric" min="${lo}" max="${hi}" step="5" value="${pmax}" data-n="max" id="${prefix}-max"></label></div></div></div></details>`;
      }
      const counts = {}; base.filter(p => pass(p, f.key)).forEach(p => new Set(f.get(p)).forEach(v => counts[v] = (counts[v] || 0) + 1));
      const all = new Set(); base.forEach(p => f.get(p).forEach(v => all.add(v)));
      let opts = [...all]; if (opts.length < 2) return '';
      opts = f.order ? f.order.filter(o => all.has(o)) : opts.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
      const rows = opts.map(o => {
        const n = counts[o] || 0, on = sel[f.key].has(o), name = f.names?.[o] || o;
        return `<label class="fopt" ${!n && !on ? 'style="opacity:.42"' : ''}><input type="checkbox" data-k="${f.key}" value="${esc(o)}" ${on ? 'checked' : ''} ${!n && !on ? 'disabled' : ''} ${f.swatch ? `style="--c:${FAMILY_HEX[o] === 'multi' ? 'conic-gradient(#6D1F2A,#D9A21B,#2F6B46,#1E7FA0,#7A2A6B,#6D1F2A)' : FAMILY_HEX[o]}"` : ''}><span>${esc(name)}</span><span>${n}</span></label>`;
      }).join('');
      return `<details class="fgroup" ${f.open || sel[f.key].size ? 'open' : ''} data-f="${f.key}"><summary>${f.label}${sel[f.key].size ? ` (${sel[f.key].size})` : ''}<i></i></summary>
        <div class="fgroup__body ${f.swatch ? 'fsw' : ''}">${f.hint ? `<p class="fine" style="grid-column:1/-1;margin-bottom:4px">${f.hint}</p>` : ''}${rows}</div></details>`;
    }).join('');
  }
  function paintRange(root) {
    const fill = $('[data-fill]', root); if (!fill) return;
    const span = hi - lo || 1; fill.style.left = ((pmin - lo) / span * 100) + '%'; fill.style.right = ((hi - pmax) / span * 100) + '%';
    $('[data-r="min"]', root).value = pmin; $('[data-r="max"]', root).value = pmax; $('[data-n="min"]', root).value = pmin; $('[data-n="max"]', root).value = pmax;
  }
  function renderFilters() {
    ['filtersSide', 'filtersDrawer'].forEach(id => {
      const el = $('#' + id), openState = Object.fromEntries($$('details', el).map(d => [d.dataset.f, d.open]));
      el.innerHTML = filtersHTML(id);
      $$('details', el).forEach(d => { if (d.dataset.f in openState) d.open = openState[d.dataset.f]; });
      paintRange(el);
    });
  }

  /* ── render results ──────────────────────────────────────────────────── */
  function chipsHTML() {
    const out = notes.map(([k, v, rule]) => `<span class="chip chip--note" ${rule ? 'title="Curation rule"' : ''}>${k}: ${esc(v)}</span>`);
    for (const f of FACETS) {
      if (f.range) { if (pmin > lo || pmax < hi) out.push(`<button class="chip" data-clear="price" aria-label="Remove price filter">${money(pmin)} – ${money(pmax)} ${x}</button>`); continue; }
      sel[f.key].forEach(v => out.push(`<button class="chip" data-rm="${f.key}" data-v="${esc(v)}" aria-label="Remove filter ${esc(f.names?.[v] || v)}">${f.key === 'size' ? 'Size ' : ''}${esc(f.names?.[v] || v)} ${x}</button>`));
    }
    if (activeCount()) out.push('<button class="chip chip--plain" data-clear="all">Clear all</button>');
    if (wl === '1' && base.length) out.push(`<button class="chip" data-share>Share wishlist</button>`);
    return out.join('');
  }
  function render({ keepFilters = false } = {}) {
    const list = base.filter(p => pass(p)).sort(sorters[sort]);
    $('#count').textContent = list.length; $('#count').nextElementSibling.textContent = list.length === 1 ? 'piece' : 'pieces';
    $('#fcount').textContent = activeCount() ? `(${activeCount()})` : '';
    $('#applyDrawer').textContent = `Show ${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
    $('#chips').innerHTML = chipsHTML();
    const sw = $('#inStockOnly'); sw.checked = sel.avail.size === 1 && sel.avail.has('in');
    const grid = $('#grid'), more = $('#more');
    if (!list.length) {
      const sug = P.filter(p => status(p) === 'in' && p.type === 'Saree').slice(0, cols);
      grid.innerHTML = `<div class="empty">${ctxEmpty || `<p class="eyebrow">No matches</p><h2 class="h3">No pieces match <em>these filters.</em></h2><p class="muted">Remove a filter or widen the price range. Sold-out pieces stay listed so you can ask about a re-weave.</p>`}
        <div class="empty__acts">${activeCount() ? '<button class="btn btn--sm" data-clear="all">Clear all filters</button>' : '<a class="btn btn--sm" href="${R.shop}?avail=in">Shop In Stock</a>'}<button class="btn btn--ghost btn--sm" data-open="ask">Ask us a question</button></div></div>
        <p class="eyebrow" style="grid-column:1/-1">In Stock</p>${sug.map(p => card(p)).join('')}`;
      more.hidden = true;
    } else {
      grid.innerHTML = list.slice(0, shown).map((p, i) => card(p, { eager: i < 3, sizes: '(max-width:980px) 50vw, 28vw' })).join('');
      more.hidden = list.length <= 24;
      const n = Math.min(shown, list.length);
      more.innerHTML = `<p class="fine num">Showing ${n} of ${list.length}</p><div class="progress"><i style="width:${n / list.length * 100}%"></i></div>${n < list.length ? '<button class="btn btn--ghost" id="loadMore">Load more</button>' : ''}`;
    }
    if (!keepFilters) renderFilters();
    grid.dataset.list = listId();
    // shareable URL: active filters live in the query string
    const u = new URLSearchParams(); ['c', 'g', 'weave', 'q', 'wishlist', 'colour', 'occasion'].forEach(k => qs.get(k) && !FROM_PATH.has(k) && u.set(k, qs.get(k)));
    for (const k in sel) if (sel[k].size) u.set(['avail', 'type', 'family', 'zari', 'size'].includes(k) ? k : 'f_' + k, [...sel[k]].join(','));
    if (pmin > lo) u.set('min', pmin); if (pmax < hi) u.set('max', pmax); if (sort !== 'new' || qs.get('sort') === 'new') u.set('sort', sort);
    history.replaceState(null, '', location.pathname + (u.size ? '?' + u : ''));
  }

  /* ── head ────────────────────────────────────────────────────────────── */
  $('#title').textContent = title; $('#about').textContent = about;
  /* subcategories of a main category (Ikat → Patola, Pochampally, Odisha), on the category and on each subcategory */
  if (g && !$('#subcats')) {
    const cur = c?.key, link = (h, n, on) => `<a href="${h}"${on ? ' aria-current="page"' : ''}>${esc(n)}</a>`;
    $('#about').insertAdjacentHTML('afterend', `<nav class="subcats" id="subcats" aria-label="${esc(NAV_PARENTS[g].name)} types">${link(grpLink(g), 'All ' + NAV_PARENTS[g].name, !cur)}${subKeys(g).map(k => link(cLink(k), subName(k), k === cur)).join('')}</nav>`);
  }
  document.title = `${title.replace(/[“”]/g, '')} — Krsaangi`;
  $('#crumbs').innerHTML = crumbs.map(([n, h], i) => `<li>${h && i < crumbs.length - 1 ? `<a href="${h}">${esc(n)}</a>` : `<span ${i === crumbs.length - 1 ? 'aria-current="page"' : ''}>${esc(n)}</span>`}</li>`).join('');
  const ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, ...(h ? { item: 'https://krsaangi.us/' + h } : {}) })) });
  document.head.append(ld);
  $('#sort').value = sort in sorters ? sort : 'new'; sort = $('#sort').value;
  /* item_list_id names what the customer is looking at: the collection (or weave, occasion, colour, search),
     plus any filters and the sort, e.g. "c:gadwal|avail:in|sort:new". */
  const listId = () => {
    const ctx = c ? 'c:' + c.key : occ ? 'occasion:' + occ.key : qs.get('weave') ? 'weave:' + qs.get('weave') : qs.get('colour') ? 'colour:' + qs.get('colour') : q ? 'search' : wl ? 'wishlist' : 'all';
    const f = Object.entries(sel).filter(([, s]) => s.size).map(([k, s]) => `${k}:${[...s].join('+')}`);
    if (pmin > lo || pmax < hi) f.push(`price:${pmin}-${pmax}`);
    return [ctx, ...f, 'sort:' + sort].join('|');
  };
  const firstItems = () => base.filter(p => pass(p)).sort(sorters[sort]).slice(0, 12).map((p, i) => gaItem(p, { index: i }));
  document.querySelector('#grid').dataset.list = listId();
  track('view_item_list', { item_list_id: listId(), item_list_name: title.replace(/[“”]/g, ''), results: base.filter(p => pass(p)).length, items: firstItems() });

  /* ── events ──────────────────────────────────────────────────────────── */
  const onFilter = e => {
    const t = e.target;
    if (t.dataset.k) { const fid = t.form?.id; t.checked ? sel[t.dataset.k].add(t.value) : sel[t.dataset.k].delete(t.value); shown = 24; track('filter_apply', { facet: t.dataset.k, value: t.value, on: t.checked }); render(); const again = fid && $(`#${fid} input[data-k="${t.dataset.k}"][value="${CSS.escape(t.value)}"]`); again?.focus(); }
  };
  const onRange = (e, commit) => {
    const t = e.target, root = t.form; if (!t.dataset.r && !t.dataset.n) return;
    let v = +t.value || 0; const which = t.dataset.r || t.dataset.n;
    if (which === 'min') pmin = Math.max(lo, Math.min(v, pmax - 5)); else pmax = Math.min(hi, Math.max(v, pmin + 5));
    if (t.dataset.r || commit) paintRange(root);
    if (commit) { shown = 24; track('filter_apply', { facet: 'price', min: pmin, max: pmax }); render({ keepFilters: true }); ['filtersSide', 'filtersDrawer'].forEach(id => paintRange($('#' + id))); }
  };
  ['filtersSide', 'filtersDrawer'].forEach(id => {
    const el = $('#' + id);
    el.addEventListener('change', e => { e.target.dataset.k ? onFilter(e) : onRange(e, true); });
    el.addEventListener('input', e => { if (e.target.dataset.r) onRange(e, false); });
    el.addEventListener('submit', e => e.preventDefault());
  });
  const clearAll = () => { for (const k in sel) sel[k].clear(); pmin = lo; pmax = hi; shown = 24; render(); };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-rm],[data-clear],#loadMore,[data-cols],#openFilters,#clearDrawer,[data-share]'); if (!t) return;
    if (t.dataset.rm) { sel[t.dataset.rm].delete(t.dataset.v); shown = 24; render(); }
    else if (t.dataset.clear === 'price') { pmin = lo; pmax = hi; render(); }
    else if (t.dataset.clear === 'all' || t.id === 'clearDrawer') clearAll();
    else if (t.id === 'loadMore') { const at = $$('#grid .pc').length; shown += 24; render({ keepFilters: true }); $$('#grid .pc')[at]?.querySelector('a[href]:not([tabindex])')?.focus(); }
    else if (t.dataset.cols) { cols = +t.dataset.cols; $('#grid').dataset.cols = cols; $$('[data-cols]', $('.dens')).forEach(b => b.setAttribute('aria-pressed', b === t)); }
    else if (t.id === 'openFilters') open('filters');
    else if (t.hasAttribute('data-share')) {
      const link = location.origin + location.pathname + '?wishlist=' + [...wish()].join(',');
      (navigator.clipboard?.writeText(link) || Promise.reject()).then(() => toast('Wishlist link copied. Anyone with the link can view it.'), () => toast('Copy this link: ' + link));
    }
  });
  $('#inStockOnly').addEventListener('change', e => { sel.avail.clear(); if (e.target.checked) sel.avail.add('in'); shown = 24; track('filter_apply', { facet: 'avail', value: 'in', on: e.target.checked }); render(); });
  $('#sort').addEventListener('change', e => { sort = e.target.value; render({ keepFilters: true }); track('filter_apply', { facet: 'sort', value: sort }); });
  document.addEventListener('kr:wish', () => { if (wl === '1') { base = [...wish()].map(id => byId.get(id)).filter(Boolean); render(); } });

  render();
  reveal();
})();
