/* Notes page: tables are computed from the catalog so they never drift from the data. */
(() => {
  const { P, COL, LEX, $, esc, FAMILIES, status } = window.KR;
  const sarees = P.filter(p => p.type === 'Saree');
  const vals = get => { const m = {}; P.forEach(p => [].concat(get(p) || []).forEach(v => v && (m[v] = (m[v] || 0) + 1))); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const cov = get => Math.round(sarees.filter(p => [].concat(get(p) || []).filter(Boolean).length).length / sarees.length * 100) + '%';
  const list = e => e.map(([v, n]) => `${esc(v)} <span class="muted num">${n}</span>`).join(' · ');

  $('#nProducts').textContent = P.length;
  ['#nAll', '#nAll2'].forEach(i => $(i).textContent = P.length.toLocaleString('en-US'));
  $('#nIn').textContent = P.filter(p => status(p) === 'in').length;
  $('#nSized').textContent = P.filter(p => p.variants.length).length;
  $('#nColl').textContent = new Set(P.map(p => p.collection)).size;

  const rows = [
    ['Availability', 'Variant availability', vals(p => ({ in: 'In stock', pre: 'Preorder', out: 'Sold out' }[status(p)])), '100%', 'Preorder appears only when Krsaangi adds preorder data'],
    ['Size', 'Variant option “Size”', vals(p => p.sizes), 'Blouses', 'A product matches only if that size is in stock. Range sizes cover each size in the range'],
    ['Price', 'Variant price', [['Range slider with editable values', '']], '100%', ''],
    ['Weave', 'textile.weave', vals(p => p.weave), cov(p => p.weave), 'Add Patola, Baluchari, Odisha Ikat, Kanchi Cotton, Kotpad, Bhujodi as they enter the sample'],
    ['Fabric', 'textile.fabric', vals(p => p.fabric), cov(p => p.fabric), 'Planned values: Pure Silk, Silk Cotton, Cotton, Tussar, Linen, Khadi'],
    ['Colour', 'colour.family (body or border)', vals(p => [p.color?.family, p.color2?.family]), cov(p => p.color), 'Families only in the filter; exact names on the product'],
    ['Collection', 'house_collection', vals(p => COL[p.collection]?.name), '100%', ''],
    ['Zari', 'textile.zari', vals(p => p.zari), cov(p => p.zari), 'Planned: Zari, No Zari, Silver-toned, Gold-toned, Other'],
    ['Border', 'textile.border', vals(p => p.border), cov(p => p.border), 'Planned additions: Self, Borderless, Wide Border'],
    ['Pattern & motif', 'textile.motif', vals(p => p.motif), cov(p => p.motif), ''],
    ['Occasion', 'textile.occasion', [['Not tagged yet', '']], '0%', 'Hidden until tagged: Bridal, Wedding, Festive, Formal, Everyday, Gifting'],
    ['Style', 'textile.style', [['Not tagged yet', '']], '0%', 'Hidden until tagged: Classic, Heritage, Minimal, Statement, Contemporary'],
    ['Pallu', 'textile.pallu', [['Not tagged yet', '']], '0%', 'Hidden until tagged'],
  ];
  $('#taxTable').innerHTML = '<tr><th>Filter</th><th>Field</th><th>Values in the sample</th><th>Saree coverage</th><th>Notes</th></tr>' +
    rows.map(([f, field, v, c, n]) => `<tr><td>${f}</td><td><code>${field}</code></td><td>${list(v)}</td><td class="num">${c}</td><td class="muted">${n}</td></tr>`).join('');

  const used = new Set(P.flatMap(p => [p.color?.name, p.color2?.name]).filter(Boolean));
  $('#colourTable').innerHTML = '<tr><th>Family</th><th>Traditional and descriptive names in the sample</th><th>Also found by</th></tr>' + FAMILIES.map(f => {
    const names = [...new Set(LEX.filter(l => l.family === f && used.has(l.name)).map(l => l.name))];
    const alias = { Red: 'red, dark red, deep red, scarlet, burgundy', Pink: 'pink, rose, fuchsia', Purple: 'purple, eggplant, plum, mauve', Blue: 'blue, turquoise, azure', Green: 'green', 'Yellow & Gold': 'yellow, gold, golden', Orange: 'orange, saffron', 'Ivory & Neutrals': 'ivory, white, cream, beige, grey', 'Earth & Brown': 'brown, earthy', Black: 'black', Multicolor: 'multicolor, multi' }[f];
    return names.length ? `<tr><td>${f}</td><td>${names.map(n => { const l = LEX.find(x => x.name === n); return `<span style="white-space:nowrap"><i class="dot" style="display:inline-block;vertical-align:-2px;margin-right:5px;background:${l.hex === 'multi' ? 'conic-gradient(#6D1F2A,#D9A21B,#2F6B46,#1E7FA0,#7A2A6B,#6D1F2A)' : l.hex}"></i>${n}</span>`; }).join(' &nbsp; ')}</td><td class="muted">${alias}</td></tr>` : '';
  }).join('');

  const pick = k => P.filter(p => p.collection === k && p.colorLine)[0];
  $('#nameTable').innerHTML = '<tr><th>Listed today as</th><th>Collection</th><th>Design</th><th>Colour</th></tr>' +
    ['pazhamai', 'mythili', 'maathey', 'kattam', 'gadwal', 'sungudi', 'blouses'].map(pick).filter(Boolean)
      .map(p => `<tr><td style="white-space:normal;font-weight:400">${esc(p.sourceTitle)}</td><td>${esc(COL[p.collection].name)}</td><td>${esc(p.name)}</td><td>${esc(p.colorLine)}</td></tr>`).join('');

  $('#eventList').innerHTML = ['view_item', 'view_collection', 'search', 'search_no_results', 'filter', 'wishlist', 'quick_view', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase', 'preorder', 'recommendation_click', 'upsell_click', 'cross_sell_click', 'whatsapp_click', 'ai_open', 'ai_recommendation_click', 'ai_handoff', 'newsletter_signup']
    .map(e => `<span style="text-transform:none;letter-spacing:0;font-family:ui-monospace,Menlo,monospace">${e}</span>`).join('');
  document.head.insertAdjacentHTML('beforeend', '<style>#eventList span + span::before{content:none}</style>');
})();
