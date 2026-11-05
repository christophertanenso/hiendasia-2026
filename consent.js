/* HiEnd Asia 2026 – cookie consent (PDPA). build.py inlines this file into every page, after the gtag/fbq stubs.
   Categories: necessary (language, this choice: always on), analytics (GA4), marketing (Google Ads via the GA4
   link, Meta Pixel). Nothing optional loads until the visitor chooses. The choice is kept in localStorage
   ('hea-consent') with a version and date, and can be changed or withdrawn any time from "Cookie settings".
   Page config: window.HEA_CONSENT = { t: {translated strings}, privacy: 'privacy.html' }. */
(function () {
  var VERSION = 1, KEY = 'hea-consent', GA = 'G-NED2Z7D1C5', PIXEL = '9829555510477872';
  var cfg = window.HEA_CONSENT || {}, T = cfg.t || {};
  var choice = null, gaLoaded = false, metaLoaded = false;

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      return c && c.v === VERSION ? c : null;
    } catch (e) { return null; }
  }
  function write(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

  // Vendor scripts wait until the page has loaded and the browser is idle, so they never slow the first paint.
  function whenIdle(fn) {
    function go() { (window.requestIdleCallback || function (f) { setTimeout(f, 1); })(fn, { timeout: 3000 }); }
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
  function loadGa() {
    if (gaLoaded) return; gaLoaded = true;
    whenIdle(function () {
      var s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
      document.head.appendChild(s);
    });
  }
  function loadMeta() {
    if (metaLoaded || window.HEA_TEST) return; metaLoaded = true;
    whenIdle(function () {
      try { delete window.fbq; } catch (e) { window.fbq = undefined; }
      /* Meta's standard base code */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('consent', 'grant');
      window.fbq('init', PIXEL);
      window.fbq('track', 'PageView');
    });
  }
  // Withdrawal: tell the vendors, then remove the first-party cookies they set on this site.
  function clearCookies(pattern) {
    var host = location.hostname, parts = host.split('.'), domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('; domain=.' + parts.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!pattern.test(name)) return;
      domains.forEach(function (d) {
        ['/', location.pathname].forEach(function (p) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + p + d;
        });
      });
    });
  }
  function apply(c, before) {
    var g = function (on) { return on ? 'granted' : 'denied'; };
    gtag('consent', 'update', { analytics_storage: g(c.a), ad_storage: g(c.m), ad_user_data: g(c.m), ad_personalization: g(c.m) });
    if (c.a || c.m) loadGa();
    if (c.m) loadMeta();
    if (before) {
      if (before.a && !c.a) clearCookies(/^_ga/);
      if (before.m && !c.m) {
        clearCookies(/^(_gcl|_fbp|_fbc)/);
        if (metaLoaded && typeof window.fbq === 'function') window.fbq('consent', 'revoke');
      }
    }
  }
  function decide(a, m) {
    var before = choice;
    choice = { v: VERSION, a: !!a, m: !!m, at: new Date().toISOString() };
    write(choice);
    apply(choice, before);
    close();
    if (window.trackIntent) window.trackIntent('consent_choice', { analytics: choice.a ? 'yes' : 'no', marketing: choice.m ? 'yes' : 'no' });
  }

  // ---------- Banner ----------
  var box = null, lastFocus = null;
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function row(id, title, desc, on, locked) {
    return '<label class="cc-row"><span class="cc-txt"><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span>' +
      '<input type="checkbox" id="cc-' + id + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
      '<span class="cc-sw" aria-hidden="true"></span></label>';
  }
  function open(settings) {
    if (box) close(true);
    lastFocus = document.activeElement;
    var c = choice || { a: false, m: false };
    box = el('section', { 'class': 'cc' + (settings ? ' cc-open' : ''), role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'cc-h' },
      '<div class="cc-in">' +
        '<div class="cc-msg"><h2 id="cc-h">' + esc(T.title) + '</h2>' +
          '<p>' + esc(T.text) + ' <a href="' + esc(cfg.privacy || 'privacy.html') + '">' + esc(T.policy) + '</a></p></div>' +
        '<div class="cc-set" id="cc-set">' +
          row('n', T.necessary, T.necessaryD, true, true) +
          row('a', T.analytics, T.analyticsD, c.a) +
          row('m', T.marketing, T.marketingD, c.m) +
        '</div>' +
        '<div class="cc-btns">' +
          '<button type="button" class="cc-b cc-p" data-cc="all">' + esc(T.accept) + '</button>' +
          '<button type="button" class="cc-b" data-cc="none">' + esc(T.reject) + '</button>' +
          '<button type="button" class="cc-b cc-l" data-cc="settings" aria-expanded="' + (settings ? 'true' : 'false') + '" aria-controls="cc-set">' + esc(T.settings) + '</button>' +
          '<button type="button" class="cc-b cc-p cc-save" data-cc="save">' + esc(T.save) + '</button>' +
        '</div>' +
      '</div>');
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-cc]') : null;
      if (!b) return;
      var k = b.getAttribute('data-cc');
      if (k === 'all') decide(true, true);
      else if (k === 'none') decide(false, false);
      else if (k === 'save') decide(box.querySelector('#cc-a').checked, box.querySelector('#cc-m').checked);
      else if (k === 'settings') {
        var openNow = box.classList.toggle('cc-open');
        b.setAttribute('aria-expanded', String(openNow));
        if (openNow) box.querySelector('#cc-a').focus();
      }
    });
    box.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && choice) close(); });
    // Early in the document (right after the skip link), so keyboard and screen-reader users reach it first;
    // it is shown fixed at the bottom of the screen.
    var skip = document.querySelector('body > .skip');
    document.body.insertBefore(box, skip ? skip.nextSibling : document.body.firstChild);
    document.documentElement.classList.add('cc-showing');
    if (settings) box.querySelector('#cc-a').focus();
  }
  function close(silent) {
    if (!box) return;
    box.parentNode.removeChild(box); box = null;
    document.documentElement.classList.remove('cc-showing');
    if (!silent && lastFocus && lastFocus.focus && lastFocus !== document.body) { try { lastFocus.focus(); } catch (e) {} }
  }

  var CSS = '.cc{position:fixed;z-index:60;left:0;right:0;bottom:0;padding:0 max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));pointer-events:none}' +
    '.cc-in{pointer-events:auto;max-width:980px;margin:0 auto;background:var(--band,#201d17);color:var(--body,#ebebeb);border:1px solid var(--accent,#c6a661);border-radius:12px;padding:18px 20px;display:grid;gap:14px;box-shadow:0 -8px 40px rgba(0,0,0,.6);font:15px/1.6 var(--font-body,sans-serif);max-height:calc(100vh - 24px);overflow:auto}' +
    '.cc h2{margin:0 0 4px;font:700 17px/1.3 var(--font-display,sans-serif);color:var(--heading,#f0d9a0)}' +
    '.cc p{margin:0;color:var(--muted,#d2c8b4);font-size:14px}.cc a{color:var(--heading,#f0d9a0)}' +
    '.cc-set{display:none;flex-direction:column;gap:2px;border-top:1px solid var(--line,#4f4632);padding-top:10px}.cc-open .cc-set{display:flex}' +
    '.cc-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:8px 0;cursor:pointer;position:relative}' +
    '.cc-row b{display:block;color:var(--body,#ebebeb);font-size:14px}.cc-row small{display:block;color:var(--muted,#d2c8b4);font-size:13px;line-height:1.45}' +
    '.cc-row input{position:absolute;opacity:0;width:44px;height:26px;right:0;margin:0;cursor:pointer}' +
    '.cc-sw{width:44px;height:26px;border-radius:13px;background:#3a352b;border:1px solid var(--line,#4f4632);position:relative;transition:background .15s}' +
    '.cc-sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#bbb;transition:transform .15s}' +
    '.cc-row input:checked+.cc-sw{background:var(--accent,#c6a661)}.cc-row input:checked+.cc-sw::after{transform:translateX(18px);background:#000}' +
    '.cc-row input:disabled+.cc-sw{opacity:.6}.cc-row input:focus-visible+.cc-sw{outline:2px solid var(--accent,#c6a661);outline-offset:2px}' +
    '.cc-btns{display:flex;flex-wrap:wrap;gap:10px}' +
    '.cc-b{min-height:44px;padding:0 20px;border-radius:50px;border:1px solid var(--accent,#c6a661);background:transparent;color:var(--heading,#f0d9a0);font:700 13px/1 var(--font-display,sans-serif);letter-spacing:.06em;text-transform:uppercase;cursor:pointer;flex:1 1 auto}' +
    '.cc-p{background:var(--accent,#c6a661);color:#000}.cc-l{border-color:transparent;text-decoration:underline;text-underline-offset:3px;flex:0 1 auto}' +
    '.cc-save{display:none}.cc-open .cc-save{display:inline-flex;align-items:center;justify-content:center}.cc-open .cc-l{display:none}' +
    '@media (min-width:760px){.cc-in{grid-template-columns:1fr auto;align-items:center}.cc-set{grid-column:1/-1;order:2}.cc-btns{flex-wrap:nowrap}.cc-b{flex:0 0 auto}}' +
    '@media (prefers-reduced-motion:reduce){.cc-sw,.cc-sw::after{transition:none}}';

  function init() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    if (!choice) open(false);
    // Any element with data-consent-open (footer "Cookie settings", the privacy page) reopens the choices.
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-consent-open]') : null;
      if (!t) return;
      ev.preventDefault();
      open(true);
    });
  }

  choice = read();
  if (choice) apply(choice, null);
  window.HEA_CONSENT_OPEN = function () { open(true); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
