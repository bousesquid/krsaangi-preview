/* Krsaangi theme boot.
   1. Reads the live catalogue from Shopify (templates/collection.kr-catalog.liquid, 250 products a page).
   2. Builds window.KR_DATA in the same shape the prototype used ({products, collections, lexicon}).
      Structured attributes come from the product's `krsaangi.*` metafields when they are filled in, and are
      otherwise derived from Krsaangi's own titles and descriptions — a faithful port of tools/build_catalog.py.
   3. Caches the result in localStorage (fresh 15 min, usable up to 24 h while a refresh runs in the background).
   4. Loads the shared app script and the page script, in order.
   Configuration arrives in window.KR_THEME (snippets/kr-config.liquid). */
(() => {
  'use strict';
  const T = window.KR_THEME || {};

  /* ── collections: key, handle, name, subtitle, default weave, default fabric, type (Krsaangi's own names) ── */
  const COLLECTIONS = [
    ['pazhamai', 'pazhamai-vintage-recreated-kanjivarams', 'Pazhamai', 'Vintage recreated Kanjivarams', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['mythili', 'mythili-korvai-kanjivarams', 'Mythili', 'Korvai Kanjivarams', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['maathey', 'maathey-mothers-kanjivaram', 'Maathey', "Mother's Kanjivaram", 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['snigdha', 'snigdha-no-zari-kanjivarams', 'Snigdha', 'No-zari Kanjivarams', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['swara', 'swara-essential-kanjivarams', 'Swara', 'Essential Kanjivarams', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['kattam', 'project-kattam-collective-checks-plaids', 'Project Kattam', 'Checks & plaids', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['vriksha', 'vriksha-handcrafted-fusion-sarees', 'Vriksha', 'Handcrafted fusion sarees', null, null, 'Saree'],
    ['ponduru', 'ponduru-khadi-jamdani', 'Ponduru Khadi Jamdani', 'Handspun khadi', 'Jamdani', 'Khadi', 'Saree'],
    ['odisha', 'orissa-ikats', 'Odisha Ikats', 'Tie-dye ikat from Odisha', 'Odisha Ikat', null, 'Saree'],
    ['kanchicotton', 'handwoven-kanchi-cotton', 'Kanchi Cotton', 'Handwoven', 'Kanchi Cotton', 'Cotton', 'Saree'],
    ['kotpad', 'kotpad-tribal-weave-from-odisha', 'Kotpad', 'Tribal weave from Odisha', 'Kotpad', null, 'Saree'],
    ['bhujodi', 'bhujodi-from-kutch', 'Bhujodi', 'From Kutch', 'Bhujodi', null, 'Saree'],
    ['moirang', 'moirang-phee', 'Moirang Phee', 'From Manipur', 'Moirang Phee', null, 'Saree'],
    ['kodali', 'kodalikarrupur', 'Kodalikaruppur', 'Block-printed, Tamil Nadu', 'Kodalikaruppur', null, 'Saree'],
    ['pracheen', 'pracheen-ajrakhs', 'Pracheen Ajrakhs', 'Natural-dye block prints', 'Ajrakh', null, 'Saree'],
    ['mithila', 'mithila-blockprinted-tussars', 'Mithila', 'Block-printed tussars', 'Tussar', 'Tussar', 'Saree'],
    ['gadwal', 'gadwal-silks', 'Gadwal Silks', 'Kuttu Gadwal', 'Gadwal', 'Silk', 'Saree'],
    ['patola', 'patola-ikats', 'Patola Ikats', 'Single & double ikat', 'Patola', null, 'Saree'],
    ['pochampally', 'pochampally-ikats', 'Pochampally Ikats', 'Tie-and-dye ikat', 'Pochampally Ikat', null, 'Saree'],
    ['ikat', 'ikat-silks', 'Ikat Silks', 'Tie-and-dye silks', 'Ikat', 'Silk', 'Saree'],
    ['baluchari', 'baluchari-from-bengal', 'Baluchari', 'From Bengal', 'Baluchari', 'Silk', 'Saree'],
    ['jamdani', 'jamdani', 'Jamdani', 'Supplementary-weft weaving', 'Jamdani', null, 'Saree'],
    ['sungudi', 'madurai-sungudi-handknotted', 'Madurai Sungudi', 'Hand-knotted', 'Madurai Sungudi', 'Cotton', 'Saree'],
    ['silkcotton', 'silk-cottons', 'Silk Cottons', 'Silk and cotton', 'Silk Cotton', 'Silk Cotton', 'Saree'],
    ['blouses', 'readymade-blouses', 'Readymade Blouses', 'Handcrafted, ready to wear', null, null, 'Blouse'],
    ['varnika', 'varnika-silver-toned-handcrafted-jewelry', 'Varnika', 'Silver-toned handcrafted jewellery', null, null, 'Jewellery'],
    ['terracotta', 'terracotta-jewelry-artisan-made', 'Terracotta Jewellery', 'Artisan made', null, null, 'Jewellery'],
    ['potlis', 'clutches-potlis', 'Clutches & Potlis', 'From handmade textiles', null, null, 'Accessory'],
    ['pavadai', 'girls-pavadai-sattai-skirt-and-blouse', 'Pavadai Sattai', 'Girls: skirt and blouse', null, null, 'Kids'],
    ['kids', 'kids-ready-to-wear', 'Kids Ready to Wear', 'For young boys and girls', null, null, 'Kids'],
    ['accessories', 'accessories', 'Accessories', 'Handmade from handwoven textiles', null, null, 'Accessory'],
    ['kanjivaram', 'kanjivaram-silks', 'Kanjivaram Silks', 'Pure silk', 'Kanjivaram', 'Pure Silk', 'Saree'],
    ['other', '', 'Krsaangi', '', null, null, null],
  ];
  // collections Shopify adds later are appended automatically (see build()); these are never products' "home" collection
  const SKIP_HANDLES = new Set(['all', 'frontpage', 'new-arrivals', 'new-arrivals-in-stock', 'featured-kanjivarams']);

  /* ── colour lexicon: traditional term → display name, family, indicative swatch (UI only) ── */
  const C = [
    ['vintage arakku pink', 'Arakku Pink', 'Pink', '#8E2F4A'], ['arakku', 'Arakku', 'Red', '#6D1F2A'],
    ['reddish maroon', 'Maroon', 'Red', '#5E1B24'], ['maroon', 'Maroon', 'Red', '#5E1B24'],
    ['chilli red', 'Chilli Red', 'Red', '#B3261E'], ['ruby red', 'Ruby Red', 'Red', '#9B1B30'],
    ['ruby', 'Ruby', 'Red', '#9B1B30'], ['tomato red', 'Tomato Red', 'Red', '#C63B2B'],
    ['brick red', 'Brick Red', 'Red', '#9A3B2A'], ['kumkum', 'Kumkum', 'Red', '#B0212B'],
    ['crimson', 'Crimson', 'Red', '#A11C2E'], ['traditional red', 'Red', 'Red', '#A3222B'], ['red', 'Red', 'Red', '#A3222B'],
    ['onion pink', 'Onion Pink', 'Pink', '#C98A93'], ['geva pink', 'Geva Pink', 'Pink', '#C2456B'],
    ['rani pink', 'Rani Pink', 'Pink', '#C2185B'], ['baby pink', 'Baby Pink', 'Pink', '#EBC1C8'],
    ['rose pink', 'Rose Pink', 'Pink', '#D98A9B'], ['lotus pink', 'Lotus Pink', 'Pink', '#DE8FA6'],
    ['magenta', 'Magenta', 'Pink', '#A3195B'], ['peach', 'Peach', 'Pink', '#EBB79A'], ['rose', 'Rose', 'Pink', '#C76C7E'],
    ['pink', 'Pink', 'Pink', '#CF6F8A'],
    ['vadamalli', 'Vadamalli', 'Purple', '#7A2A6B'], ['brinjal', 'Brinjal', 'Purple', '#44203F'],
    ['aubergine', 'Aubergine', 'Purple', '#3F1D3A'], ['lavender', 'Lavender', 'Purple', '#A99BC9'],
    ['violet', 'Violet', 'Purple', '#5B3A8C'], ['purple', 'Purple', 'Purple', '#5E2D79'], ['wine', 'Wine', 'Purple', '#5A1F3A'],
    ['december poo', 'December Poo', 'Purple', '#8E7CC3'],
    ['ramar blue', 'Ramar Blue', 'Blue', '#1E7FA0'], ['rama blue', 'Ramar Blue', 'Blue', '#1E7FA0'],
    ['ms blue', 'MS Blue', 'Blue', '#2E5AAC'], ['ananda blue', 'Ananda Blue', 'Blue', '#1F6FB2'],
    ['navy blue', 'Navy Blue', 'Blue', '#1B2A4A'], ['navy', 'Navy', 'Blue', '#1B2A4A'],
    ['peacock blue', 'Peacock Blue', 'Blue', '#0F6A7C'], ['teal blue', 'Teal Blue', 'Blue', '#1B6E78'],
    ['teal', 'Teal', 'Blue', '#1B6E78'], ['ink blue', 'Ink Blue', 'Blue', '#1F2B5C'], ['indigo', 'Indigo', 'Blue', '#27336B'],
    ['dark blue', 'Dark Blue', 'Blue', '#1D2F5E'], ['deep blue', 'Deep Blue', 'Blue', '#1D2F5E'],
    ['sky blue', 'Sky Blue', 'Blue', '#8DB9DC'], ['blue', 'Blue', 'Blue', '#2B5C9B'],
    ['manthulir', 'Manthulir', 'Green', '#8A7A3A'], ['parrot green', 'Parrot Green', 'Green', '#5DA130'],
    ['alli green', 'Alli Green', 'Green', '#3F7F5A'], ['pista green', 'Pista Green', 'Green', '#B5CF9A'],
    ['pista', 'Pista', 'Green', '#B5CF9A'], ['bottle green', 'Bottle Green', 'Green', '#134D36'],
    ['rama green', 'Rama Green', 'Green', '#147A6B'], ['sage green', 'Sage Green', 'Green', '#9BAA8A'],
    ['olive green', 'Olive Green', 'Green', '#6B6B2E'], ['olive', 'Olive', 'Green', '#6B6B2E'],
    ['mehendi', 'Mehendi', 'Green', '#77782C'], ['elaichi', 'Elaichi', 'Green', '#BFCB98'],
    ['emerald', 'Emerald', 'Green', '#11684A'], ['green', 'Green', 'Green', '#2F6B46'],
    ['pasumanjal', 'Pasumanjal', 'Yellow & Gold', '#D9A21B'], ['turmeric yellow', 'Turmeric', 'Yellow & Gold', '#D9A21B'],
    ['turmeric', 'Turmeric', 'Yellow & Gold', '#D9A21B'], ['sampanga', 'Sampanga', 'Yellow & Gold', '#E0C25A'],
    ['mustard', 'Mustard', 'Yellow & Gold', '#C4931F'], ['mango yellow', 'Mango Yellow', 'Yellow & Gold', '#E7B02F'],
    ['lemon yellow', 'Lemon Yellow', 'Yellow & Gold', '#E8D455'], ['yellow', 'Yellow', 'Yellow & Gold', '#E0B530'],
    ['golden ivory', 'Golden Ivory', 'Ivory & Neutrals', '#E6D7AE'], ['gold', 'Gold', 'Yellow & Gold', '#B8923A'],
    ['kanakambaram', 'Kanakambaram', 'Orange', '#E2703A'], ['rust', 'Rust', 'Orange', '#A4522B'],
    ['honey', 'Honey', 'Orange', '#C98A2B'], ['orange', 'Orange', 'Orange', '#D9691E'],
    ['off white', 'Off White', 'Ivory & Neutrals', '#EFE9DA'], ['half white', 'Half White', 'Ivory & Neutrals', '#EFE9DA'],
    ['ivory', 'Ivory', 'Ivory & Neutrals', '#EFE6D0'], ['cream', 'Cream', 'Ivory & Neutrals', '#EFE3C4'],
    ['beige', 'Beige', 'Ivory & Neutrals', '#D9C7A6'], ['cement grey', 'Cement Grey', 'Ivory & Neutrals', '#8E8F8C'],
    ['grey', 'Grey', 'Ivory & Neutrals', '#8B8B88'], ['gray', 'Grey', 'Ivory & Neutrals', '#8B8B88'],
    ['white', 'White', 'Ivory & Neutrals', '#F4F1E8'],
    ['paaku brown', 'Paaku Brown', 'Earth & Brown', '#6A4630'], ['paaku', 'Paaku', 'Earth & Brown', '#6A4630'],
    ['coffee brown', 'Coffee Brown', 'Earth & Brown', '#4E3526'], ['brown', 'Brown', 'Earth & Brown', '#6B4A32'],
    ['black', 'Black', 'Black', '#1C1B1A'],
    ['rust orange', 'Rust Orange', 'Orange', '#B5562A'], ['royal blue', 'Royal Blue', 'Blue', '#23408E'],
    ['pale green', 'Pale Green', 'Green', '#B9CBA3'], ['algae green', 'Algae Green', 'Green', '#5E7F4B'],
    ['sapotta brown', 'Sapotta Brown', 'Earth & Brown', '#7A5A40'], ['dusty lavender', 'Dusty Lavender', 'Purple', '#A79CBF'],
    ['baby rose pink', 'Baby Rose Pink', 'Pink', '#E9BDC6'], ['deep brinjal', 'Brinjal', 'Purple', '#44203F'],
    ['paalum pazhamum', 'Paalum Pazhamum', 'Multicolor', 'multi'], ['multicolor', 'Multicolor', 'Multicolor', 'multi'],
    ['multi color', 'Multicolor', 'Multicolor', 'multi'],
  ];
  // Python sorts by -len with a stable sort; Array.prototype.sort is stable too
  C.sort((a, b) => b[0].length - a[0].length);
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const COLOR_SRC = '(?<![a-z])(' + C.map(t => reEsc(t[0])).join('|') + ')(?![a-z])';
  const CMAP = Object.fromEntries(C.map(t => [t[0], t]));
  const NOT_COLOR = /(peacock|mayil)\s+(butta|motif)|silver[- ]ton|gold[- ]ton|golden zari|mango (butta|motif)/i;

  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', times: '×' };
  const unescape = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e.toLowerCase()] ?? m));
  function clean(body) {
    let t = (body || '').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n');
    t = unescape(t.replace(/<[^>]+>/g, ' ')).replace(/ /g, ' ');
    t = t.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim();
    return t.replace(/ +([.,!])/g, '$1');
  }
  function findColors(text) {
    const out = [], re = new RegExp(COLOR_SRC, 'gi'); let m;
    while ((m = re.exec(text))) {
      const ctx = text.slice(Math.max(0, m.index - 2), m.index + m[0].length + 14);
      if (NOT_COLOR.test(ctx)) continue;
      out.push([m.index, CMAP[m[1].toLowerCase()]]);
    }
    return out;
  }
  const SMALL = new Set(['and', 'with', 'of', 'in', 'the', 'from', 'to', 'a']);
  const isUpper = w => /[A-Za-z]/.test(w) && w === w.toUpperCase();
  function tcase(s) {
    return s.trim().split(/(\s+|-)/).map((w, i) => {
      const lw = w.toLowerCase();
      if (!w.trim() || w === '-') return w;
      if (i && SMALL.has(lw)) return lw;
      if (isUpper(w) && w.length <= 2) return w;
      return w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase();
    }).join('');
  }
  const stripChars = (s, chars) => { let a = 0, b = s.length; while (a < b && chars.includes(s[a])) a++; while (b > a && chars.includes(s[b - 1])) b--; return s.slice(a, b); };
  const PREFIX = /^\s*(pazhamai project|project kattam collective|project kattam|mythili|maathey|snigdha|swara|vriksha|mithila|pracheen|krsaangi varnika|varnika|silver toned jewel(?:le)?ry|terracotta jewel(?:le)?ry)\s*[:\-–]*\s*/i;
  function designName(title) {
    let t = title.replace(/\s+/g, ' ').trim();
    t = t.replace(PREFIX, '');
    t = t.replace(/handcrafted ready to wear blouse/gi, 'Blouse');
    t = t.replace(/\(\s*saree\s*(#\s*\d+)\s*\)/gi, '$1');
    t = t.replace(/\(([^)]*)\)/g, '');
    t = stripChars(t.replace(/\s*[:\-–]\s*/g, ' — '), ' —');
    t = t.replace(/#\s*(\d+)/g, 'No. $1');
    t = t.replace(/\bSaree\b/gi, '');
    t = stripChars(t.replace(/\s+/g, ' '), ' —:+');
    let parts = t.split('—').map(p => p.trim()).filter(Boolean);
    if (parts.length > 1 && new RegExp(COLOR_SRC, 'i').test(parts[parts.length - 1]) && stripChars(parts[parts.length - 1].replace(new RegExp(COLOR_SRC, 'gi'), ''), ' +&x×,and').length < 3) parts = parts.slice(0, -1);
    return tcase(parts.join(' — ')) || tcase(title);
  }
  const lexEntry = t => ({ name: t[1], family: t[2], hex: t[3] });
  function derive(p, coll) {
    let [key, , , , weave, fabric, ptype] = coll;
    const text = clean(p.body), low = (p.title + '. ' + text).toLowerCase(), d = {};
    if (ptype === 'Saree' && (key === 'sungudi' || key === 'jamdani')) {
      const tl = p.title.toLowerCase();
      if (tl.includes('moirang')) { weave = 'Moirang Phee'; fabric = null; d._coll = 'moirang'; }
      else if (tl.includes('ajrakh')) { weave = 'Ajrakh'; fabric = null; d._coll = 'pracheen'; }
      else if (tl.includes('sungudi')) { weave = 'Madurai Sungudi'; fabric = 'Cotton'; }
      else if (tl.includes('jamdani')) { weave = 'Jamdani'; fabric = null; }
    }
    const titleCols = findColors(p.title), bodyCols = findColors(text);
    let primary = (titleCols.length ? titleCols : bodyCols.length ? bodyCols : [null])[0], secondary = null;
    const bpos = text.toLowerCase().indexOf('border');
    if (bpos >= 0) { const after = bodyCols.filter(c => c[0] > bpos); if (after.length) secondary = after[0]; }
    if (bodyCols.length && !titleCols.length) primary = bodyCols[0];
    if (!secondary && titleCols.length > 1) secondary = titleCols[1];
    if (primary && secondary && primary[1][1] === secondary[1][1]) secondary = null;
    d.color = primary ? lexEntry(primary[1]) : null;
    d.color2 = secondary ? lexEntry(secondary[1]) : null;
    if (ptype === 'Saree') {
      let w = weave;
      if (!w) for (const [name, rx] of [['Kanjivaram', /kanjivaram|kanchi silk/], ['Gadwal', /gadwal/], ['Jamdani', /jamdani/], ['Patola', /patola/], ['Baluchari', /baluchari/], ['Madurai Sungudi', /sungudi/], ['Ikat', /ikat/], ['Tussar', /tussar/]]) if (rx.test(low)) { w = name; break; }
      d.weave = w;
      let f = null;
      if (/silk cotton/.test(low)) f = 'Silk Cotton'; else if (/khadi|khadhi/.test(low)) f = 'Khadi'; else if (/tussar/.test(low)) f = 'Tussar'; else if (/pure silk/.test(low)) f = 'Pure Silk'; else if (/pure cotton|soft cotton|cotton/.test(low)) f = 'Cotton';
      d.fabric = f || fabric;
      d.zari = key === 'snigdha' || /no zari|without zari/.test(low) ? 'No Zari' : (low.includes('zari') || low.includes('zati')) ? 'Zari' : null;
      const zm = low.match(/(\d)\s*gm zari purity/);
      d.zariNote = zm ? `${zm[1]}gm zari purity (as stated by Krsaangi)` : null;
      const b = [];
      if (low.includes('korvai') || low.includes('interlocked')) b.push('Korvai');
      if (low.includes('rettapettu') || low.includes('retta pettu')) b.push('Rettapettu');
      if (/small (korvai )?border/.test(low)) b.push('Small Border');
      if (/semi[- ]contrast/.test(low)) b.push('Semi-contrast'); else if (/contrast/.test(low)) b.push('Contrast');
      if (/self border/.test(low)) b.push('Self');
      if (/temple (woven )?(zari )?border/.test(low)) b.push('Temple');
      d.border = b;
      const mo = [];
      if (/kattam|checks|plaid/.test(low)) mo.push('Checks');
      if (/stripes|vairaoosi|vaira oosi|oosi/.test(low)) mo.push('Stripes');
      if (/butta/.test(low)) mo.push('Butta');
      if (/mayil|peacock (butta|motif)/.test(low)) mo.push('Peacock');
      if (/pakshi|\bkili\b|annam|bird/.test(low)) mo.push('Bird');
      if (/paisley|manga/.test(low)) mo.push('Paisley');
      if (/floral|flower|malli/.test(low)) mo.push('Floral');
      if (/\bjaal\b/.test(low)) mo.push('Jaal');
      if (low.includes('sungudi')) mo.push('Hand-knotted dots');
      d.motif = mo;
      d.technique = /\badai\b/.test(low) ? 'Adai weaving' : (low.includes('sungudi') ? 'Hand-knotted resist dye' : null);
      d.blouse = null;
      const bm = text.match(/blouse is ([^.]+)\./i);
      if (bm) { const s = bm[1].trim(); d.blouse = tcase(s).slice(0, 1).toUpperCase() + s.slice(1); }
      else if (/plain blouse/.test(low)) d.blouse = 'Plain blouse piece';
    }
    return [text, d];
  }
  const sizeKey = label => { const m = label.match(/^\s*(\d{2})\s*(\(.*\))?\s*$/); return m ? m[1] : label.trim(); };
  function fits(label) {
    const m = label.match(/^\s*(\d{2})\s*[-–]\s*(\d{2})\s*$/);
    if (m) { const out = []; for (let n = +m[1]; n <= +m[2]; n += 2) out.push(String(n)); return out; }
    const k = sizeKey(label); return /^\d{2}$/.test(k) ? [k] : [];
  }
  const TYPEMAP = { Saree: 'Saree', Blouse: 'Blouse', Accessories: 'Accessory' };
  const LABELS = /^(pallu|border|body|weave close-up|blouse piece|zari|motif|texture|drape)$/i;
  const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());
  const iso = sec => new Date(sec * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const video = m => {
    const srcs = (m.sources || []).filter(s => s.url && (s.format === 'mp4' || /\.mp4/.test(s.url))).sort((a, b) => a.height - b.height);
    if (!srcs.length) return null;
    const sd = srcs.find(s => s.height >= 480) || srcs[srcs.length - 1], hd = srcs.find(s => s.height >= 720) || srcs[srcs.length - 1];
    return { t: 'v', src: sd.url, hd: hd.url, full: srcs[srcs.length - 1].url, poster: m.poster, ar: m.ar || null, dur: m.dur || null };
  };
  // a metafield colour ("Arakku") is matched to the lexicon for its family and swatch
  const mfColour = (name, family) => {
    if (!name) return null;
    const t = C.find(x => x[1].toLowerCase() === String(name).toLowerCase()) || C.find(x => x[0] === String(name).toLowerCase());
    return t ? lexEntry(t) : { name: String(name), family: family || null, hex: '#8B8B88' };
  };
  const list = v => Array.isArray(v) ? v.filter(Boolean) : v ? String(v).split(/\s*,\s*/).filter(Boolean) : null;

  /* raw = { products: [...], collections: [...] } exactly as collection.kr-catalog.liquid writes them */
  function build(raw) {
    const liveColls = raw.collections || [];
    const known = new Set(COLLECTIONS.map(c => c[1]));
    // collections created in Shopify after this file was written join automatically
    const extra = liveColls.filter(c => c.handle && !known.has(c.handle) && !SKIP_HANDLES.has(c.handle))
      .map(c => [c.handle.replace(/[^a-z0-9]+/g, ''), c.handle, c.title, '', null, null, null]);
    const TABLE = [...COLLECTIONS.slice(0, -1), ...extra, COLLECTIONS[COLLECTIONS.length - 1]];
    const BYKEY = Object.fromEntries(TABLE.map(c => [c[0], c]));
    const products = [];
    for (const p of raw.products || []) {
      const mf = p.mf || {};
      let images = (p.images || []).map(i => ({ src: i.src, w: i.w, h: i.h, alt: i.alt }));
      const media = [];
      for (const m of p.media || []) {
        if (m.t === 'i') media.push({ src: m.src, w: m.w, h: m.h, alt: m.alt });
        else if (m.t === 'video') { const v = video(m); if (v) media.push(v); }
      }
      if (!images.length) {   // a product whose only media is video: its poster frames stand in as stills
        const posters = (p.media || []).filter(m => m.t === 'video' && m.poster).map(m => ({ src: m.poster, w: 9, h: 16 }));
        if (!posters.length) continue;
        images = posters;
      }
      const handles = new Set(p.collections || []);
      let coll = TABLE.find(c => c[1] && handles.has(c[1])) || BYKEY.other;
      const ptype = TYPEMAP[p.type] || coll[6] || (/jewel|jhumk|necklace|earring/i.test(p.title) ? 'Jewellery' : 'Accessory');
      coll = [...coll.slice(0, 6), ptype];
      const [text, d] = derive(p, coll);
      const v = p.variants || [];
      const prices = v.map(x => x.price / 100);
      const opt = (p.options && p.options[0]) || 'Title';
      const sized = /^size/i.test(opt);
      const fixed = opt.match(/^size\s+(\d{2})$/i);
      const variants = sized ? v.map(x => ({ id: x.id, title: fixed ? fixed[1] : x.title.trim().replace(/\s*[-–]\s*/g, '–'), available: x.available, price: x.price / 100 })) : [];
      const stills = media.filter(m => m.t !== 'v');
      const pics = (stills.length ? stills : images).slice(0, 10).map(i => (i.alt && LABELS.test(i.alt.trim()) ? { ...i, label: titleCase(i.alt.trim().toLowerCase()) } : i)).map(({ alt, ...i }) => i);
      // metafields win over derived values, field by field
      if (mf.weave) d.weave = mf.weave;
      if (mf.fabric) d.fabric = mf.fabric;
      if (mf.zari) d.zari = mf.zari;
      if (mf.border) d.border = list(mf.border);
      if (mf.motif) d.motif = list(mf.motif);
      if (mf.technique) d.technique = mf.technique;
      if (mf.blouse) d.blouse = mf.blouse;
      if (mf.color) d.color = mfColour(mf.color, mf.color_family);
      if (mf.color2) d.color2 = mfColour(mf.color2, mf.color2_family);
      const colorLine = [d.color, d.color2].filter(Boolean).map(c => c.name).join(' × ');
      const rec = {
        id: p.id, handle: p.handle, sourceTitle: p.title.replace(/\s+/g, ' ').trim(),
        name: mf.display_name || designName(p.title), colorLine,
        collection: coll[0], type: ptype,
        colls: TABLE.filter(c => c[1] && handles.has(c[1])).map(c => c[0]),
        price: prices.length ? Math.min(...prices) : 0, priceMax: prices.length ? Math.max(...prices) : 0,
        compareAt: p.compare_at && p.compare_at / 100 > Math.min(...prices) ? p.compare_at / 100 : null,
        available: v.some(x => x.available),
        vid: v[0] && v[0].id,
        variants, optionName: sized ? 'Size' : null,
        sizes: [...new Set(variants.filter(x => x.available).flatMap(x => fits(x.title)))].sort(),
        published: iso(p.published),
        images: pics, media: media.some(m => m.t === 'v') ? media.slice(0, 12).map(({ alt, ...m }) => m) : null,
        story: text,
      };
      if (!rec.colls.length) rec.colls = [rec.collection];
      delete d._coll;
      Object.assign(rec, d);
      /* Pre-order (Krsaangi's rules): only a Kanjivaram saree that the team has switched on (krsaangi.preorder)
         and that is out of stock. Such a saree has "Continue selling when out of stock" on in Shopify, so
         Shopify calls it available; it shows "Preorder Now" instead. The 30% advance is Shopify's own
         pre-order purchase option (selling plan); `plan` is its id and the amounts Shopify will charge. */
      const tracked = v.length && v.every(x => x.qty !== null && x.qty !== undefined);
      const noStock = tracked ? v.every(x => x.qty <= 0) : !rec.available;
      const kanji = rec.type === 'Saree' && (rec.weave === 'Kanjivaram' || rec.colls.includes('kanjivaram'));
      if (mf.preorder === true && kanji && noStock) {
        const x = v.find(y => y.available) || v[0], a = (x?.plans || [])[0], plan = a && (p.plans || []).find(sp => sp.id === a.id);
        const pct = plan?.charge?.type === 'percentage' ? plan.charge.value : null;
        rec.available = false;
        rec.preorder = { open: !!(x?.available && a), vid: x?.id, plan: a ? a.id : null, planName: plan?.name || null, pct,
          deposit: a ? a.deposit / 100 : null, balance: a ? a.balance / 100 : null };
      } else if (rec.type === 'Saree' && tracked && noStock && rec.available) {
        rec.available = false;   // a saree out of stock that is not on pre-order stays Sold out, whatever its stock policy
        rec.variants.forEach(x => { x.available = false; }); rec.sizes = [];
      }
      products.push(rec);
    }
    products.sort((a, b) => (b.published > a.published ? 1 : b.published < a.published ? -1 : 0));
    const live = Object.fromEntries(liveColls.map(c => [c.handle, c]));
    const have = new Set(products.map(p => p.collection));
    const collections = {};
    for (const [key, handle, name, sub, weave, , type] of TABLE) {
      if (key === 'other' && !have.has('other')) continue;
      const rc = live[handle] || {};
      collections[key] = { key, handle, name, subtitle: sub, weave, type, about: clean(rc.description || ''), image: rc.image || null, liveCount: rc.count ?? null };
    }
    const lexicon = C.map(t => ({ term: t[0], name: t[1], family: t[2], hex: t[3] }));
    return { products, collections, lexicon, snapshot: new Date().toISOString() };
  }

  /* ── loading, caching, then the site scripts ── */
  const CACHE = 'kr_catalog', FRESH = 15 * 60e3, STALE = 24 * 60 * 60e3;
  const readCache = () => { try { const c = JSON.parse(localStorage.getItem(CACHE)); return c && c.v === T.version ? c : null; } catch { return null; } };
  const writeCache = data => { try { localStorage.setItem(CACHE, JSON.stringify({ v: T.version, at: Date.now(), data })); } catch { /* storage full or blocked: works without it */ } };
  async function fetchRaw() {
    const get = n => fetch(`${T.catalogUrl}${T.catalogUrl.includes('?') ? '&' : '?'}page=${n}`, { credentials: 'same-origin', headers: { accept: 'application/json' } }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const first = await get(1);
    const rest = await Promise.all(Array.from({ length: Math.max(0, (first.pages || 1) - 1) }, (_, i) => get(i + 2)));
    return { collections: first.collections || [], products: [first, ...rest].flatMap(x => x.products || []) };
  }
  const refresh = () => fetchRaw().then(raw => { const data = build(raw); writeCache(data); return data; });
  function loadScripts(urls) {
    return urls.reduce((chain, src) => chain.then(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script ' + src)); document.head.append(s); })), Promise.resolve());
  }
  function fail(err) {
    console.error('[krsaangi] catalogue could not load', err);
    document.documentElement.classList.add('kr-offline');
    const n = document.getElementById('kr-boot-note'); if (n) n.hidden = false;
  }
  window.KR_BUILD = build;   // exposed for tools and tests
  if (T.noBoot) return;
  const cached = readCache();
  const age = cached ? Date.now() - cached.at : Infinity;
  const ready = cached && age < STALE ? Promise.resolve(cached.data) : refresh();
  if (cached && age >= FRESH && age < STALE) refresh().catch(() => { /* keep the cached copy */ });
  ready.then(data => {
    window.KR_DATA = data;
    // the page script needs the DOM; the app script builds header and footer into it
    const go = () => loadScripts(T.scripts || []).catch(fail);
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go, { once: true }) : go();
  }).catch(fail);
})();
