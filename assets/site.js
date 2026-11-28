// Lightbox: every picture opens larger; arrows and Esc work.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lb]'));
  if (!links.length) return;
  var box = document.createElement('div');
  box.className = 'lb'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photograph');
  box.innerHTML = '<button class="lb-x" type="button">Close</button><img alt=""><div class="lb-cap"></div>' +
    '<button class="lb-p" type="button">Previous</button><button class="lb-n" type="button">Next</button>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('.lb-cap'), at = 0, last = null, seq = 0;
  function warm(i) { var p = new Image(); p.src = links[(i + links.length) % links.length].href; }
  // The large file is fetched off-screen and swapped in only once it has arrived,
  // so the caption and alt text never show ahead of the picture.
  function show(i) {
    at = (i + links.length) % links.length;
    var a = links[at], t = a.querySelector('img'), tok = ++seq, pre = new Image();
    function swap() {
      if (tok !== seq) return;
      img.width = a.dataset.w; img.height = a.dataset.h;
      img.src = a.href; img.alt = t ? t.alt : '';
      cap.textContent = a.dataset.cap || '';
      box.classList.remove('lb-wait');
      warm(at + 1); warm(at - 1);
    }
    box.classList.add('lb-wait');
    if (!img.getAttribute('src') && t && t.complete && t.naturalWidth) { img.width = a.dataset.w; img.height = a.dataset.h; img.src = t.currentSrc || t.src; }
    pre.onload = swap; pre.onerror = swap;
    pre.src = a.href;
    if (pre.complete && pre.naturalWidth) swap();
  }
  function open(i) { last = document.activeElement; show(i); box.hidden = false; document.documentElement.style.overflow = 'hidden'; box.querySelector('.lb-x').focus(); }
  function close() { seq++; box.hidden = true; img.removeAttribute('src'); img.alt = ''; cap.textContent = ''; box.classList.remove('lb-wait'); document.documentElement.style.overflow = ''; if (last) last.focus(); }
  links.forEach(function (a, i) { a.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(i); }); });
  box.querySelector('.lb-x').addEventListener('click', close);
  box.querySelector('.lb-p').addEventListener('click', function () { show(at - 1); });
  box.querySelector('.lb-n').addEventListener('click', function () { show(at + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'Tab') { var b = box.querySelectorAll('button'), f = b[0], l = b[b.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); } }
  });
})();
// Discourage casual saving: no right-click menu, long-press menu or drag-out on photographs.
(function () {
  function onPhoto(t) { return t && t.closest && t.closest('.work, .me, .lb, picture, img'); }
  document.addEventListener('contextmenu', function (e) { if (onPhoto(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (onPhoto(e.target)) e.preventDefault(); });
})();
// ---- Copy + image motion (ported from the Matt Cardle concept). Each plays once; nothing runs with reduced motion or without GSAP.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove('mjs'); return; }
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('m');
  var E = 'expo.out';
  var main = document.getElementById('main');
  if (!main) { root.classList.remove('mjs'); return; }

  // Split a heading into its rendered lines (measured), each in an overflow mask
  function splitLines(h) {
    if (!h.dataset.src) h.dataset.src = h.innerHTML;
    h.innerHTML = h.dataset.src;
    var toks = [];
    (function walk(node, it) { [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { n.textContent.split(/(\s+)/).forEach(function (w) { if (w.trim()) toks.push({ w: w, it: it }); }); }
      else if (n.nodeName === 'BR') { toks.push({ br: 1 }); }
      else walk(n, it || n.nodeName === 'EM');
    }); })(h, false);
    h.innerHTML = toks.map(function (t) { return t.br ? '<br>' : t.it ? '<em class="wd">' + t.w + '</em>' : '<span class="wd">' + t.w + '</span>'; }).join(' ');
    var lines = [], top = null;
    h.querySelectorAll('.wd').forEach(function (w) { var y = w.offsetTop; if (top === null || Math.abs(y - top) > 4) { lines.push([]); top = y; } lines[lines.length - 1].push(w.outerHTML); });
    h.innerHTML = lines.map(function (l) { return '<span class="ln"><span class="lni">' + l.join(' ') + '</span></span>'; }).join(' ');
  }
  function play(h, delay) {
    h.dataset.played = 1;
    var tl = gsap.timeline({ delay: delay });
    h.querySelectorAll('.lni').forEach(function (ln, i) {
      tl.fromTo(ln, { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: E }, i * .08);
      ln.querySelectorAll('em').forEach(function (em) { tl.fromTo(em, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: E }, i * .08 + .1); });
    });
  }
  var fadeIn = function (els, delay) { if (els.length) gsap.fromTo(els, { opacity: 0, y: 18, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: delay || 0, stagger: .1, clearProps: 'filter' }); };
  var settle = function (el, delay) { gsap.fromTo(el, { opacity: 0, letterSpacing: '.5em' }, { opacity: 1, letterSpacing: '.3em', duration: 1, ease: E, delay: delay || 0 }); };

  // Headings: lines rise out of a mask; the eyebrow above settles; the copy after it fades up out of a blur
  var heads = [].slice.call(main.querySelectorAll('h1:not(.eyebrow), h2:not(.eyebrow)'));
  var claimed = [];
  heads.forEach(function (h) {
    splitLines(h);
    gsap.set(h.querySelectorAll('.lni'), { yPercent: 105 });
    var prev = h.previousElementSibling, eyebrow = prev && prev.matches('.eyebrow') ? prev : null;
    var body = []; var n = h.nextElementSibling;
    while (n && !n.matches('.hang, h1, h2')) { body.push(n); n = n.nextElementSibling; }
    var btn = h.parentElement.nextElementSibling;
    if (h.parentElement.parentElement.matches('.cta') && btn && btn.matches('.btn')) body.push(btn);
    if (eyebrow) { gsap.set(eyebrow, { opacity: 0 }); claimed.push(eyebrow); }
    gsap.set(body, { opacity: 0 }); claimed = claimed.concat(body);
    ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: function () {
      if (eyebrow) settle(eyebrow);
      play(h, eyebrow ? .15 : 0);
      fadeIn(body, .45);
    } });
  });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { heads.forEach(function (h) { if (!h.dataset.played) { splitLines(h); gsap.set(h.querySelectorAll('.lni'), { yPercent: 105 }); } }); }, 200); });

  // Labels that stand alone (section eyebrows, fact headings) settle; the text beside them follows
  main.querySelectorAll('.eyebrow').forEach(function (e) {
    if (claimed.indexOf(e) > -1) return;
    var follow = [].slice.call(e.parentElement.children).filter(function (c) { return c !== e && !c.matches('.hang, figure'); });
    gsap.set(e, { opacity: 0 }); gsap.set(follow, { opacity: 0 }); claimed = claimed.concat(follow);
    ScrollTrigger.create({ trigger: e, start: 'top 88%', once: true, onEnter: function () { settle(e); fadeIn(follow, .3); } });
  });

  // Hairline rules draw left to right
  main.querySelectorAll('.cta, .facts').forEach(function (s) {
    gsap.set(s, { '--rx': 0 });
    ScrollTrigger.create({ trigger: s, start: 'top 88%', once: true, onEnter: function () { gsap.to(s, { '--rx': 1, duration: 1.1, ease: 'power3.inOut' }); } });
  });

  // Running copy: each paragraph or button fades up out of a blur as it arrives
  main.querySelectorAll('.teaser > *, .bio-text > p, .contact > p, .center').forEach(function (el) {
    if (claimed.indexOf(el) > -1) return;
    gsap.set(el, { opacity: 0 });
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { fadeIn([el]); } });
  });

  // Pull quote: read word by word, scrubbed to scroll; attribution follows
  var qp = main.querySelector('.quote p'), qa = main.querySelector('.quote footer');
  if (qp) {
    qp.innerHTML = qp.textContent.split(/(\s+)/).map(function (w) { return w.trim() ? '<span class="qw">' + w + '</span>' : w; }).join('');
    gsap.timeline({ scrollTrigger: { trigger: '.quote', start: 'top 80%', end: 'top 30%', scrub: .8 } })
      .fromTo(qp.querySelectorAll('.qw'), { opacity: .08, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)', stagger: .12, duration: .6, ease: 'none' })
      .fromTo(qa, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6 }, '>-.2');
  }

  // Photographs: each rises gently into place while the picture settles inside its frame; the caption follows. Rows stagger.
  var pics = [].slice.call(main.querySelectorAll('.work, .me')).filter(function (f) { return !f.matches('.hero-pic'); });
  pics.forEach(function (f) {
    var img = f.querySelector('img'), cap = f.querySelector('figcaption');
    if (f.matches('.hero-pic')) return; // hero photo stays still and visible so it paints straight away (phone speed)
    gsap.set(f, { opacity: 0, y: 36 }); if (img) gsap.set(img, { scale: 1.06 }); if (cap) gsap.set(cap, { opacity: 0, y: 8 });
  });
  ScrollTrigger.batch(pics, { start: 'top 92%', once: true, onEnter: function (batch) {
    batch.forEach(function (f, i) {
      var img = f.querySelector('img'), cap = f.querySelector('figcaption'), d = i * .12;
      gsap.to(f, { opacity: 1, y: 0, duration: 1.4, ease: E, delay: d });
      if (img) gsap.to(img, { scale: 1, duration: 2, ease: E, delay: d, clearProps: 'transform' });
      if (cap) gsap.to(cap, { opacity: 1, y: 0, duration: 1, ease: E, delay: d + .35 });
    });
  } });

  root.classList.remove('mjs');
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

// Weighted scrolling (Lenis): desktop with a mouse or trackpad only, off for reduced motion.
// Kept in step with GSAP ScrollTrigger so the scroll animations still fire at the right moment; paused while the lightbox is open.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return;
  var s = document.createElement('script'); s.src = '/assets/lenis.min.js'; s.async = true;
  s.onload = function () {
    if (!window.Lenis) return;
    var l = new Lenis({ duration: 1.3, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, smoothWheel: true, wheelMultiplier: .9 });
    window.__lenis = l;
    if (window.gsap && window.ScrollTrigger) {
      l.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { l.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
    } else { var raf = function (t) { l.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    var lb = document.querySelector('.lb');
    if (lb) new MutationObserver(function () { lb.hidden ? l.start() : l.stop(); }).observe(lb, { attributes: true, attributeFilter: ['hidden'] });
  };
  document.head.appendChild(s);
})();

// Back to top, and the name in the header glides back up when you are already on the home page
(function () {
  function up(e) {
    e.preventDefault();
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.8 });
    else scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  var t = document.querySelector('.totop'); if (t) t.addEventListener('click', up);
  var m = document.querySelector('.mark');
  if (m && (location.pathname === '/' || location.pathname === '/index.html')) m.addEventListener('click', up);
})();
