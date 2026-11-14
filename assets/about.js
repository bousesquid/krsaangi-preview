/* About page. Copy in quotes is Krsaangi's own; the story text is a placeholder until Vidya supplies it. */
(() => {
  const { P, COL, $, img, srcset, I, REELS, reduced, track, reveal } = window.KR;
  const canAuto = !reduced && !navigator.connection?.saveData;

  // hero film (REELS[2]); the poster stands in under reduced motion or Save-Data
  const r = REELS[2];
  $('#pzhMedia').innerHTML = `<img src="${r.poster}" alt="" decoding="async"><video id="aboutFilm" muted loop playsinline preload="none" aria-label="A Krsaangi saree shown on film"></video>`;
  const v = $('#aboutFilm'), btn = $('#pzhToggle'), hero = $('#aboutHero'); btn.hidden = false;
  const paint = () => { const on = !v.paused; btn.innerHTML = on ? `${I.pause}<span>Pause video</span>` : `${I.play}<span>Play video</span>`; btn.setAttribute('aria-pressed', on); hero.classList.toggle('is-playing', on || v.currentTime > 0); };
  const play = () => { if (!v.getAttribute('src')) v.src = r.src; v.play().catch(() => {}); };
  btn.addEventListener('click', () => { if (v.paused) { play(); track('video_play', { where: 'about' }); } else v.pause(); });
  v.addEventListener('play', paint); v.addEventListener('pause', paint); paint();
  if (canAuto) addEventListener('load', play, { once: true });

  const CRAFT = [
    ['Recreation', 'Pazhamai recreates vintage Kanjivarams “through careful research and collaboration with skilled weavers.”'],
    ['Technique', 'Korvai borders are interlocked by hand, and selected pieces are woven in the age-old adai method.'],
    ['Restraint', 'Snigdha explores Kanjivarams without zari, “bringing attention to the texture and finish of pure silk.”'],
    ['Regions', 'Sungudi from Madurai, Baluchari from Bengal, Bhujodi from Kutch, Kotpad from Odisha, Moirang Phee from Manipur.'],
    ['Artisans', 'Terracotta jewellery is handmade by women artisans; Balucharis are handwoven by skilled artisans.'],
  ];
  $('#craftList').innerHTML = CRAFT.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('');
  const pics = ['sungudi', 'jamdani', 'baluchari', 'terracotta'].map(k => COL[k]?.image).filter(Boolean);
  $('#craftImgs').innerHTML = pics.map(s => `<figure><img src="${img(s, 700)}" srcset="${srcset(s, [400, 700, 1000])}" sizes="(max-width:980px) 50vw, 25vw" alt="Krsaangi handloom detail" loading="lazy"></figure>`).join('');

  // moved from the homepage, word for word
  const REVIEWS = [
    ['I’ve stopped buying beyond Krsaangi. Every saree is drool worthy and quality is impeccable. I’m a regular customer now and have been happily endorsing to many friends and family members who equally are thrilled.', 'Radhika S.'],
    ['Amazing customer service and the product quality is top-notch. I’m a regular customer and cannot drape any other Kanjivaram than a Krsaangi. I’m that smitten!', 'Vanitha S.'],
    ['Krsaangi Sarees always exceed my expectations! The quality is outstanding and colors are impressive.', 'Priya R.'],
    ['Best saree purchases I’ve made in the last few years. The attention to detail is incredible. Worth every penny!', 'Revathi S.'],
  ];
  $('#quotes').innerHTML = REVIEWS.map(([q, n]) => `<figure class="quote"><blockquote>“${q}”</blockquote><figcaption>${n} · Krsaangi customer</figcaption></figure>`).join('');
  reveal();
})();
