/* Homepage. Every block reads from the catalog; copy in quotes is Krsaangi's own.
   Film is Krsaangi's own footage from the Shopify CDN (REELS / FILM_SLOTS in app.js).
   One film plays at a time; under reduced motion or Save-Data the poster stands in. */
(() => {
  const { P, COL, LEX, $, $$, esc, img, srcset, I, status, card, cLink, bindRail, railNav, reveal, track, reduced, JOURNAL, REELS, FILM_SLOTS, SETTINGS, byHandle, R, NAV, OCCASIONS, occLink, firstImg, WEAVE_NAV, matches } = window.KR;
  const inStock = p => status(p) === 'in';
  const arrow = I.arrow;
  const saveData = navigator.connection?.saveData;
  const canAuto = !reduced && !saveData;

  /* ── film helpers ─────────────────────────────────────────────────────── */
  const allVideos = () => $$('video[data-film]');
  const playOnly = v => { allVideos().forEach(o => { if (o !== v && !o.paused) o.pause(); }); if (!v.getAttribute('src')) v.src = v.dataset.src; return v.play().catch(() => {}); };
  const reelHTML = (r, label, cap = 'Krsaangi', style = '') => `<button class="reel" data-reel aria-pressed="false" style="${style}">
      <img src="${r.poster}" alt="" loading="lazy" decoding="async">
      <video data-film data-src="${r.src}" muted loop playsinline preload="none"></video>
      <span class="reel__cap"><span data-state>${I.play} Play film</span><span style="color:#DAD3C5">${cap}</span><span class="sr">: ${label}</span></span></button>`;
  const paintReel = b => { const on = !$('video', b).paused; b.classList.toggle('is-playing', on); b.setAttribute('aria-pressed', on); $('[data-state]', b).innerHTML = on ? `${I.pause} Pause film` : `${I.play} Play film`; };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-reel]'); if (!b) return;
    const v = $('video', b);
    if (v.paused) { delete v.dataset.userPaused; playOnly(v); track('video_play', { where: b.closest('section')?.id || 'hero' }); } else { v.pause(); v.dataset.userPaused = '1'; }
  });
  document.addEventListener('play', e => { const b = e.target.closest?.('[data-reel]'); if (b) paintReel(b); }, true);
  document.addEventListener('pause', e => { const b = e.target.closest?.('[data-reel]'); if (b) paintReel(b); }, true);
  // a labelled Play/Pause button for a film that is not inside a reel tile
  const bindToggle = (v, btn, onState) => {
    const paint = () => { const on = !v.paused; btn.innerHTML = on ? `${I.pause}<span>Pause video</span>` : `${I.play}<span>Play video</span>`; btn.setAttribute('aria-pressed', on); onState?.(on); };
    btn.addEventListener('click', () => { if (v.paused) { delete v.dataset.userPaused; playOnly(v); } else { v.pause(); v.dataset.userPaused = '1'; } });
    v.addEventListener('play', paint); v.addEventListener('pause', paint); paint();
  };
  // plays a film while its section is on screen and nothing else is playing; rests it when it leaves
  const autoInView = (v, el, threshold) => new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return v.pause();
    if (canAuto && !v.dataset.userPaused && allVideos().every(o => o === v || o.paused)) playOnly(v);
  }, { threshold }).observe(el);

  /* ── hero: three films; the centre one plays, the sides play on tap ───── */
  /* Which films play where. With the Instagram feed connected these are Krsaangi's newest reels: the newest in
     the centre of the hero, then the hero sides, then the On film band. Without it (or with fewer than six
     playable reels) the curated films in REELS fill the rest. */
  const curated = [FILM_SLOTS.hero, ...FILM_SLOTS.heroSides, ...FILM_SLOTS.band].map(i => REELS[i]);
  const slotsFrom = live => { const f = [...live.slice(0, 6), ...curated].slice(0, 6); return { hero: f[0], sides: [f[1], f[2]], band: [f[3], f[4], f[5]] }; };
  const hv = $('#heroFilm');
  let filmKey = '';
  function placeFilms(live) {
    const s = slotsFrom(live || []), key = [s.hero, ...s.sides, ...s.band].map(f => f.src).join('|');
    if (key === filmKey) return; const first = !filmKey; filmKey = key;
    const cap = f => f.live ? '@krsaangi' : 'Krsaangi';
    // hero: swap the film in place; if the old one was already playing, the new one carries on playing
    if (hv.dataset.src !== s.hero.src) {
      const wasPlaying = !hv.paused; hv.poster = s.hero.poster; hv.dataset.src = s.hero.src;
      if (hv.getAttribute('src')) { hv.src = s.hero.src; if (wasPlaying) hv.play().catch(() => {}); }
    }
    $('#heroA').innerHTML = reelHTML(s.sides[0], 'a Krsaangi saree draped and shown', cap(s.sides[0]), 'aspect-ratio:auto');
    $('#heroB').innerHTML = reelHTML(s.sides[1], 'a Krsaangi saree draped and shown', cap(s.sides[1]), 'aspect-ratio:auto');
    $$('#heroA img, #heroB img').forEach(i => i.removeAttribute('loading'));   // above the fold: no lazy loading
    const band = $('#motionReels'); if (band) band.innerHTML = s.band.map(f => reelHTML(f, 'a Krsaangi saree draped and shown', cap(f))).join('');
    if (!first) track('films_live', { reels: (live || []).length });
  }
  placeFilms(window.KR.latestReelsNow());              // this device's last copy of the newest reels, if any
  window.KR.latestReels().then(placeFilms);           // then the feed itself (nothing changes if nothing is new)
  bindToggle(hv, $('#heroToggle'));
  // the poster is the first paint; the film itself is fetched only after the page has loaded
  const startHero = () => { if (canAuto && !hv.dataset.userPaused) playOnly(hv); };
  if (document.readyState === 'complete') startHero(); else addEventListener('load', startHero, { once: true });
  autoInView(hv, hv, .2);

  /* ── Just In: the newest pieces by publish time (the catalog is stored newest first) ── */
  const rail = (id, navId, list, label) => { $(id).dataset.list = id.slice(1); $(id).innerHTML = list.map(p => card(p, { sizes: '(max-width:640px) 68vw, 24vw' })).join(''); $(navId).innerHTML = railNav(label); bindRail($(id), $(navId + ' .rail-nav')); };
  rail('#newRail', '#newNav', [...P].sort((a, b) => (b.published > a.published ? 1 : b.published < a.published ? -1 : 0)).slice(0, 12), 'Just in');

  /* ── every part of the store on the page, not only in the menus ────────── */
  const tile = (href, src, title, sub, w = 600) => `<a class="tile" href="${href}" data-reveal><figure>${src ? `<img src="${img(src, w)}" srcset="${srcset(src, [320, 480, 640, 900])}" sizes="(max-width:640px) 50vw, 25vw" alt="" loading="lazy" decoding="async">` : ''}</figure><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</a>`;
  const usedPics = new Set();   // no photo twice across the tiles
  const pic = list => { const p = list.find(x => status(x) === 'in' && !usedPics.has(x.images[0]?.src)) || list.find(x => !usedPics.has(x.images[0]?.src)) || list[0]; const src = p?.images[0]?.src; if (src) usedPics.add(src); return src; };
  const ofType = t => P.filter(p => p.type === t);
  const stockList = P.filter(p => status(p) === 'in');
  const preorders = P.filter(p => status(p) === 'pre');
  const SHOP = [
    [R.shop + '?sort=new', pic([...P].sort((a, b) => (b.published > a.published ? 1 : -1))), 'New Arrivals', 'The latest from the loom'],
    [R.shop + '?avail=in', pic(stockList.filter(p => p.type === 'Saree')), 'In Stock', `${stockList.length} pieces ready to ship`],
    [R.shop + '?type=Saree', pic(ofType('Saree').slice(8)), 'Sarees', 'Kanjivarams and regional handlooms'],
    [cLink('blouses'), pic(ofType('Blouse')), 'Blouses', 'Readymade and blouse pieces'],
    [R.shop + '?type=Jewellery', pic(ofType('Jewellery')), 'Jewellery', 'Varnika and terracotta'],
    [R.shop + '?type=Accessory', pic(ofType('Accessory')), 'Accessories', 'Clutches and potlis'],
    [R.shop + '?type=Kids', pic(ofType('Kids')), 'Kids', 'Ready to wear'],
    preorders.length ? [R.shop + '?avail=pre', pic(preorders), 'Preorder', 'Selected Kanjivarams, woven for you'] : [R.shop + '?wishlist=1', pic(ofType('Saree').slice(30)), 'Saved items', 'Your wishlist'],
  ].filter(x => x[1]);
  $('#exploreGrid').innerHTML = SHOP.map(([h, s, t, sub]) => tile(h, s, t, sub)).join('');
  $('#collGrid').innerHTML = NAV[0][1].map(k => tile(cLink(k), pic(P.filter(p => p.colls.includes(k))) || firstImg(k), COL[k].name, COL[k].subtitle)).join('');
  $('#moreGrid').innerHTML = NAV[2][1].map(k => tile(cLink(k), pic(P.filter(p => p.colls.includes(k))) || firstImg(k), COL[k].name, COL[k].subtitle, 400)).join('');
  rail('#stockRail', '#stockNav', [...stockList].sort((a, b) => (b.published > a.published ? 1 : -1)).slice(0, 12), 'In stock');
  $('#occGrid').innerHTML = OCCASIONS.map(o => {
    const f = o.filter, list = P.filter(p => (!f.type || f.type.includes(p.type)) && (!f.weave || f.weave.includes(p.weave)) && (!f.fabric || f.fabric.includes(p.fabric)) && (!f.zari || f.zari.includes(p.zari)) && (!f.border || (p.border || []).some(b => f.border.includes(b))) && (!f.avail || f.avail.includes(status(p))) && (!f.max || p.price <= f.max));
    return tile(occLink(o.key), pic(list), o.label, o.note);
  }).join('');

  /* ── weaves ───────────────────────────────────────────────────────────── */
  const WEAVES = [
    ['Kanjivaram', cLink('kanjivaram'), COL.kanjivaram.image, 'Authentic Kanjivarams in pure silk, woven by skilled weavers with finesse. Korvai borders, kattam checks and vintage recreations.'],
    ['Gadwal', cLink('gadwal'), COL.gadwal.image, 'Handwoven Kuttu Gadwal silks that balance lightness with structure, defined by interlocked contrast borders.'],
    ['Jamdani', cLink('jamdani'), COL.jamdani.image, 'Motifs woven individually into the cloth with supplementary weft, one thread at a time.'],
    ['Ikat', window.KR.grpLink('ikat'), COL.ikat.image, 'Tie-and-dye where the design begins at the yarn stage, before a single thread is woven.'],
    ['Sungudi', cLink('sungudi'), COL.sungudi.image, 'From Madurai. Each tiny dot is tied by hand before the cotton is dyed.'],
  ];
  $('#weaveGrid').innerHTML = WEAVES.map(([n, h, src, d], i) => `<a class="wv" href="${h}" data-reveal="img" style="--i:${i}">
      <img src="${img(src, i ? 640 : 1100)}" srcset="${srcset(src, i ? [360, 640, 900] : [640, 1100, 1600])}" sizes="${i ? '(max-width:980px) 50vw, 25vw' : '(max-width:980px) 100vw, 50vw'}" alt="" loading="lazy" decoding="async">
      <div class="wv__txt"><h3>${n}</h3><div class="wv__more"><div><p>${d}</p><span>Explore ${n} ${arrow}</span></div></div></div></a>`).join('');
  $('#weaveIndex').innerHTML = `<h3>Every weave</h3><ul>${WEAVE_NAV.map(([n, h, sub]) => `<li><a href="${h}">${esc(n)}</a>${sub ? `<span>${sub.map(([sn, sh]) => `<a href="${sh}">${esc(sn)}</a>`).join('')}</span>` : ''}</li>`).join('')}</ul>`;

  /* ── on film: three films; the first begins when the band is in view ──── */
  if (canAuto) new IntersectionObserver(([en]) => {
    const v = $('#motionReels video');
    if (en.isIntersecting) { if (!v.dataset.userPaused && allVideos().every(o => o.paused)) playOnly(v); }
    else $$('#motionReels video').forEach(o => o.pause());
  }, { threshold: .45 }).observe($('#motion'));

  /* ── Vintage Kanjivarams: full-bleed film from a Pazhamai piece's own Shopify video ── */
  const filmed = byHandle.get(FILM_SLOTS.feature) || P.find(p => p.collection === 'pazhamai' && p.media);
  const fv = filmed?.media?.find(m => m.t === 'v');
  const pz = $('#pazhamai');
  $('#pzhDesc').textContent = COL.pazhamai.about;
  const still = fv ? fv.poster : COL.pazhamai.image;
  $('#pzhMedia').innerHTML = `<img src="${fv ? still : img(still, 1600)}" alt="" loading="lazy" decoding="async">` +
    (fv ? `<video id="pzhFilm" data-film data-src="${fv.full || fv.hd}" muted loop playsinline preload="none" aria-label="A Pazhamai vintage recreated Kanjivaram, shown on film"></video>` : '');
  if (fv) {
    const v = $('#pzhFilm'), btn = $('#pzhToggle'); btn.hidden = false;
    bindToggle(v, btn, on => pz.classList.toggle('is-playing', on || v.currentTime > 0));
    autoInView(v, pz, .35);
  }

  /* ── colours: traditional names that are in stock today ───────────────── */
  const cnt = {}; P.forEach(p => { if (p.type === 'Saree' && inStock(p)) new Set([p.color?.name, p.color2?.name]).forEach(n => { if (n) cnt[n] = (cnt[n] || 0) + 1; }); });
  const want = ['Arakku', 'Vadamalli', 'Ramar Blue', 'MS Blue', 'Peacock Blue', 'Onion Pink', 'Sampanga', 'Turmeric', 'Pasumanjal', 'Maroon', 'Manthulir', 'Brinjal', 'Mustard', 'Golden Ivory', 'Ivory', 'Black'];
  const names = [...want.filter(n => cnt[n]), ...Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).filter(n => !want.includes(n) && !/^(Red|Pink|Blue|Green|Purple|Yellow|Orange|Brown|Grey|White|Multicolor)$/.test(n))].slice(0, 12);
  const light = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) > 165; };
  $('#swGrid').innerHTML = names.map(n => { const l = LEX.find(x => x.name === n); return `<a class="sw ${light(l.hex) ? 'sw--light' : ''}" style="--c:${l.hex}" href="${R.shop}?colour=${encodeURIComponent(n)}"><b>${n}</b><small>${cnt[n]} in stock · ${l.family}</small></a>`; }).join('');

  /* ── story: each line is a statement Krsaangi already publishes ───────── */
  const STORY = [
    ['Recreation', 'Pazhamai recreates vintage Kanjivarams “through careful research and collaboration with skilled weavers.”'],
    ['Technique', 'Korvai borders are interlocked by hand, and selected pieces are woven in the age-old adai method.'],
    ['Restraint', 'Snigdha explores Kanjivarams without zari, “bringing attention to the texture and finish of pure silk.”'],
    ['Regions', 'Sungudi from Madurai, Baluchari from Bengal, Bhujodi from Kutch, Kotpad from Odisha, Moirang Phee from Manipur.'],
    ['Artisans', 'Terracotta jewellery is handmade by women artisans; Balucharis are handwoven by skilled artisans.'],
  ];
  $('#storyList').innerHTML = STORY.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('');
  const macro = ['pazhamai', 'kattam', 'mythili', 'maathey'].map((k, i) => { const p = P.find(x => x.collection === k && x.images.length > 4) || P.find(x => x.collection === k); return p && p.images[Math.min(p.images.length - 1, [2, 4, 3, 2][i])].src; }).filter(Boolean);
  $('#storyImgs').innerHTML = macro.map((s, i) => `<figure data-reveal="img" style="--i:${i % 2}"><img src="${img(s, 700)}" srcset="${srcset(s, [400, 700, 1000])}" sizes="(max-width:980px) 50vw, 25vw" alt="Close view of a Krsaangi Kanjivaram: border, zari and weave" loading="lazy"></figure>`).join('');

  /* ── Instagram: Krsaangi's own film and photography ───────────────────── */
  const igStills = ['mythili', 'kattam', 'vriksha', 'gadwal'].map(k => COL[k]).filter(c => c?.image);
  const igIco = I.ig.replace('class="ico"', 'style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4"');
  const igStill = c => `<a class="reel" href="${SETTINGS.instagram}" target="_blank" rel="noopener" data-ig><img src="${img(c.image, 500)}" alt="" loading="lazy"><span class="reel__cap"><span>${igIco} @krsaangi<span class="sr">: ${esc(c.name)}, on Instagram (opens in a new tab)</span></span></span></a>`;
  const [iA, iB] = FILM_SLOTS.instagram;
  $('#igGrid').innerHTML = [reelHTML(REELS[iA], 'Krsaangi film'), igStill(igStills[0]), igStill(igStills[1]), reelHTML(REELS[iB], 'Krsaangi film'), igStill(igStills[2]), igStill(igStills[3])].join('');
  // live posts replace the curated set when SETTINGS.instagramFeedUrl is configured; otherwise the set above stays
  window.KR.instagramFeed($('#igGrid'), 6);

  /* ── whatsapp image, journal ──────────────────────────────────────────── */
  const wImg = COL.maathey.image;
  $('#circleImg').innerHTML = `<img src="${img(wImg, 1000)}" srcset="${srcset(wImg, [640, 1000, 1400])}" sizes="(max-width:980px) 100vw, 42vw" alt="" loading="lazy">`;
  $('#journalGrid').innerHTML = JOURNAL.map(j => ({ ...j, c: COL[j.k] })).map(j => `<a class="jr" href="${cLink(j.k)}" data-reveal>
      <figure><img src="${img(j.c.image, 800)}" srcset="${srcset(j.c.image, [480, 800, 1200])}" sizes="(max-width:980px) 100vw, 30vw" alt="" loading="lazy"></figure>
      <p class="eyebrow">${j.tag}</p><h3>${j.t}</h3><p class="coll-desc">${esc(j.c.about.split('. ')[0].replace(/\.?$/, '.'))}</p>
      <span class="link">Shop ${j.c.name} ${arrow}</span></a>`).join('');

  if (matchMedia('(hover: none)').matches) $$('.wv').forEach(w => w.addEventListener('click', e => { if (!w.classList.contains('is-open')) { e.preventDefault(); $$('.wv.is-open').forEach(x => x.classList.remove('is-open')); w.classList.add('is-open'); } }));

  $('#newsForm')?.addEventListener('submit', e => {
    const i = $('#newsEmail'), n = $('#newsNote'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value.trim());
    i.setAttribute('aria-invalid', !ok);
    if (!ok) { e.preventDefault(); n.className = 'form-note is-err'; n.textContent = 'Enter a valid email address, for example name@example.com.'; return; }
    track('newsletter_signup');   // Shopify's customer form then submits as normal
  });
  reveal();
})();
