/* Product page. Sizes come from the product's real Shopify variants, video from its
   Shopify media, reviews from the review provider (none connected yet, so none are shown).
   Anything Krsaangi has not published appears as a marked pending slot, never a guess. */
(() => {
  const { P, COL, byHandle, $, $$, esc, money, img, srcset, I, status, STATUS, kicker, collName, url, dot, card, availHTML, preWindow, recs, coreSpecs, specsHTML,
    track, wish, bindRail, railNav, reveal, cLink, SETTINGS, reduced, addToBag, toast, fmtDate, gaItem, R, preMoney, moneyC, preTimeline, preorderToBag, stitchVariant } = window.KR;
  const PG = window.KR_THEME?.page || {};
  const h = (PG.type === 'product' && PG.handle) || new URLSearchParams(location.search).get('h');
  const p = h ? byHandle.get(h) : (P.find(x => x.collection === 'pazhamai' && status(x) === 'in' && x.images.length >= 7) || P[0]);
  const main = $('#kr-product') || $('#main');

  // a product Shopify knows but the catalogue feed doesn't (gift card, hidden product): keep Shopify's own page
  if (!p && PG.type === 'product') return;
  if (!p) { // 404 with a way forward
    document.title = 'Not found — Krsaangi';
    const sug = P.filter(x => status(x) === 'in' && x.type === 'Saree').slice(0, 4);
    main.innerHTML = `<div class="wrap section"><div class="empty"><p class="eyebrow">Page not found</p><h1 class="h2">We couldn’t find <em>that piece.</em></h1><p class="muted">It may have sold and been archived. These are in stock today.</p>
      <div class="empty__acts"><a class="btn btn--sm" href="${R.shop}?avail=in">Shop available now</a><button class="btn btn--ghost btn--sm" data-open="search">Search</button><button class="btn btn--ghost btn--sm" data-open="ask">Ask us a question</button></div></div><div class="grid">${sug.map(x => card(x)).join('')}</div></div>`;
    return;
  }

  const st = status(p), c = COL[p.collection], isSaree = p.type === 'Saree';
  const typeCrumb = { Saree: ['Sarees', R.shop + '?type=Saree'], Blouse: ['Blouses', cLink('blouses')], Jewellery: ['Jewellery', R.shop + '?type=Jewellery'], Accessory: ['Accessories', R.shop + '?type=Accessory'], Kids: ['Kids', R.shop + '?type=Kids'] }[p.type];
  const crumbs = [['Home', R.home], typeCrumb, [c.name, cLink(c.key)], [p.name]];
  const alt = i => `${p.name}${p.colorLine ? ', ' + p.colorLine : ''} — ${collName(p)}, image ${i + 1} of ${p.images.length}`;

  /* ── reviews: the rating comes from a reviews app (Shopify's standard reviews fields). Without one, no rating,
     no review form and no reviews section are shown: a form that only saved on this device would mislead. ── */
  const REVIEWS = [];   // [{ rating, title, body, name, date, verified }]
  const pendingKey = 'kr_review_pending';
  const getPending = () => { try { return (JSON.parse(localStorage.getItem(pendingKey)) || {})[p.handle] || null; } catch { return null; } };
  const starRow = n => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${[1, 2, 3, 4, 5].map(i => I.star.replace('<svg', `<svg class="${i <= Math.round(n) ? '' : 'off'}"`)).join('')}</span>`;
  const avg = REVIEWS.length ? REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length : 0;
  const ratingLine = p.rating
    ? `<p class="ratingline">${starRow(p.rating.value * 5 / p.rating.max)}<b>${(p.rating.value * 5 / p.rating.max).toFixed(1)}</b><span class="muted">(${p.rating.count} review${p.rating.count > 1 ? 's' : ''})</span></p>`
    : '';

  /* ── gallery: one large image, a thumbnail strip, and a labelled Details row when close-ups are labelled.
     Images and Shopify-hosted video keep the order set in Shopify. ── */
  const media = p.media || p.images;
  const stillSlide = [];                       // still index → slide index
  const slides = media.map((m, i) => {
    if (m.t === 'v') return `<div class="pg__slide pg__slide--v" data-s="${i}">
        <video controls playsinline muted loop preload="none" poster="${img(m.poster, 900)}" aria-label="${esc(p.name)}: video, the piece shown in motion">
          <source src="${m.src}" type="video/mp4" media="(max-width: 980px)"><source src="${m.hd}" type="video/mp4"></video>
        <span class="vtag">${I.play} Video</span></div>`;
    const k = stillSlide.push(i) - 1, im = p.images[k];
    return `<div class="pg__slide" data-s="${i}"><button class="pg__zoom" data-i="${k}" aria-label="Enlarge image ${k + 1} of ${p.images.length}${im.label ? ': ' + esc(im.label) : ''}">
      <img src="${img(m.src, 1000)}" srcset="${srcset(m.src, [600, 1000, 1400, 2000])}" sizes="(max-width:980px) 100vw, 42vw" data-src="${esc(m.src)}" width="3" height="4" alt="${esc(alt(k))}${im.label ? ' — ' + esc(im.label) : ''}" ${i ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}></button>
      ${im.label ? `<span class="pg__label">${esc(im.label)}</span>` : ''}</div>`;
  }).join('');
  const thumbs = media.map((m, i) => `<button class="pg__thumb" data-go="${i}" aria-label="Show ${m.t === 'v' ? 'video' : 'image'} ${i + 1} of ${media.length}" ${i ? '' : 'aria-current="true"'}>
      <img src="${img(m.t === 'v' ? m.poster : m.src, 200)}" alt="" ${i < 6 ? '' : 'loading="lazy"'} decoding="async" width="3" height="4">${m.t === 'v' ? `<i>${I.play}</i>` : ''}</button>`).join('');
  const closeups = p.images.map((im, k) => im.label ? [im.label, k] : null).filter(Boolean);
  const nVid = media.filter(m => m.t === 'v').length;
  const gallery = `<div class="pg" id="pg">
      <div class="pg__thumbs" id="pgThumbs" aria-label="All images">${thumbs}</div>
      <div class="pg__stage">
        <div class="pg__track" id="gal" tabindex="0" aria-label="Product images. Use the thumbnails or swipe.">${slides}</div>
        <p class="pg__meta"><span class="num" id="galCount">1 / ${media.length}</span><span class="pg__hint"><span class="pg__hint--fine">${I.zoom} Move over the image to zoom. Click to enlarge.</span><span class="pg__hint--touch">${I.zoom} Tap to enlarge, then pinch to zoom.</span></span></p>
      </div>
      ${closeups.length ? `<div class="pg__details"><h2 class="eyebrow">Details</h2><div>${closeups.map(([label, k]) => `<button data-go="${stillSlide[k]}" aria-label="Show the ${esc(label)} close-up"><img src="${img(p.images[k].src, 400)}" alt="" loading="lazy" decoding="async"><span>${esc(label)}</span></button>`).join('')}</div></div>` : ''}
      ${nVid ? `<p class="fine pg__vnote">${nVid} video${nVid > 1 ? 's' : ''} of this piece. Videos start without sound; use the controls to play, pause or view full screen.</p>` : ''}
    </div>`;

  /* ── size: real variants only ── */
  const V = p.variants, multi = V.length > 1;
  const onlyAvail = V.filter(v => v.available);
  let chosen = !multi ? (V[0] || null) : (onlyAvail.length === 1 ? onlyAvail[0] : null);
  const sizeUI = multi ? `<fieldset class="sizes" id="size" tabindex="-1">
        <legend>Select size <b id="sizeNow">${chosen ? esc(chosen.title) : ''}</b></legend>
        <div class="sizes__opts">${V.map(v => `<label class="size"><input type="radio" name="size" value="${v.id}" ${v.available ? '' : 'disabled'} ${chosen === v ? 'checked' : ''}><span>${esc(v.title)}${v.available ? '' : '<small>Sold out</small>'}</span><span class="sr">${v.available ? '' : ' — sold out'}</span></label>`).join('')}</div>
        <p class="sizes__err" id="sizeErr" role="alert" hidden>Please select a size first.</p>
      </fieldset>`
    : V.length === 1 ? `<p class="onesize" id="size"><b>Size</b><span>${esc(V[0].title)}${/–/.test(V[0].title) ? ' <span class="muted">(as listed by Krsaangi)</span>' : ''}</span></p>` : '';

  /* Pre-order, by Krsaangi's rules: an eligible sold-out Kanjivaram is woven for the customer. 30% (Shopify's
     pre-order purchase option) is paid now, the rest before dispatch from a payment link. Blouse stitching is
     optional, with notes saved against this saree. The cancellation policy must be accepted to continue. */
  const stv = p.preorder ? stitchVariant() : null;
  // editing a preorder already in the bag: its choices come back, and saving replaces the old lines
  const inBag = p.preorder ? window.KR.bag().find(l => l.id === p.id && l.pre && l.props?._kr_ref) : null;
  const inBagTied = inBag ? window.KR.bag().find(l => l.props?._kr_for && l.props._kr_ref === inBag.props._kr_ref) : null;
  const editing = !!inBag && /[?&]edit=1\b/.test(location.search);
  const preHTML = () => {
    const m = preMoney(p, stitchOn() ? stv : null);
    return `<dl class="pre__pay">
        <div class="pre__full"><dt>Full price</dt><dd class="num">${moneyC(m.sareeC)}</dd></div>
        <div class="pre__today"><dt>Pay today <span>(${m.pct}% advance)</span></dt><dd class="num">${moneyC(m.sareeTodayC)}</dd></div>
        <div><dt>Balance before dispatch <span>(${100 - m.pct}%)</span></dt><dd class="num">${moneyC(m.sareeLaterC)}</dd></div>
      </dl>
      ${m.stitchC ? `<dl class="pre__items">
        <div><dt>Saree</dt><dd class="num">${moneyC(m.sareeC)}</dd></div>
        <div><dt>Blouse stitching</dt><dd class="num">${moneyC(m.stitchC)}</dd></div>
        <div class="pre__sum"><dt>Full order value</dt><dd class="num">${moneyC(m.fullC)}</dd></div>
        <div class="pre__sum"><dt>Due today</dt><dd class="num">${moneyC(m.todayC)}</dd></div>
        <div><dt>Due before dispatch</dt><dd class="num">${moneyC(m.laterC)}</dd></div>
      </dl><p class="fine">${stv.inPlan ? `Blouse stitching is paid like the saree: ${m.pct}% today, the rest before dispatch.` : 'Blouse stitching is paid in full today.'}</p>` : ''}`;
  };
  const preorder = p.preorder ? `<section class="pre" id="preorder" aria-labelledby="preH" tabindex="-1">
      <div class="pre__head"><span class="badge-pre">Preorder</span><span class="pre__tag">Woven especially for you</span></div>
      <div class="pre__eta"><p class="eyebrow">Estimated dispatch</p><h2 class="pre__date" id="preH">${esc(preTimeline(p))}</h2>
        <p>This saree will be woven specifically for your order. This is an estimate, not a guaranteed delivery date; if there is a significant delay, we will let you know.</p></div>
      <div id="prePay" aria-live="polite">${''}</div>
      <p class="fine">${p.preorder.pct ?? 30}% advance today. Remaining ${100 - (p.preorder.pct ?? 30)}% before dispatch: when your saree is ready we send a secure payment link, and it is dispatched after full payment is received.</p>
      <p><button type="button" class="link" id="preHow" aria-haspopup="dialog">How preorders work ${I.arrow}</button></p>
      ${stv ? `<fieldset class="pre__stitch"><legend>Blouse stitching</legend>
        <label class="pre__check"><input type="radio" name="preStitch" value="no" ${inBagTied && editing ? '' : 'checked'}><span>No stitching</span></label>
        <label class="pre__check"><input type="radio" name="preStitch" value="yes" ${inBagTied && editing ? 'checked' : ''}><span>Add blouse stitching <b class="num">+${money(stv.price)}</b></span></label>
        <div id="preNotesWrap" ${inBagTied && editing ? '' : 'hidden'}><label for="preNotes">Blouse preferences / special instructions</label>
          <textarea id="preNotes" rows="4" maxlength="500" placeholder="Tell us about your preferred blouse style, sleeve length, neckline or any special requests.">${esc(editing ? inBag.props['Blouse instructions'] || '' : '')}</textarea>
          <p class="fine">Saved with this saree on your order.</p></div></fieldset>` : ''}
      <div class="pre__policy"><p><b>Cancellation and exchange.</b> ${esc(SETTINGS.preorderPolicy)}</p>
        <label class="pre__check"><input type="checkbox" id="preAgree" aria-describedby="preErr"><span>${esc(SETTINGS.preorderAck)}</span></label>
        <p class="sizes__err" id="preErr" role="alert" hidden>Please tick the box above to confirm you understand the preorder terms.</p></div>
    </section>
    <dialog class="prehow" id="preHowBox" aria-labelledby="preHowH">
      <form method="dialog"><button class="icon-btn prehow__x" aria-label="Close">${I.x}</button></form>
      <p class="eyebrow">Preorder</p><h2 class="h3" id="preHowH">How preorders work</h2>
      <ol class="prehow__steps">
        <li><b>${p.preorder.pct ?? 30}% advance</b><span>You pay the advance today to confirm your preorder.</span></li>
        <li><b>Weaving</b><span>Your saree is woven for you. Estimated ${esc(preTimeline(p))}.</span></li>
        <li><b>Quality check</b><span>We check the finished saree${stv ? ' and stitch your blouse, if you chose it' : ''}.</span></li>
        <li><b>${100 - (p.preorder.pct ?? 30)}% balance</b><span>We send a secure payment link for the balance.</span></li>
        <li><b>Dispatch</b><span>Your saree is dispatched once paid in full, with tracking.</span></li>
      </ol>
      <p>This saree will be woven specifically for your order. Production typically takes approximately ${esc(preTimeline(p))}. We will contact you when your saree is ready and send a secure payment link for the remaining balance. Your saree will be dispatched after full payment is received.</p>
      <p class="fine">${esc(SETTINGS.preorderPolicy)}</p>
    </dialog>` : p.preorderPending ? '' : '';

  const similar = st === 'out' ? recs.love(p, 12).filter(x => status(x) === 'in').slice(0, 3) : [];
  const soldOut = st === 'out' ? `<div class="pending" style="border-style:solid"><b style="color:var(--ink)">This piece has sold</b>Handwoven pieces are often one of a kind.${similar.length ? ' These are close to it and in stock:' : ''}
      ${similar.map(x => `<a class="pair" href="${url(x)}" style="grid-template-columns:52px 1fr auto"><img src="${img(x.images[0].src, 120)}" alt="" style="width:52px"><span><b>${esc(x.name)}</b><small>${esc(x.colorLine)}</small></span><span class="price">${money(x.price)}</span></a>`).join('')}
      <p style="margin-top:10px"><button class="link" data-open="ask">Ask us about a re-weave ${I.arrow}</button></p></div>` : '';

  const assure = [
    [I.lock, 'Pay on Krsaangi’s secure Shopify checkout. The payment options available to you are shown there.'],
    [I.box, 'Ships from the USA. International shipping to select countries, with rates shown at checkout.'],
    /handwoven|hand woven|handknotted|handspun|handcrafted|handmade/i.test(p.story) && [I.hand, `${/handwoven|hand woven|handspun/i.test(p.story) ? 'Handwoven' : 'Handmade'}, as described by Krsaangi for this piece.`],
    [I.chat.replace('class="ico"', ''), `Not sure? <button class="link" data-open="ask" style="padding:0;letter-spacing:.02em;text-transform:none;font-size:var(--t-sm);font-weight:600">Ask us a question</button> or email <span style="user-select:all">${SETTINGS.email}</span>.`],
  ].filter(Boolean);

  const specs = coreSpecs(p);
  const factRows = [['Length', p.facts?.length], ['Width', p.facts?.width], ['Weight', p.facts?.weight], ['Origin', p.facts?.origin]].filter(x => x[1]);
  const price0 = chosen?.price ?? p.price;
  const stitchOn = () => !!(stv && document.querySelector('input[name="preStitch"][value="yes"]')?.checked);
  // the public preview has no Shopify checkout: its preorder button is shown, disabled, never as if it worked
  const previewOnly = st === 'pre' && SETTINGS.previewOnly;
  const buyLabel = () => st === 'out' ? 'Sold out' : previewOnly ? 'Preorder opens on krsaangi.us' : st === 'pre' ? (editing ? 'Update preorder in bag' : 'Preorder Now') : multi && !chosen ? 'Select a size' : `Add to bag · ${money(chosen?.price ?? p.price)}`;
  /* The facts a customer checks before buying, beside the button. Only fields the data supports are shown. */
  const glance = (() => {
    const rows = coreSpecs(p).filter(([k]) => ['Fabric', 'Zari', 'Border', 'Motif', 'Technique', 'Blouse'].includes(k));
    if (p.facts?.care) rows.push(['Care', p.facts.care.split('\n')[0]]);
    rows.push(['Shipping', 'Ships from the USA. Rates shown at checkout.']);
    return `<dl class="glance" aria-label="Key details">${rows.map(([k, v, todo]) => `<div><dt>${k}</dt><dd>${v ? esc(v) : `<span class="todo">${todo}</span>`}</dd></div>`).join('')}</dl>`;
  })();

  const info = `<div class="info" id="info">
      <nav aria-label="Breadcrumb"><ol class="crumbs">${crumbs.map(([n, hr], i) => `<li>${i < crumbs.length - 1 ? `<a href="${hr}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}</li>`).join('')}</ol></nav>
      <div style="display:grid;gap:12px">
        <p class="eyebrow eyebrow--accent"><a href="${cLink(c.key)}">${esc(c.name)}${c.subtitle ? ' · ' + esc(c.subtitle) : ''}</a></p>
        <h1 class="info__title">${esc(p.name)}</h1>
        ${p.colorLine ? `<p class="info__colour">${dot(p.color)}${dot(p.color2)}<span>${esc(p.colorLine)}</span></p>` : ''}
        ${ratingLine}
      </div>
      <div class="info__price"><span class="price" id="priceNow">${money(price0)}${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ''}</span>${availHTML(p)}</div>
      ${preorder}
      ${glance}
      ${sizeUI}
      <div class="info__acts"><button class="btn btn--full" id="buy" data-buy ${st === 'out' || previewOnly ? 'disabled' : ''}>${buyLabel()}</button>
        <button class="wishbtn" data-wish="${p.id}" aria-pressed="${wish().has(p.id)}" aria-label="Save to your saved items">${I.heart}</button></div>
      ${soldOut}
      <ul class="assure">${assure.map(([ic, t]) => `<li>${ic}<span>${t}</span></li>`).join('')}</ul>
      <div class="acc">
        <details open><summary>The story<i></i></summary><div class="acc__body story-txt">${p.story.split('\n').filter(Boolean).map(s => `<p>${esc(s)}</p>`).join('') || '<p class="muted">Krsaangi has not written a description for this piece yet.</p>'}</div></details>
        <details open><summary>The details<i></i></summary><div class="acc__body">${specs.length ? specsHTML(specs) : ''}
          ${factRows.length ? specsHTML(factRows) : ''}
          <p class="fine">Listed on krsaangi.us as “${esc(p.sourceTitle)}”.</p></div></details>
        ${c.about ? `<details><summary>${isSaree ? 'The weave' : 'The craft'}<i></i></summary><div class="acc__body"><p>${esc(c.about)}</p><p><a class="link" href="${cLink(c.key)}">Explore ${esc(c.name)} ${I.arrow}</a></p></div></details>` : ''}
        ${p.facts?.care ? `<details><summary>Care<i></i></summary><div class="acc__body">${p.facts.care.split('\n').filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('')}</div></details>` : ''}
        <details><summary>Shipping &amp; returns<i></i></summary><div class="acc__body"><p>Krsaangi ships from the USA, with international shipping to select countries. Rates are shown at checkout.</p>
          ${[['Shipping policy', SETTINGS.links?.shipping], ['Returns and refunds', SETTINGS.links?.returns]].filter(x => x[1]).map(([n, h]) => `<p><a class="link" href="${h}">${n} ${I.arrow}</a></p>`).join('')}
          <p>Questions? <button class="link" data-open="ask" style="padding:0;letter-spacing:.02em;text-transform:none;font-size:inherit;font-weight:600">Ask us</button> or email <span style="user-select:all">${SETTINGS.email}</span>.</p></div></details>
      </div>
    </div>`;

  /* ── reviews section ── */
  const dist = REVIEWS.length ? `<div class="dist">${[5, 4, 3, 2, 1].map(n => { const k = REVIEWS.filter(r => r.rating === n).length; return `<div><span>${n} star${n > 1 ? 's' : ''}</span><i><b style="width:${k / REVIEWS.length * 100}%"></b></i><span class="num">${k}</span></div>`; }).join('')}</div>` : '';
  const reviewCard = (r, pend) => `<article class="review ${pend ? 'review--pending' : ''}">${pend ? '<p class="sample-tag" style="justify-self:start">Waiting for approval · only you can see this</p>' : ''}
      ${starRow(r.rating)}<h4>${esc(r.title)}</h4><p>${esc(r.body)}</p>
      <p class="review__meta"><span>${esc(r.name)}</span><span>${esc(r.date)}</span>${r.verified ? '<span class="avail avail--in">Verified purchase</span>' : ''}</p></article>`;
  const reviewsHTML = () => {
    const mine = getPending();
    return `<div class="wrap reviews">
      <div class="reviews__sum">
        <p class="eyebrow">Customer reviews</p>
        ${REVIEWS.length ? `<h2 class="h2" id="reviews-h">${avg.toFixed(1)} <span style="font-size:.5em">out of 5</span></h2><p>${starRow(avg)} <span class="muted">${REVIEWS.length} review${REVIEWS.length > 1 ? 's' : ''}</span></p>${dist}`
          : `<h2 class="h2" id="reviews-h">Be the first to <em>review this piece.</em></h2><p class="muted">No one has reviewed it yet. We never show a rating until a real customer has left one.</p>`}
        ${mine ? '' : '<p><button class="btn" id="openReview" aria-expanded="false" aria-controls="rform">Write a review</button></p>'}
      </div>
      <div>
        ${mine ? reviewCard(mine, true) : ''}${REVIEWS.map(r => reviewCard(r)).join('')}
        <form class="rform" id="rform" novalidate ${mine ? 'hidden' : 'hidden'}>
          <h3 class="h3">Write a review</h3>
          <fieldset class="rate"><legend>Your rating</legend><div class="rate__opts">${[5, 4, 3, 2, 1].map(n => `<label><input type="radio" name="rating" value="${n}"><span>${n} ${I.star} <span class="sr">star${n > 1 ? 's' : ''}</span></span></label>`).join('')}</div></fieldset>
          <label for="rvName">Your name <span>Shown with your review. A first name is fine.</span><input type="text" id="rvName" name="name" autocomplete="given-name" maxlength="40"></label>
          <label for="rvTitle">Title<input type="text" id="rvTitle" name="title" maxlength="80"></label>
          <label for="rvBody">Your review<textarea id="rvBody" name="body" maxlength="1500"></textarea></label>
          <p class="rform__err" id="rvErr" role="alert" hidden></p>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Send review</button><button class="btn btn--ghost" type="button" id="cancelReview">Cancel</button></div>
          <p class="fine">Every review is read by the Krsaangi team before it appears. A “Verified purchase” mark is added only when the review can be matched to an order.</p>
        </form>
      </div></div>`;
  };

  /* ── recommendation layers, each with its reason stated ── */
  const love = recs.love(p), twist = recs.twist(p), look = isSaree ? recs.look(p) : [], up = recs.stepUp(p);
  const railSec = (id, eyebrow, title, list, src, note = '') => list.length ? `<section class="section section--tight" aria-labelledby="${id}-h" data-rec="${src}"><div class="wrap">
      <div class="sec-head"><div><p class="eyebrow" data-reveal>${eyebrow}</p><h2 class="h2" id="${id}-h" data-reveal>${title}</h2>${note ? `<p class="muted" data-reveal>${note}</p>` : ''}</div><div id="${id}Nav">${list.length > 4 ? railNav(title.replace(/<[^>]+>/g, '')) : ''}</div></div>
      <div class="rail" id="${id}Rail" tabindex="0">${list.map(x => card(x, { sizes: '(max-width:640px) 68vw, 24vw' })).join('')}</div></div></section>` : '';
  const fam = p.color?.family;
  const stepUp = up ? `<section class="section section--tight section--tint" data-rec="step_up"><div class="wrap edit" style="align-items:center">
      <a class="edit__a" href="${url(up)}" style="grid-column:1 / span 5;aspect-ratio:4/5" data-reveal="img"><img src="${img(up.images[0].src, 1000)}" alt="${esc(up.name)}" loading="lazy"></a>
      <div class="edit__txt" style="grid-column:7 / span 5;gap:18px">
        <p class="eyebrow" data-reveal>If you are considering more</p>
        <h2 class="h2" data-reveal>${esc(up.name)}</h2>
        <p class="info__colour" data-reveal>${dot(up.color)}${dot(up.color2)}${esc(up.colorLine)}</p>
        <p class="muted" data-reveal style="max-width:48ch">The same ${esc(up.weave)} tradition${up.border?.includes('Korvai') && !p.border?.includes('Korvai') ? ', with an interlocked korvai border' : ''}${up.collection !== p.collection ? `, from the ${esc(collName(up))} collection` : ''}. ${money(up.price)}, in stock.</p>
        <p data-reveal><a class="btn btn--ghost" href="${url(up)}">View this piece</a></p></div></div></section>` : '';

  main.innerHTML = `<div class="wrap pdp" style="padding-top:clamp(0px,1vw,16px)">${gallery}${info}</div>
    ${railSec('look', 'Chosen for this saree', 'Complete the <em>look</em>', look, 'cross_sell', 'A blouse, jewellery and a potli, matched to the border colour where we can.')}
    ${''}
    ${railSec('love', 'You may also love', `More in this <em>spirit</em>`, love, 'recommendation', `Shared ${[fam && 'colour family', p.weave && 'weave', 'price range'].filter(Boolean).join(', ')}.`)}
    ${railSec('twist', 'Similar, with a twist', `The same palette, <em>another weave</em>`, twist, 'recommendation', fam ? `${fam} in a different textile tradition.` : '')}
    ${stepUp}
    <div class="buybar" id="buybar"><div class="buybar__txt"><b>${esc(p.name)}</b><span class="price" id="barLine">${money(price0)} · ${STATUS[st]}</span></div>
      <button class="btn" data-buy ${st === 'out' ? 'disabled' : ''}>${st === 'out' ? 'Sold out' : st === 'pre' ? 'Preorder Now' : multi && !chosen ? 'Select size' : 'Add to bag'}</button></div>`;
  document.body.classList.add('has-buybar');
  ['look', 'love', 'twist'].forEach(id => bindRail($(`#${id}Rail`), $(`#${id}Nav .rail-nav`)));

  /* ── size + add to bag: only an available Shopify variant can be added ── */
  const paintBuy = () => {
    $('#buy').textContent = buyLabel();
    if ($('#prePay')) $('#prePay').innerHTML = preHTML();
    $('#buybar [data-buy]').textContent = st === 'out' ? 'Sold out' : st === 'pre' ? 'Preorder Now' : multi && !chosen ? 'Select size' : 'Add to bag';
    if (chosen) { $('#priceNow').firstChild.textContent = money(chosen.price); $('#barLine').textContent = `${money(chosen.price)} · Size ${chosen.title}`; if ($('#sizeNow')) $('#sizeNow').textContent = chosen.title; }
  };
  main.addEventListener('change', e => {
    if (e.target.name === 'preStitch') { const on = e.target.value === 'yes'; $('#preNotesWrap').hidden = !on; paintBuy(); if (on) track('preorder_stitching_selected', { item_id: String(p.id) }); return; }
    if (e.target.id === 'preAgree') { $('#preErr').hidden = true; if (e.target.checked) track('preorder_policy_acknowledged', { item_id: String(p.id) }); return; }
    if (e.target.name !== 'size') return;
    chosen = V.find(v => v.id === +e.target.value); $('#sizeErr').hidden = true; paintBuy();
    track('select_variant', { item_id: String(p.id), item_variant: chosen.title });
  });
  main.addEventListener('click', e => {
    if (!e.target.closest('[data-buy]')) return;
    if (st === 'pre') {
      const box = $('#preorder');
      track('preorder_cta_click', { item_id: String(p.id), where: e.target.closest('#buybar') ? 'bar' : 'panel' });
      if (e.target.closest('#buybar')) { box.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); box.focus({ preventScroll: true }); return; }
      if (!$('#preAgree').checked) { $('#preErr').hidden = false; $('#preAgree').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); $('#preAgree').focus({ preventScroll: true }); return; }
      const b = $('#buy'); b.disabled = true;
      preorderToBag(p, { stitching: stitchOn(), notes: $('#preNotes')?.value || '', acknowledged: true, replaceKeys: editing ? [inBag.key, inBagTied?.key].filter(Boolean) : [] }).finally(() => { b.disabled = false; });
      return;
    }
    if (multi && !chosen) { const f = $('#size'); $('#sizeErr').hidden = false; f.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); $('input:not(:disabled)', f)?.focus({ preventScroll: true }); return; }
    addToBag(p.id, { vid: chosen?.id });
  });
  if (p.preorder) {
    paintBuy();
    track('preorder_product_view', { item_id: String(p.id), value: p.preorder.priceCents / 100, currency: 'USD' });
    $('#preHow').addEventListener('click', () => { const d = $('#preHowBox'); d.showModal ? d.showModal() : d.setAttribute('open', ''); track('preorder_how_it_works', { item_id: String(p.id) }); });
  }
  if (location.hash === '#preorder' && $('#preorder')) setTimeout(() => { $('#preorder').scrollIntoView({ block: 'start' }); $('#preorder').focus({ preventScroll: true }); }, 200);
  if (location.hash === '#size' && $('#size')) setTimeout(() => { $('#size').scrollIntoView({ block: 'center' }); $('#size input:not(:disabled)')?.focus({ preventScroll: true }); }, 200);

  /* ── reviews: moderated. A submitted review is held, never published by the page. ── */
  const rsec = $('#reviews') || document.createElement('section');
  rsec.addEventListener('click', e => {
    if (e.target.id === 'openReview') { const f = $('#rform'); f.hidden = false; e.target.setAttribute('aria-expanded', 'true'); f.querySelector('input').focus(); }
    if (e.target.id === 'cancelReview') { $('#rform').hidden = true; $('#openReview')?.setAttribute('aria-expanded', 'false'); $('#openReview')?.focus(); }
  });
  rsec.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.target), err = $('#rvErr');
    const rating = +d.get('rating'), name = (d.get('name') || '').trim(), title = (d.get('title') || '').trim(), body = (d.get('body') || '').trim();
    const miss = !rating ? ['Choose a star rating.', 'input[name=rating]'] : !name ? ['Add your name.', '#rvName'] : !title ? ['Add a short title.', '#rvTitle'] : body.length < 15 ? ['Tell us a little more in your review (at least 15 characters).', '#rvBody'] : null;
    if (miss) { err.textContent = miss[0]; err.hidden = false; $(miss[1], e.target).focus(); return; }
    const rec = { rating, name, title, body, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), verified: false };
    try { const all = JSON.parse(localStorage.getItem(pendingKey)) || {}; all[p.handle] = rec; localStorage.setItem(pendingKey, JSON.stringify(all)); } catch { /* kept for this page only */ }
    track('review_submitted', { item_id: String(p.id), rating });
    rsec.innerHTML = reviewsHTML(); rsec.scrollIntoView({ block: 'start' });
    toast('Thank you. Your review is waiting for approval.');
  });

  /* ── SEO: title, description, Product + Breadcrumb structured data (no rating without real reviews) ── */
  document.title = `${p.name}${p.colorLine ? ' in ' + p.colorLine : ''} — ${c.name} ${p.weave && !c.name.includes(p.weave) ? p.weave + ' ' : ''}| Krsaangi`;
  $('meta[name=description]').content = p.story.replace(/\s+/g, ' ').slice(0, 155);
  const add = o => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(o); document.head.append(s); };
  const offer = (v, avail) => ({ '@type': 'Offer', priceCurrency: 'USD', price: v?.price ?? p.price, sku: String(v?.id ?? p.vid), url: 'https://krsaangi.us/products/' + p.handle, availability: 'https://schema.org/' + avail });
  add({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.story, sku: String(p.id), image: p.images.slice(0, 4).map(i => i.src), brand: { '@type': 'Brand', name: 'Krsaangi' },
    ...(p.color ? { color: p.colorLine } : {}), ...(p.fabric ? { material: p.fabric } : {}), category: p.weave || p.type,
    ...(REVIEWS.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: REVIEWS.length } } : {}),
    offers: V.length ? V.map(v => offer(v, v.available ? 'InStock' : 'SoldOut')) : offer(null, { in: 'InStock', pre: 'PreOrder', out: 'SoldOut' }[st]) });
  add({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n], i) => ({ '@type': 'ListItem', position: i + 1, name: n })) });
  track('view_item', { currency: 'USD', value: p.price, availability: st, videos: nVid, items: [gaItem(p)] });

  /* ── video: starts muted when it scrolls into view, pauses when it leaves, never preloaded ── */
  const saveData = navigator.connection?.saveData;
  const vids = $$('#pg video');
  if (vids.length) {
    const vio = new IntersectionObserver(es => es.forEach(en => {
      const v = en.target;
      if (en.isIntersecting && en.intersectionRatio > .6) { if (!reduced && !saveData && !v.dataset.userPaused) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }), { threshold: [0, .6] });
    vids.forEach(v => {
      vio.observe(v);
      v.addEventListener('pause', () => { if (document.visibilityState === 'visible' && v.getBoundingClientRect().top < innerHeight && v.getBoundingClientRect().bottom > 0 && !v.ended) v.dataset.userPaused = '1'; });
      v.addEventListener('play', () => { delete v.dataset.userPaused; vids.forEach(o => o !== v && o.pause()); track('video_play', { where: 'product', item_id: String(p.id) }); }, { once: false });
    });
  }

  /* ── gallery behaviour: thumbnails, swipe, hover zoom ── */
  const gal = $('#gal'), pg = $('#pg');
  const goTo = i => { const s = gal.children[i]; gal.scrollTo({ left: s.offsetLeft - gal.offsetLeft, behavior: reduced ? 'auto' : 'smooth' }); };
  let shown = 0;
  gal.addEventListener('scroll', () => {
    const i = Math.round(gal.scrollLeft / gal.clientWidth); if (i === shown) return; shown = i;
    $('#galCount').textContent = `${i + 1} / ${media.length}`;
    $$('.pg__thumb', pg).forEach((t, k) => k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'));
    $$('.pg__thumb', pg)[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, { passive: true });
  pg.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { goTo(+b.dataset.go); track('gallery_select', { index: +b.dataset.go }); } });
  gal.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTo(Math.min(media.length - 1, shown + 1)); if (e.key === 'ArrowLeft') goTo(Math.max(0, shown - 1)); });
  // hover zoom (mouse only): 2.3x, following the cursor; the sharper file is fetched on first use
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gal.addEventListener('mousemove', e => {
      const b = e.target.closest('.pg__zoom'); if (!b) return;
      const im = b.firstElementChild, r = b.getBoundingClientRect();
      if (!im.dataset.hi) { im.dataset.hi = '1'; const hi = new Image(); hi.onload = () => { im.removeAttribute('srcset'); im.src = hi.src; }; hi.src = img(im.dataset.src, 2000); }
      im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`;
      im.style.transform = 'scale(2.3)';
    });
    gal.addEventListener('mouseout', e => { const b = e.target.closest('.pg__zoom'); if (b && !b.contains(e.relatedTarget)) b.firstElementChild.style.transform = ''; });
  }

  /* ── full-screen viewer: pinch or wheel to zoom, drag to pan, swipe or arrows to move, Esc to close ── */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), stage = $('#lbStage');
  let cur = 0, opener = null, z = 1, tx = 0, ty = 0, g = null; const pts = new Map();
  const paint = () => { lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`; lb.classList.toggle('is-zoomed', z > 1); $('#lbZoom').setAttribute('aria-pressed', z > 1); $('#lbZoom span').textContent = z > 1 ? 'Zoom out' : 'Zoom in'; };
  const clamp = () => { const mx = Math.max(0, (lbImg.offsetWidth * z - stage.clientWidth) / 2), my = Math.max(0, (lbImg.offsetHeight * z - stage.clientHeight) / 2); tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty)); };
  const setZoom = (nz, cx, cy) => {
    nz = Math.max(1, Math.min(4, nz));
    if (cx != null) { const r = stage.getBoundingClientRect(), ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2; tx = ox - (ox - tx) * nz / z; ty = oy - (oy - ty) * nz / z; }
    z = nz; if (z === 1) tx = ty = 0; clamp(); paint();
  };
  const show = i => {
    cur = (i + p.images.length) % p.images.length; const im = p.images[cur];
    z = 1; tx = ty = 0; paint();
    lbImg.src = img(im.src, 2000); lbImg.srcset = srcset(im.src, [1200, 2000, 3000]); lbImg.sizes = '200vw'; lbImg.alt = alt(cur);
    $('#lbCap').textContent = `Image ${cur + 1} of ${p.images.length}${im.label ? ' · ' + im.label : ''}`;
  };
  const closeLb = () => { lb.classList.remove('is-on'); document.body.classList.remove('is-locked'); goTo(stillSlide[cur]); opener?.focus(); };
  gal.addEventListener('click', e => { const b = e.target.closest('.pg__zoom'); if (!b) return; opener = b; show(+b.dataset.i); lb.classList.add('is-on'); document.body.classList.add('is-locked'); $('#lbClose').focus(); track('image_zoom', { item_id: String(p.id), index: +b.dataset.i }); });
  const pinchGap = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    g = pts.size === 2 ? { d: pinchGap(), z } : { x: e.clientX, y: e.clientY, tx, ty, moved: false };
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && g.d) { const [a, b] = [...pts.values()]; lb.classList.add('is-dragging'); setZoom(g.z * pinchGap() / g.d, (a.x + b.x) / 2, (a.y + b.y) / 2); g.moved = true; return; }
    const dx = e.clientX - g.x, dy = e.clientY - g.y; if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
    if (z > 1 && g.moved) { lb.classList.add('is-dragging'); tx = g.tx + dx; ty = g.ty + dy; clamp(); paint(); }
  });
  const pointerEnd = e => {
    if (!pts.has(e.pointerId)) return; const single = pts.size === 1; pts.delete(e.pointerId); lb.classList.remove('is-dragging');
    if (!single || !g || g.d) { if (!pts.size) g = null; return; }
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (z === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    else if (!g.moved) setZoom(z > 1 ? 1 : 2.5, e.clientX, e.clientY);
    g = null;
  };
  stage.addEventListener('pointerup', pointerEnd); stage.addEventListener('pointercancel', pointerEnd);
  stage.addEventListener('wheel', e => { e.preventDefault(); setZoom(z * (e.deltaY < 0 ? 1.18 : .85), e.clientX, e.clientY); }, { passive: false });
  $('#lbZoom').addEventListener('click', () => setZoom(z > 1 ? 1 : 2.5));
  $('#lbClose').addEventListener('click', closeLb); $('#lbPrev').addEventListener('click', () => show(cur - 1)); $('#lbNext').addEventListener('click', () => show(cur + 1));
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-on')) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === '+' || e.key === '=') setZoom(z * 1.4); else if (e.key === '-') setZoom(z / 1.4);
    else if (e.key === 'Tab') { const f = $$('button', lb); const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });

  /* ── sticky add-to-bag on mobile once the main button leaves the screen ── */
  const bar = $('#buybar');
  new IntersectionObserver(([en]) => bar.classList.toggle('is-on', !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe($('#buy'));

  main.addEventListener('click', e => { const a = e.target.closest('[data-rec] a[href*="/products/"]'); if (a) track(a.closest('[data-rec]').dataset.rec === 'step_up' ? 'upsell_click' : a.closest('[data-rec]').dataset.rec === 'cross_sell' ? 'cross_sell_click' : 'recommendation_click', { from: p.id }); });
  reveal();
})();
