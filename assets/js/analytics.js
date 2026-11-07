/* Cookieless analytics hook (Umami or Plausible).
   Silent until one of those scripts is on the page. Counts clicks on
   anything with data-track="name"; data-track-place says where on the
   page the click happened (hero, prices, contact, sticky, nav ...). */
(function () {
  'use strict';
  function send(name, props) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(name, { props: props });
      } else if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track(name, props);
      }
    } catch (e) { /* analytics must never break the page */ }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (!el) return;
    send(el.getAttribute('data-track'), {
      lang: document.documentElement.lang || '',
      page: window.location.pathname,
      place: el.getAttribute('data-track-place') || ''
    });
  }, { capture: true, passive: true });
})();
