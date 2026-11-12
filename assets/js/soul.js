/* Sun Bay Pictures, "Soul Playground": the hero's life (stickers that float, sway and lean
   towards the mouse), videos after the page, accordions, approve cards, the trade picker,
   the ad switches, the profile check, the mobile menu, the sticky book bar and the demo bar.
   No dependencies. Nothing is stored or sent, except the demo bar's own placeholder
   setting on this device, and the check's list when the owner taps send. Under reduced motion nothing moves and no video plays. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // ---- demo bar: placeholders on or off (same setting as the other pages)
  function syncPh() {
    var state = root.classList.contains('ph-off') ? 'off' : 'on';
    $$('[data-set="ph"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.val === state)); });
  }
  syncPh();
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set="ph"]');
    if (!b) return;
    root.classList.toggle('ph-off', b.dataset.val === 'off');
    try { localStorage.setItem('sbp-ph', b.dataset.val); } catch (err) { /* private mode */ }
    syncPh();
  });

  // ---- demo bar: demo images on or off (his ask, 7 Nov 2026), kept on this device like the placeholders.
  // Off, every demo photo and video gives way to its empty template (soul.css, html.demo-off).
  function syncDemo() {
    var state = root.classList.contains('demo-off') ? 'off' : 'on';
    $$('[data-set="demo"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.val === state)); });
  }
  syncDemo();
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set="demo"]');
    if (!b) return;
    root.classList.toggle('demo-off', b.dataset.val === 'off');
    try { localStorage.setItem('sbp-demo', b.dataset.val); } catch (err) { /* private mode */ }
    syncDemo();
  });

  // ---- floating stickers. Each [data-float] box bobs (sin, 7 px), sways (data-wobble degrees),
  // and, when it has data-depth, leans with the mouse and drifts up as the page scrolls.
  // Only boxes on screen are moved; the loop stops when none are.
  var floats = $$('[data-float]');
  if (floats.length && !reduce && hasIO) {
    var live = [], raf = 0, t0 = performance.now();
    var mx = 0, my = 0, cx = 0, cy = 0;
    var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      window.addEventListener('pointermove', function (e) {
        mx = e.clientX / window.innerWidth * 2 - 1;
        my = e.clientY / window.innerHeight * 2 - 1;
      }, { passive: true });
    }
    var frame = function (now) {
      var t = now - t0, sy = window.scrollY;
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      for (var i = 0; i < live.length; i++) {
        var el = live[i], d = el._depth;
        var x = -cx * 18 * d;
        var y = Math.sin(t / 1400 + el._phase) * 7 - cy * 12 * d - sy * 0.07 * d;
        var r = Math.sin(t / 2300 + el._phase * 1.3) * el._wobble;
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + r.toFixed(2) + 'deg)';
      }
      raf = live.length ? requestAnimationFrame(frame) : 0;
    };
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = live.indexOf(e.target);
        if (e.isIntersecting && i < 0) live.push(e.target);
        if (!e.isIntersecting && i >= 0) live.splice(i, 1);
      });
      if (live.length && !raf) raf = requestAnimationFrame(frame);
    });
    floats.forEach(function (el) {
      el._phase = parseFloat(el.getAttribute('data-float')) || 0;
      el._depth = parseFloat(el.getAttribute('data-depth')) || 0;
      el._wobble = parseFloat(el.getAttribute('data-wobble')) || 0.6;
      fio.observe(el);
    });
  }

  // ---- the page change (7 Nov 2026; his word: "full screen setti animaatio ja vaihtuu värimaailma sub pagen
  // värimaailmaksi"). A click on a link to another of our pages sweeps that page's colours up the screen
  // with its name (soul.css .pt.is-in), then goes. The next page starts under its own ground (html.pt-arrive, set
  // before paint from sessionStorage) and lifts it. Modified clicks, other sites and same-page anchors are
  // left alone; nothing of this runs under reduced motion.
  var ptEl = $('.pt'), ptMap = null, ptGo = 0;
  try { ptMap = JSON.parse(document.getElementById('pt-map').textContent); } catch (e) { ptMap = null; }
  var sbRoot = document.querySelector('meta[name="sb-root"]');   // the review copy (tools/artifact.py): bundle paths
  if (ptMap && sbRoot) {
    var rootUrl = new URL(sbRoot.getAttribute('content'), location.href), resolved = {};
    Object.keys(ptMap).forEach(function (k) { resolved[new URL(k, rootUrl).pathname] = ptMap[k]; });
    ptMap = resolved;
  }
  if (ptEl && ptMap && !reduce) {
    document.addEventListener('click', function (e) {
      if (ptGo || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      var d = ptMap[u.pathname];
      if (!d) return;
      e.preventDefault();
      ['a1', 'a2', 'bg', 'fg', 'lc'].forEach(function (k) { ptEl.style.setProperty('--pt-' + k, d[k]); });
      $('.pt__lab span', ptEl).textContent = './' + d.lab;
      $('.pt__t span', ptEl).innerHTML = d.t;              // our own build-time markup (build.py pt_title)
      document.documentElement.classList.remove('pt-arrive');
      ptEl.classList.remove('is-in');
      void ptEl.offsetWidth;
      ptEl.classList.add('is-in');
      try { sessionStorage.setItem('sb-pt', '1'); } catch (err) {}
      ptGo = setTimeout(function () { location.href = u.href; }, 780);
    });
    window.addEventListener('pageshow', function (e) {      // back to this page from the cache: open it again
      if (!e.persisted) return;
      clearTimeout(ptGo); ptGo = 0;
      ptEl.classList.remove('is-in');
      try { sessionStorage.removeItem('sb-pt'); } catch (err) {}
    });
  }
  if (document.documentElement.classList.contains('pt-arrive')) {
    setTimeout(function () { document.documentElement.classList.remove('pt-arrive'); }, 1750);
  }

  // ---- the home hero's lean toward the mouse (Hero v2, 7 Nov 2026): each [data-mouse] layer moves up to
  // 18 x 12 px times its factor toward the cursor, eased 0.08 a frame; the soft back layer (negative factor)
  // moves the other way. Only with a fine pointer, never under reduced motion.
  var lean = $$('[data-mouse]'), leanBox = $('.top--v2');
  if (lean.length && leanBox && !reduce && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var ltx = 0, lty = 0, lx = 0, ly = 0, lraf = 0;
    var leanStep = function () {
      lx += (ltx - lx) * 0.08;
      ly += (lty - ly) * 0.08;
      lean.forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-mouse')) || 1;
        el.style.transform = 'translate3d(' + (lx * 18 * k).toFixed(2) + 'px,' + (ly * 12 * k).toFixed(2) + 'px,0)';
      });
      lraf = (Math.abs(ltx - lx) > 0.001 || Math.abs(lty - ly) > 0.001) ? requestAnimationFrame(leanStep) : 0;
    };
    var leanKick = function () { if (!lraf) lraf = requestAnimationFrame(leanStep); };
    leanBox.addEventListener('pointermove', function (e) {
      var r = leanBox.getBoundingClientRect();
      ltx = (e.clientX - r.left) / r.width * 2 - 1;
      lty = (e.clientY - r.top) / r.height * 2 - 1;
      leanKick();
    }, { passive: true });
    leanBox.addEventListener('pointerleave', function () { ltx = 0; lty = 0; leanKick(); });
  }

  // ---- videos: posters paint first; <video data-src> loads after the page, plays near the screen
  var vids = $$('video[data-src]');
  var startVideo = function (v) {
    if (v.hasAttribute('data-src')) { v.src = v.getAttribute('data-src'); v.removeAttribute('data-src'); }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
  };
  if (vids.length && !reduce && hasIO) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) startVideo(e.target);
        else if (!e.target.paused) e.target.pause();
      });
    }, { rootMargin: '200px 0px' });
    var watch = function () { vids.forEach(function (v) { vio.observe(v); }); };
    if (document.readyState === 'complete') watch(); else window.addEventListener('load', watch);
  }

  // ---- accordions (.pb): one row open per group, the whole row is clickable
  $$('.pb').forEach(function (group) {
    var rows = $$('.pb-row', group);
    var setRow = function (row, open) {
      row.classList.toggle('is-open', open);
      var b = $('.pb-title button', row);
      if (b) b.setAttribute('aria-expanded', String(open));
      var tog = $('.pb-tog', row);
      if (tog) tog.textContent = open ? '–' : '+';
    };
    rows.forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var open = !row.classList.contains('is-open');
        rows.forEach(function (r) { setRow(r, false); });
        if (open) setRow(row, true);
      });
    });
  });

  // ---- questions on the sub-pages: one open at a time, the first open on load
  $$('[data-acc]').forEach(function (group) {
    var rows = $$('.acc__row', group);
    rows.forEach(function (row) {
      var b = $('.acc__q button', row);
      b.addEventListener('click', function () {
        var open = !row.classList.contains('is-open');
        rows.forEach(function (r) {
          r.classList.remove('is-open');
          $('.acc__q button', r).setAttribute('aria-expanded', 'false');
        });
        if (open) { row.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  // ---- packages: build your own. The total follows the picks; nothing is stored or sent.
  $$('[data-build]').forEach(function (box) {
    var show = box.getAttribute('data-show') === '1';
    var eur = function (n) { return show ? '€' + n.toLocaleString('en-US') : '€ ···'; };
    var tiers = $$('[data-tier]', box), adds = $$('[data-add]', box);
    var totalEl = $('[data-total]', box), linesEl = $('[data-lines]', box);
    var launchEl = $('[data-launch]', box);
    var vlabel = box.getAttribute('data-video-label');
    var paint = function () {
      var on = tiers.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      var tp = on ? +on.getAttribute('data-tier') : 0, sum = tp, lines = [];
      if (tp) lines.push([vlabel, tp]);
      adds.forEach(function (b) {
        b.disabled = b.hasAttribute('data-needs-video') && !tp;
        if (b.disabled) b.setAttribute('aria-pressed', 'false');
        if (b.getAttribute('aria-pressed') === 'true') {
          var pr = +b.getAttribute('data-add');
          sum += pr; lines.push([b.getAttribute('data-label'), pr]);
        }
      });
      totalEl.textContent = eur(sum);
      // the launch price: with video and Google in the picks, Google is free for 12 months (his brief, 7 Nov 2026)
      var g = adds.filter(function (b) { return b.hasAttribute('data-google') && b.getAttribute('aria-pressed') === 'true'; })[0];
      if (launchEl) {
        launchEl.hidden = !(tp && g);
        if (tp && g) launchEl.textContent = launchEl.getAttribute('data-launch').replace('{p}', eur(sum - +g.getAttribute('data-add')));
      }
      linesEl.textContent = '';
      lines.forEach(function (l) {
        var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('i');
        a.textContent = l[0]; b.textContent = eur(l[1]); li.appendChild(a); li.appendChild(b); linesEl.appendChild(li);
      });
    };
    tiers.forEach(function (b) {
      b.addEventListener('click', function () {
        tiers.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        paint();
      });
    });
    adds.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
        paint();
      });
    });
    paint();
  });

  // ---- approve cards: decorative toggles, nothing is stored or sent
  $$('[data-approve]').forEach(function (card) {
    var btn = $('.approve__btn', card), line = $('.approve__time', card);
    if (!btn) return;
    var first = { line: line ? line.textContent : '', btn: btn.textContent };
    btn.addEventListener('click', function () {
      var ok = !card.classList.contains('is-ok');
      card.classList.toggle('is-ok', ok);
      btn.textContent = ok ? card.getAttribute('data-ok-btn') : first.btn;
      if (line) line.textContent = ok ? card.getAttribute('data-ok-time') : first.line;
      btn.setAttribute('aria-pressed', String(ok));
    });
  });

  // ---- trade picker (social page): one list of moments per trade
  $$('[data-trades]').forEach(function (box) {
    var btns = $$('[data-trade]', box), lists = $$('[data-shots]', box);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-trade');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        lists.forEach(function (l) { l.hidden = l.getAttribute('data-shots') !== k; });
      });
    });
  });

  // ---- switches (ads page): Meta's AI extras switch off one by one when the card comes into view
  $$('[data-switches]').forEach(function (box) {
    if (reduce || !hasIO) { box.classList.add('is-run'); return; }
    var sio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { box.classList.add('is-run'); sio.disconnect(); }
    }, { threshold: 0.5 });
    sio.observe(box);
  });

  // ---- before and after (Google page, design of 7 Nov 2026): the tabs pick the place, the range input over
  // the picture moves the line between the Before and After screenshots. Without JS all four show, split in half.
  $$('[data-gba]').forEach(function (box) {
    var tabs = $$('[data-ba-tab]', box), panels = $$('[data-ba-panel]', box);
    var pick = function (i) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-pressed', String(i === j)); });
      panels.forEach(function (p, j) { p.hidden = i !== j; });
    };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { pick(i); }); });
    if (tabs.length) pick(0);
    $$('[data-ba]', box).forEach(function (cmp) {
      var r = $('.gba__range', cmp);
      if (!r) return;
      var set = function () { cmp.style.setProperty('--pos', r.value + '%'); };
      r.addEventListener('input', set);
      set();
    });
  });

  // ---- Meta's AI extras (ads page, design of 7 Nov 2026): each switch shows or hides one extra on the ad.
  // They start on and switch off one by one (450 ms apart) when the box comes into view; the replay link
  // turns them back on and off again. Without JS, and under reduced motion, the ad starts clean.
  $$('[data-aifx]').forEach(function (box) {
    var sws = $$('[data-sw]', box), timers = [];
    var onEl = $('[data-fx-on]', box), cleanEl = $('[data-fx-clean]', box), onText = box.getAttribute('data-on') || '';
    var set = function (i, on) {
      sws[i].setAttribute('aria-pressed', String(on));
      var fx = $('[data-fx="' + i + '"]', box);
      if (fx) fx.classList.toggle('is-on', on);
      var n = sws.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      if (onEl) { onEl.textContent = onText.replace('{n}', n); onEl.hidden = !n; }
      if (cleanEl) cleanEl.hidden = !!n;
    };
    var stop = function () { timers.forEach(clearTimeout); timers = []; };
    var off = function (start) {
      stop();
      timers = sws.map(function (_b, i) { return setTimeout(function () { set(i, false); }, start + i * 450); });
    };
    sws.forEach(function (b, i) {
      b.addEventListener('click', function () { stop(); set(i, b.getAttribute('aria-pressed') !== 'true'); });
    });
    var replay = $('[data-replay]', box);
    if (replay) replay.addEventListener('click', function () { sws.forEach(function (_b, i) { set(i, true); }); off(1600); });
    if (reduce || !hasIO) return;
    sws.forEach(function (_b, i) { set(i, true); });
    var aio = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      aio.disconnect();
      off(900);
    }, { threshold: 0.35 });
    aio.observe(box);
  });

  // ---- the profile check (Google page, "Now look at yours"): six taps, one question at a time.
  // The card beside it takes each answer. The answers stay in this page's memory and are gone on
  // refresh; the list goes into the WhatsApp or email link only when the owner taps it.
  var pc = $('.pcheck'), pcCopy = document.getElementById('check-copy');
  if (pc && pcCopy) {
    var T = JSON.parse(pcCopy.textContent);
    var pqs = $$('.pq', pc), pres = $('.pcheck__result', pc), pdots = $$('.pcheck__dots i', pc);
    var pback = $('[data-check="back"]', pc), parts = {};
    $$('[data-el]', pc).forEach(function (el) { parts[el.getAttribute('data-el')] = el; });
    var ans = {}, cur = 0, busy = false;
    pback.lastElementChild.textContent = T.back;
    var paint = function () {
      Object.keys(parts).forEach(function (k) { parts[k].setAttribute('data-v', ans[k] || ''); });
    };
    var show = function (i) {
      var first = pc.getAttribute('data-state') === 'idle';
      cur = i;
      pc.setAttribute('data-state', 'asking');
      pres.hidden = true;
      pqs.forEach(function (q, k) { q.classList.toggle('is-current', k === i); });
      $('.pq__scan', pqs[i]).textContent = '';
      pdots.forEach(function (d, k) { d.classList.toggle('is-on', k <= i); });
      Object.keys(parts).forEach(function (k) { parts[k].classList.toggle('is-now', k === pqs[i].getAttribute('data-key')); });
      paint();
      pback.hidden = i === 0;
      $('legend', pqs[i]).focus({ preventScroll: true });
      if (first) pc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    };
    var groups = function () {
      var g = { no: [], unsure: [], yes: [] };
      T.items.forEach(function (it) { g[ans[it[0]] || 'yes'].push(it); });
      return g;
    };
    var row = function (now, then, cls) {
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + now + '</td><td>' + then + '</td></tr>';
    };
    var result = function () {
      var g = groups(), n = g.no.length, m = g.unsure.length, head, sub = '';
      if (!n && !m) { head = T.all; sub = T.allsub; }
      else if (n) {
        head = (n === 1 ? T.n1 : T.nN).replace('{n}', n);
        if (m) sub = (m === 1 ? T.madd1 : T.maddN).replace('{m}', m);
      } else head = (m === 1 ? T.monly1 : T.monlyN).replace('{m}', m);
      $('.pres__head', pres).textContent = head;
      $('.pres__sub', pres).textContent = sub;
      $('.vs tbody', pres).innerHTML =
        g.no.map(function (it) { return row(it[2], T.fix[it[0]]); }).join('') +
        g.unsure.map(function (it) { return row(it[3] + ': ' + T.unsure, T.fix[it[0]], 'is-unsure'); }).join('') +
        row('<span class="ph">' + T.who[0] + '</span>', T.who[1], 'is-who');
      $('.vs', pres).hidden = !(n + m);
      Object.keys(parts).forEach(function (k) { parts[k].classList.remove('is-now'); });
      pc.setAttribute('data-state', 'result');
      pres.hidden = false;
      pres.focus({ preventScroll: true });
    };
    var answer = function (i, v) {
      if (busy || pc.getAttribute('data-state') !== 'asking') return;
      busy = true;
      var q = pqs[i], key = q.getAttribute('data-key'), wait = reduce ? 150 : 380;
      ans[key] = v;
      paint();
      parts[key].classList.remove('is-now');
      if (i < 2 && v !== 'unsure') { $('.pq__scan', q).textContent = T['s' + (i + 1) + v]; wait = 1500; }
      setTimeout(function () { busy = false; if (i < pqs.length - 1) show(i + 1); else result(); }, wait);
    };
    var reset = function () {
      ans = {};
      $$('input', pc).forEach(function (r) { r.checked = false; });
      show(0);
    };
    var listText = function () {
      var lines = [T.clip];
      [['no', T.clipfix, 2], ['unsure', T.cliptog, 3], ['yes', T.clipgood, 3]].forEach(function (r) {
        groups()[r[0]].forEach(function (it) { lines.push(r[1] + ': ' + it[r[2]]); });
      });
      lines.push(T.place);
      return lines.join('\n');
    };
    var idx = function (inp) { return +inp.closest('.pq').getAttribute('data-q') - 1; };
    $('.pcheck__form', pc).addEventListener('submit', function (e) { e.preventDefault(); });
    pc.addEventListener('click', function (e) {
      var inp = e.target.closest('.pq__opt input');
      if (inp) { answer(idx(inp), inp.value); return; }
      var s = e.target.closest('[data-send]');
      if (s) {                                   // the answers leave the page only here, on the owner's own tap
        var text = encodeURIComponent(listText());
        s.href = s.href.split('?')[0] + (s.getAttribute('data-send') === 'wa' ? '?text=' + text
          : '?subject=' + encodeURIComponent(T.subject) + '&body=' + text);
        return;
      }
      var b = e.target.closest('[data-check]');
      if (!b) return;
      var a = b.getAttribute('data-check');
      if (a === 'start') show(0);
      else if (a === 'again') reset();
      else if (a === 'back' && cur > 0) show(cur - 1);
    });
    // arrows move between the answers without choosing; Enter chooses
    pc.addEventListener('keydown', function (e) {
      var inp = e.target.closest && e.target.closest('.pq__opt input');
      if (!inp) return;
      var list = $$('input', inp.closest('.pq__opts')), k = list.indexOf(inp), n = list.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); list[(k + 1) % n].focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); list[(k + n - 1) % n].focus(); }
      else if (e.key === 'Enter') { e.preventDefault(); inp.checked = true; answer(idx(inp), inp.value); }
    });
  }

  // ---- mobile menu and the sticky book bar
  var menuBtn = $('.nav__menu'), menu = $('#menu'), sticky = $('.sticky'), book = $('#book');
  var menuOpen = false, bookIn = false, checkIn = false, navWake = null;
  var updateSticky = function () {
    if (!sticky) return;
    sticky.classList.toggle('is-on', window.scrollY > 640 && !bookIn && !checkIn && !menuOpen);
  };
  var setMenu = function (open, focusBack) {
    if (!menuBtn || !menu) return;
    menuOpen = open;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? menuBtn.getAttribute('data-close') : menuBtn.getAttribute('data-open');
    updateSticky();
    if (open && navWake) navWake();
    if (!open && focusBack) menuBtn.focus();
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen, false); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false, false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false, true); });
    if (window.matchMedia) {
      var wide = matchMedia('(min-width: 900px)');
      var onWide = function () { if (wide.matches && menuOpen) setMenu(false, false); };
      if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
    }
  }
  // ---- the top bar, the capsule (7 Nov 2026, evening). His ask: "kun scrollaa alas niin se menee pieneksi ...
  // ja sitten ylös niin laajenee taas. tasokas"; of the two demos he chose "A kapseli". The bar sticks at the
  // top like a sticky element. Scrolling down draws it into a capsule in the middle with the sb. icon and the
  // book button (is-small); scrolling up opens it, and so do keyboard focus, a tap on the shape and the menu.
  // The shape is two layers that meet in the middle: this sets their edges; content moves by transform only.
  var navBox = $('.navbox'), navFloat = navBox && $('.navfloat', navBox);
  var navEl = navFloat && $('.nav, .spnav', navFloat);
  if (navBox && navFloat && navEl) {
    var isSub = navEl.classList.contains('spnav');
    var FIX = isSub ? 14 : 8;               // the bar's top once it floats (the navfloat's padding-top)
    var SC = .92;                           // the book or menu button when the bar is small
    var bgL = $('.nav__bgl', navEl), bgR = $('.nav__bgr', navEl);
    var brandEl = $('.brand, .spnav__brand', navEl), iconEl = $('.sbi', navEl);
    var bookEl = $('.nav__book, .spnav__book', navEl), menuEl = $('.nav__menu', navEl);
    var linkEls = $$('.nav__links a, .spnav__links a', navEl), mid = (linkEls.length - 1) / 2;
    linkEls.forEach(function (a, i) {           // the links come back from the middle out
      a.style.setProperty('--i', String(Math.abs(i - mid)));
    });
    var inOff = 0, lastY = window.scrollY, acc = 0, navRaf = 0, hover = false, leaveT = 0, wentDown = false, g = null;
    var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    var shown = function (el) { return !!el && getComputedStyle(el).display !== 'none'; };
    var measure = function () {
      if (!navBox.classList.contains('is-floating')) {
        navBox.style.height = '';
        navBox.style.height = navBox.offsetHeight + 'px';
        inOff = navEl.getBoundingClientRect().top - navBox.getBoundingClientRect().top;
      }
      var act = shown(bookEl) ? bookEl : menuEl, r = navEl.getBoundingClientRect();
      g = { W: navEl.clientWidth, vl: r.left, vr: document.documentElement.clientWidth - r.right,
            bl: brandEl.offsetLeft, iw: iconEl ? iconEl.offsetWidth : brandEl.offsetWidth,
            act: act, al: act.offsetLeft, aw: act.offsetWidth };
      if (bookEl && act !== bookEl) bookEl.style.transform = '';
      if (menuEl && act !== menuEl) menuEl.style.transform = '';
    };
    var box = function (el, l, r, t, b, rad) {
      var s = el.style;
      s.left = l + 'px'; s.right = r + 'px'; s.top = t + 'px'; s.bottom = b + 'px'; s.borderRadius = rad;
    };
    var apply = function () {
      if (!g) measure();
      var small = navBox.classList.contains('is-floating') && navBox.classList.contains('is-small');
      var W = g.W, half = Math.round(W / 2), bs = brandEl.style, as = g.act.style;
      if (!small) {                           // open: the home's pill, or a bar from edge to edge on a sub-page
        var o = isSub ? 0 : 999, t0 = isSub ? -FIX : 0, l0 = isSub ? -g.vl : 0, r0 = isSub ? -g.vr : 0;
        box(bgL, l0, W - half - 1, t0, t0, o + 'px 0 0 ' + o + 'px');
        box(bgR, half - 1, r0, t0, t0, '0 ' + o + 'px ' + o + 'px 0');
        bs.transform = ''; as.transform = '';
        return;
      }
      var ts = isSub ? -4 : 4, rad = 26;      // small: 52 px tall on every page
      var padL = 16, gap = 12, padR = 6;     // the capsule: the sb. icon and the button, centred
      var capW = padL + g.iw + gap + g.aw * SC + padR, capL = Math.round((W - capW) / 2), capR = Math.round(capL + capW);
      box(bgL, capL, W - half - 1, ts, ts, rad + 'px 0 0 ' + rad + 'px');
      box(bgR, half - 1, W - capR, ts, ts, '0 ' + rad + 'px ' + rad + 'px 0');
      bs.transform = 'translateX(' + (capL + padL - g.bl) + 'px)';
      as.transform = 'translateX(' + (capR - padR - g.al - g.aw) + 'px) scale(' + SC + ')';
    };
    var setSmall = function (on) {
      if (navBox.classList.contains('is-small') === on) return;
      navBox.classList.toggle('is-small', on);
      apply();
    };
    var navTick = function () {
      navRaf = 0;
      var y = window.scrollY, dy = y - lastY;
      lastY = y;
      var top = navBox.getBoundingClientRect().top + inOff;
      var floating = navBox.classList.contains('is-floating');
      if (!floating && top <= FIX) {
        navBox.classList.add('is-floating'); floating = true; apply();
      } else if (floating && top > FIX) {
        navBox.classList.remove('is-floating', 'is-small'); floating = false; apply();
      }
      if (!floating) { acc = 0; return; }
      if (dy && (dy > 0) !== (acc > 0)) acc = 0;
      acc += dy;
      if (acc > 12) { wentDown = true; if (!menuOpen && !hover) setSmall(true); }
      else if (acc < -12) { wentDown = false; setSmall(false); }
    };
    navWake = function () { setSmall(false); };
    if (fine) {                               // the bar never changes under the pointer; hover does not open the
      navEl.addEventListener('pointerover', function () {   // capsule, or the button would run from the pointer
        hover = true; clearTimeout(leaveT);
      });
      navEl.addEventListener('pointerout', function (e) {
        if (e.relatedTarget && navEl.contains(e.relatedTarget)) return;
        hover = false; clearTimeout(leaveT);
        leaveT = setTimeout(function () {
          if (wentDown && !menuOpen && navBox.classList.contains('is-floating') && !navEl.contains(document.activeElement)) setSmall(true);
        }, 600);
      });
    }
    navEl.addEventListener('focusin', function (e) {   // the keyboard opens it; a mouse click must not move the button
      var kb = true;
      try { kb = e.target.matches(':focus-visible'); } catch (err) { /* older browsers: open it */ }
      if (kb) setSmall(false);
    });
    [bgL, bgR].forEach(function (el) { el.addEventListener('click', function () { setSmall(false); }); });
    measure(); apply();
    window.addEventListener('resize', function () { g = null; measure(); apply(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { g = null; measure(); apply(); });
    window.addEventListener('scroll', function () { if (!navRaf) navRaf = requestAnimationFrame(navTick); }, { passive: true });
    navTick();
  }

  var checkBox = $('.pcheck');   // the check has its own book and send buttons; the bar would cover them
  if (checkBox && hasIO) {
    new IntersectionObserver(function (entries) { checkIn = entries[0].isIntersecting; updateSticky(); }).observe(checkBox);
  }
  if (book && hasIO) {
    new IntersectionObserver(function (entries) { bookIn = entries[0].isIntersecting; updateSticky(); }).observe(book);
  }
  window.addEventListener('scroll', updateSticky, { passive: true });
  updateSticky();
})();
