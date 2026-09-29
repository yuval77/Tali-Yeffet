/* ============================================================
   טלי יפת — one-pager behaviour
   ============================================================ */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     CONFIG — עדכני כאן פרטי יצירת קשר אמיתיים (מקום אחד)
     whatsapp: פורמט בינ״ל בלי + ובלי מקפים, לדוגמה 972501234567
     ----------------------------------------------------------- */
  var CONFIG = {
    whatsapp:        '972548118833',
    whatsappDisplay: '054-811-8833',
    whatsappMessage: 'היי טלי, הגעתי אלייך דרך האתר ואשמח לשמוע על תהליך עיצוב הפנים ולבדוק התאמה לפרויקט שלי',
    phone:           '054-811-8833',
    email:           'tyeffet@gmail.com',
    instagram:       'https://www.instagram.com/taliy_design/',
    instagramHandle: '@taliy_design',
    facebook:        'https://www.facebook.com/profile.php?id=100021155482963',
    pinterest:       'https://pinterest.com/taliyeffet', // TODO
    serviceArea:     'מרכז והשרון'                    // TODO
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applyConfig();
    $$('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    navSpy();
    reveal();
    heroVideo();
    heroShrink();
    heroRotator();
    deck();
    beforeAfter();
    pressScroller();
    contactFab();
    copyButtons();
  }

  /* ================= HERO VIDEO (loop; nudge play() if autoplay was blocked) ================= */
  function heroVideo() {
    var v = $('.hero__bg video');
    if (!v) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var tryPlay = function () { v.play().catch(function () {}); };
    tryPlay();
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(function (evt) {
      document.addEventListener(evt, tryPlay, { once: true, passive: true });
    });
  }

  /* ================= HERO SHRINK (video rounds into a bordered card as the extra scroll room is used) ================= */
  function heroShrink() {
    var pin = document.getElementById('heroPin');
    var hero = document.querySelector('.hero');
    if (!pin || !hero) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var ticking = false;
    function update() {
      ticking = false;
      // no pin, no extra scroll height: shrink is a plain function of how far the hero has
      // scrolled up, over a short fixed range, so it runs alongside normal scrolling and never
      // holds it up. The hero (100svh) keeps scrolling away at the same time.
      var range = Math.min(window.innerHeight * 0.85, 640);
      var rect = hero.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -rect.top / range));
      pin.style.setProperty('--hero-p', p.toFixed(4));
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ================= SPECIALTIES DECK (lassie.ai-style pinned card stack) ================= */
  // the stage is position:sticky inside the tall #deck track; here we only turn "how far through the
  // track" into p (0 = first card in front, n-1 = last card in front) and hand every item its
  // t = p - index. CSS does the rest. p eases toward the scroll target each frame, like a GSAP scrub.
  function deck() {
    var el = document.getElementById('deck');
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = $$('.deck__item', el);
    var n = items.length;
    if (n < 2) return;
    el.style.setProperty('--n', n);
    items.forEach(function (it, i) { it.style.zIndex = n - i; });   // first card on top of the pile
    el.classList.add('deck--live');

    var target = 0, current = 0, running = false;
    function measure() {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var hold = vh * 0.3;                            // keep in sync with the 30vh in .deck--live's height
      var travel = Math.max(1, rect.height - vh - hold);
      target = Math.min(1, Math.max(0, -rect.top / travel)) * (n - 1);
    }
    function paint() {
      items.forEach(function (it, i) { it.style.setProperty('--t', (current - i).toFixed(4)); });
    }
    function frame() {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0005) { current = target; running = false; }
      paint();
      if (running) requestAnimationFrame(frame);
    }
    function onScroll() {
      measure();
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();
    current = target;
    paint();

    // centre the intro (logo + heading + subtitle) in the empty space between the section's top edge
    // and the first card: same total space as the stylesheet gives, just split evenly above and below
    var section = document.getElementById('specialties');
    var head = section && $('.section-head', section);
    var stage = $('.deck__stage', el), frameEl = $('.deck__frame', el), cap = $('.deck__cap', items[0]);
    function balance() {
      if (!head) return;
      section.style.paddingTop = '';
      head.style.marginBottom = '';
      var top = parseFloat(getComputedStyle(section).paddingTop);
      var margin = parseFloat(getComputedStyle(head).marginBottom);
      // empty space inside the stage above the first thing shown: the card, or its caption when it sits on top (phones)
      var inStage = frameEl.getBoundingClientRect().top - stage.getBoundingClientRect().top + Math.min(0, cap.offsetTop);
      var half = (top + margin + inStage) / 2;
      section.style.paddingTop = half + 'px';
      head.style.marginBottom = Math.max(0, half - inStage) + 'px';
    }
    balance();
    window.addEventListener('resize', balance, { passive: true });
  }

  /* ================= BEFORE & AFTER CLIPS (play only while on screen) ================= */
  function beforeAfter() {
    var vids = $$('.ba video');
    if (!vids.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      vids.forEach(function (v) { v.setAttribute('controls', ''); });   // no autoplay: let people start them
      return;
    }
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.play().catch(function () {});
        else en.target.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ================= HERO ROTATOR (cycles the "how" line under the tagline) ================= */
  function heroRotator() {
    var track = document.getElementById('heroRotatorTrack');
    if (!track) return;
    var items = $$('.hero__rotator-item', track);
    if (items.length < 2) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % items.length;
      items.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
    }, 2600);
  }

  /* ================= COPY-TO-CLIPBOARD (contact footer) ================= */
  function copyButtons() {
    $$('[data-copy-field]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.dataset.copyField;
        var val = field === 'email' ? CONFIG.email : '';
        if (!val) return;
        var done = function () {
          btn.classList.add('copied');
          clearTimeout(btn._copyTimer);
          btn._copyTimer = setTimeout(function () { btn.classList.remove('copied'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = val;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          done();
        }
      });
    });
  }

  /* ================= CONFIG INTO DOM ================= */
  function applyConfig() {
    // opens the chat with the greeting above already typed in
    var waHref = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.whatsappMessage);
    $$('[data-wa]').forEach(function (a) {
      a.setAttribute('href', waHref);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    setText('whatsappDisplay', CONFIG.whatsappDisplay);
    setText('phone', CONFIG.phone);
    setText('email', CONFIG.email);
    setText('instagramDisplay', CONFIG.instagramHandle);
    setText('serviceArea', CONFIG.serviceArea);

    hrefFor('tel', 'tel:' + CONFIG.phone.replace(/[^\d+]/g, ''));
    hrefFor('mailto', 'mailto:' + CONFIG.email);
    hrefFor('instagram', CONFIG.instagram);
    hrefFor('facebook', CONFIG.facebook);
    hrefFor('pinterest', CONFIG.pinterest);
  }
  function setText(field, val) {
    var el = $('[data-field="' + field + '"]');
    if (el) el.textContent = val;
  }
  function hrefFor(key, href) {
    var el = $('[data-field-href="' + key + '"]');
    if (el) el.setAttribute('href', href);
  }

  /* ================= NAV ACTIVE STATE ================= */
  function navSpy() {
    var links = $$('#nav a');
    var map = {};
    links.forEach(function (a) { var h = a.getAttribute('href'); if (h.charAt(0) === '#') map[h.slice(1)] = a; });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('active'); });
        var link = map[en.target.id];
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ================= REVEAL ON SCROLL ================= */
  function reveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) ||
        location.search.indexOf('flat') > -1 ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ================= WHATSAPP BUTTON (hides inside the contact section) ================= */
  function contactFab() {
    var contact = document.getElementById('contact');
    if (!contact) return;
    // a plain scroll check: the button pops away once the footer's top is 20% up into the screen
    var update = function () {
      var top = contact.getBoundingClientRect().top;
      document.body.classList.toggle('at-contact', top < window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ================= PRESS SCAN (mobile: swipe it sideways) ================= */
  // the scan sits in a sideways-scrolling strip; make sure it starts at its right end (RTL start),
  // i.e. with the left part of the scan hidden, and let the visitor swipe from there
  function pressScroller() {
    var fig = $('.press__figure');
    if (!fig) return;
    var img = $('img', fig);
    function toStart() { fig.scrollLeft = 0; }
    if (img && !img.complete) img.addEventListener('load', toStart, { once: true });
    toStart();
  }
})();
