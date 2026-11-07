/* Sun Bay motion (port of the handoff's sunbay-motion.js, 7 Nov 2026): scroll reveals, parallax,
   pinned sideways scroll, scrollytelling steps, growing media, bars and loops. No dependencies.
   Everything stays at rest without JS and under prefers-reduced-motion.
   soul.js keeps the floats ([data-float]), the hero stickers' mouse depth and the videos
   (poster first, <video data-src> loaded after the page, playing only near the screen),
   so this file leaves those alone; the handoff's data-depth is data-zoom here.

   data-reveal="up|fade|mask|curtain|scale|left|right"  data-delay="0.1"
   data-parallax="0.1"   moves against the scroll (translateY)
   data-zoom="0.08"      image inside a clipped frame: parallax plus a slight zoom
   data-grow="24"        scales 0.86 -> 1 and its radius eases to the given px as it rises into view
   data-hscroll          tall box; a sticky child holds [data-track] that moves sideways; [data-hbar] shows progress
   data-steps            the [data-step] nearest the screen centre is lit; [data-part] with the same key lights too
                         (data-steps="swap": parts cross-fade, only the active one shows)
   data-bar="61"         width grows to 61% when visible
   data-marquee="40"     sideways loop, px per second (content written twice)
   data-vscroll="20"     vertical loop, px per second, negative runs down (content written twice)
   data-progress         page progress bar (scaleX)
   data-pulse="0.33"     radar ring: scales 0.18 -> 1 and fades out on a 2.6 s loop, the number is the phase
   data-typing="a|b|c"   types each phrase, holds it, erases it, then the next; the first one stays under
                         reduced motion (handoff update of 7 Nov 2026) */
(function () {
  'use strict';
  if (window.__sbMotion) return;
  window.__sbMotion = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var done = new WeakSet();
  var L = { par: [], zoom: [], grow: [], h: [], steps: [], mq: [], v: [], pr: [], pulse: [], typ: [] };
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 }) : null;
  // A mask starts fully clipped, and the browser counts its own clip-path, so it never reaches 4 % in
  // view and only the 1.2 s fallback showed it (measured 7 Nov 2026: every headline started ~1.2 s late).
  // Masks are watched with threshold 0 instead: any touch of the screen starts them.
  var ioMask = io ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); ioMask.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 }) : null;

  var HIDE = {
    up: { opacity: '0', transform: 'translate3d(0,60px,0)' },
    fade: { opacity: '0' },
    mask: { clipPath: 'inset(100% 0 0 0)', transform: 'translate3d(0,36px,0)' },
    curtain: { clipPath: 'inset(9% 7% 9% 7% round 36px)', transform: 'scale(1.03)' },
    scale: { opacity: '0', transform: 'scale(.93)' },
    left: { opacity: '0', transform: 'translate3d(-60px,0,0)' },
    right: { opacity: '0', transform: 'translate3d(60px,0,0)' }
  };
  var pending = new Set();
  function show(el) {
    pending.delete(el);
    el.style.opacity = '1';
    el.style.transform = 'none';
    if (el.style.clipPath) el.style.clipPath = 'inset(0 0 0 0 round 0px)';
  }
  function prep(el) {
    if (done.has(el)) return;
    done.add(el);
    if (reduce || !io || document.visibilityState === 'hidden') return;
    var kind = el.getAttribute('data-reveal') || 'up';
    var d = parseFloat(el.getAttribute('data-delay') || '0');
    var h = HIDE[kind] || HIDE.up;
    for (var k in h) el.style[k] = h[k];
    el.style.transition = 'opacity 1s ' + EASE + ' ' + d + 's, transform 1.25s ' + EASE + ' ' + d + 's, clip-path 1.35s ' + EASE + ' ' + d + 's';
    el.__t = Date.now();
    pending.add(el);
    el.__io = kind === 'mask' ? ioMask : io;
    el.__io.observe(el);
  }
  function prepBar(el) {
    if (done.has(el)) return;
    done.add(el);
    var to = el.getAttribute('data-bar') + '%';
    if (reduce || !io || document.visibilityState === 'hidden') { el.style.width = to; return; }
    el.style.width = '0%';
    el.style.transition = 'width 1.8s ' + EASE + ' ' + parseFloat(el.getAttribute('data-delay') || '0') + 's';
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { el.style.width = to; o.disconnect(); } });
    }, { threshold: 0.3 });
    o.observe(el);
  }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function fallback() {
    var vh = window.innerHeight, now = Date.now();
    pending.forEach(function (el) {
      if (now - el.__t < 1200) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) { show(el); if (el.__io) el.__io.unobserve(el); }
    });
  }
  function scan() {
    fallback();
    all('[data-reveal]').forEach(prep);
    all('[data-bar]').forEach(prepBar);
    L.par = all('[data-parallax]'); L.zoom = all('[data-zoom]'); L.grow = all('[data-grow]');
    L.h = all('[data-hscroll]'); L.steps = all('[data-steps]'); L.mq = all('[data-marquee]');
    L.v = all('[data-vscroll]'); L.pr = all('[data-progress]');
    L.pulse = all('[data-pulse]'); L.typ = all('[data-typing]');
    if (reduce) L.typ.forEach(function (el) {            // at rest: the first phrase, written out
      var first = el.getAttribute('data-typing').split('|')[0];
      if (el.textContent !== first) el.textContent = first;
    });
  }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function wide() { return window.innerWidth >= 1080; }
  function tick(t) {
    var vh = window.innerHeight;
    if (!reduce) {
      L.par.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        el.style.transform = 'translate3d(0,' + (-(r.top + r.height / 2 - vh / 2) * k).toFixed(1) + 'px,0)';
      });
      L.zoom.forEach(function (el) {
        var r = (el.parentElement || el).getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var k = parseFloat(el.getAttribute('data-zoom')) || 0.08;
        el.style.transform = 'translate3d(0,' + (-(r.top + r.height / 2 - vh / 2) * k).toFixed(1) + 'px,0) scale(1.16)';
      });
      L.grow.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = clamp((vh - r.top) / (vh * 0.9));
        var end = parseFloat(el.getAttribute('data-grow')) || 0;
        el.style.transform = 'scale(' + (0.86 + 0.14 * p).toFixed(4) + ')';
        el.style.borderRadius = Math.round(end + (48 - end) * (1 - p)) + 'px';
      });
      L.h.forEach(function (outer) {
        var track = outer.querySelector('[data-track]');
        if (!track) return;
        if (!wide()) { track.style.transform = ''; return; }    // narrow screens: a plain swipe row
        var r = outer.getBoundingClientRect();
        var total = outer.offsetHeight - vh;
        var p = total > 0 ? clamp(-r.top / total) : 0;
        var dist = track.scrollWidth - track.parentElement.clientWidth;
        track.style.transform = 'translate3d(' + (-Math.max(0, dist) * p).toFixed(1) + 'px,0,0)';
        var bar = outer.querySelector('[data-hbar]');
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      });
      L.mq.forEach(function (el) {
        var half = el.scrollWidth / 2; if (!half) return;
        var sp = parseFloat(el.getAttribute('data-marquee')) || 40;
        var off = (t / 1000 * Math.abs(sp) + window.scrollY * 0.6) % half;
        el.style.transform = 'translate3d(' + (sp > 0 ? -off : off - half).toFixed(1) + 'px,0,0)';
      });
      L.v.forEach(function (el) {
        var half = el.scrollHeight / 2; if (!half) return;
        var sp = parseFloat(el.getAttribute('data-vscroll')) || 20;
        var off = (t / 1000 * Math.abs(sp) + window.scrollY * 0.35) % half;
        el.style.transform = 'translate3d(0,' + (sp > 0 ? -off : off - half).toFixed(1) + 'px,0)';
      });
      L.pulse.forEach(function (el) {
        var q = (t / 2600 + (parseFloat(el.getAttribute('data-pulse')) || 0)) % 1;
        el.style.transform = 'scale(' + (0.18 + 0.82 * q).toFixed(3) + ')';
        el.style.opacity = (1 - q).toFixed(3);
      });
      L.typ.forEach(function (el) {
        var list = el.getAttribute('data-typing').split('|');
        var spans = list.map(function (p) { return p.length * 75 + 1600 + p.length * 35 + 300; });
        var total = spans.reduce(function (a, b) { return a + b; }, 0);
        var x = t % total, i = 0;
        while (x > spans[i]) { x -= spans[i]; i++; }
        var p = list[i], n;
        if (x < p.length * 75) n = Math.ceil(x / 75);
        else if (x < p.length * 75 + 1600) n = p.length;
        else n = Math.max(0, p.length - Math.ceil((x - p.length * 75 - 1600) / 35));
        var txt = p.slice(0, n) || '\u00a0';
        if (el.__txt !== txt) { el.__txt = txt; el.textContent = txt; }
      });
    }
    L.steps.forEach(function (g) {
      var steps = g.querySelectorAll('[data-step]');
      var best = null, bd = 1e9;
      steps.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - vh * 0.5);
        if (d < bd) { bd = d; best = s; }
      });
      var key = best ? best.getAttribute('data-step') : null;
      if (g.__key === key) return;
      g.__key = key;
      steps.forEach(function (s) { s.style.transition = 'opacity .6s ' + EASE; s.style.opacity = s === best ? '1' : '.26'; });
      var swap = g.getAttribute('data-steps') === 'swap';
      g.querySelectorAll('[data-part]').forEach(function (p) {
        var on = p.getAttribute('data-part') === key;
        if (swap) {
          p.style.transition = 'opacity .7s ' + EASE + ', transform 1.2s ' + EASE;
          p.style.opacity = on ? '1' : '0';
          p.style.transform = on ? 'scale(1)' : 'scale(1.08)';
          p.classList.toggle('is-on', on);
          return;
        }
        p.style.transition = 'opacity .6s ' + EASE + ', transform .6s ' + EASE + ', box-shadow .6s ' + EASE;
        p.style.opacity = on ? '1' : '.34';
        p.style.transform = on ? 'scale(1.025)' : 'none';
        p.style.boxShadow = on ? '0 0 0 3px currentColor' : 'none';
      });
    });
    var docH = document.documentElement.scrollHeight - vh;
    L.pr.forEach(function (el) { el.style.transform = 'scaleX(' + (docH > 0 ? clamp(window.scrollY / docH) : 0).toFixed(4) + ')'; });
    requestAnimationFrame(tick);
  }
  scan();
  setInterval(scan, 600);
  requestAnimationFrame(tick);
})();
