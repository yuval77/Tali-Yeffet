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
    phone:           '054-811-8833',
    email:           'tyeffet@gmail.com',
    instagram:       'https://www.instagram.com/taliy_design/',
    instagramHandle: '@taliy_design',
    facebook:        'https://www.facebook.com/profile.php?id=100021155482963',
    pinterest:       'https://pinterest.com/taliyeffet', // TODO
    serviceArea:     'מרכז והשרון'                    // TODO
  };

  /* ---------- galleries ---------- */
  function seq(prefix, n, pad) {
    var a = [];
    for (var i = 1; i <= n; i++) {
      var num = String(i);
      if (pad) while (num.length < 2) num = '0' + num;
      a.push(prefix + num + '.webp');
    }
    return a;
  }
  var GALLERIES = {
    ofek:   { title: 'פנטהאוז בצפון תל אביב', images: seq('assets/projects/ofek-', 12, true) },
    raanan: { title: 'בית פרטי', images: seq('assets/projects/raanan-', 8, true) },
    wicharge: { title: 'משרד בבני ברק', images: seq('assets/projects/wicharge-', 22, true) },
    home:     { title: 'דירת מגורים', images: seq('assets/projects/home-', 18, true) },
    autochen: { title: 'משרד ברמת גן', images: seq('assets/projects/autochen-', 10, true) },
    kfarsaba: { title: 'משרדים בכפר סבא', images: seq('assets/projects/kfarsaba-', 39, true) },
    naot:     { title: 'טבע נאות', images: seq('assets/projects/naot-', 20, true) }
  };

  var BA_ITEMS = [
    { n: 1, label: 'פינת אוכל וסלון' },
    { n: 2, label: 'מבואה' },
    { n: 3, label: 'פינת טלוויזיה' },
    { n: 4, label: 'מטבח' }
  ];

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applyConfig();
    $$('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    header();
    navSpy();
    reveal();
    specialties();
    projectsGallery();
    buildBeforeAfter();
    pressScroller();
    contactFab();
    lightbox();
    copyButtons();
  }

  /* ================= SPECIALTIES (auto-cycling tabs) ================= */
  function specialties() {
    var root = document.getElementById('spec');
    if (!root) return;
    var items = $$('.spec__item', root);
    var imgs = $$('.spec__frame img', root);
    if (!items.length) return;

    var DWELL = 5000;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var i = 0, timer = null, hovering = false, visible = false;

    function setActive(n) {
      i = (n + items.length) % items.length;
      items.forEach(function (b, k) {
        var on = k === i;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      var prev = imgs.filter(function (im) { return im.classList.contains('is-active'); })[0];
      imgs.forEach(function (im, k) {
        var on = k === i;
        im.classList.toggle('is-prev', !on && im === prev);   // stays under the incoming photo
        if (on && !im.classList.contains('is-active')) im.classList.add('is-active');
        if (!on) im.classList.remove('is-active');
      });
    }
    // reserve the tallest open state so switching items never changes the section height
    var list = $('.spec__list', root);
    var stackedMq = window.matchMedia('(max-width:760px),(max-aspect-ratio:1/1)');
    function lockListHeight() {
      list.style.minHeight = '';
      if (stackedMq.matches) return;
      root.classList.add('spec--measure');
      var current = i, max = 0;
      items.forEach(function (b, k) {
        items.forEach(function (x, j) { x.classList.toggle('is-active', j === k); });
        max = Math.max(max, list.offsetHeight);
      });
      items.forEach(function (x, j) { x.classList.toggle('is-active', j === current); });
      root.classList.remove('spec--measure');
      list.style.minHeight = max + 'px';
    }
    // only re-measure when the WIDTH changes: phones fire "resize" on every scroll as the address bar
    // hides/shows, and re-measuring then flipped every tab open and shut (the jumping + lag)
    var resizeTimer, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(resizeTimer); resizeTimer = setTimeout(lockListHeight, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockListHeight);

    function tick() { setActive(i + 1); }
    function start() { if (reduce || stackedMq.matches || timer || hovering || !visible) return; timer = setInterval(tick, DWELL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    items.forEach(function (b) {
      b.addEventListener('click', function () { setActive(+b.dataset.i); restart(); });
    });
    root.addEventListener('mouseenter', function () { hovering = true; stop(); });
    root.addEventListener('mouseleave', function () { hovering = false; start(); });
    root.addEventListener('focusin', function () { hovering = true; stop(); });
    root.addEventListener('focusout', function () { hovering = false; start(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !visible) { visible = true; setActive(i); start(); }
          else if (!en.isIntersecting && visible) { visible = false; stop(); }
        });
      }, { threshold: 0.35 }).observe(root);
    } else {
      visible = true; start();
    }

    setActive(0);
    lockListHeight();
  }

  /* ================= PROJECTS (picker card <-> in-place gallery) ================= */
  function projectsGallery() {
    var section = document.getElementById('projects');
    var root = document.getElementById('projCarousel');
    var dotsHost = document.getElementById('projDots');
    if (!section || !root || !dotsHost) return;
    var slides = $$('.proj-slide', root);
    if (!slides.length) return;

    var bg = document.getElementById('projBg');
    var detailImg = document.getElementById('projDetailImg');
    var thumbsHost = document.getElementById('projThumbs');
    var titleFloatText = document.getElementById('projTitleFloatText');
    var backBtn = document.getElementById('projBack');
    var visual = document.getElementById('projVisual');

    slides.forEach(function (_, k) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'פרויקט ' + (k + 1) + ' מתוך ' + slides.length);
      dot.addEventListener('click', function () { nudged(); setActive(k); });
      dotsHost.appendChild(dot);
    });
    var dots = $$('button', dotsHost);
    var i = 0;
    var openKey = null, galleryImages = [], galleryIndex = 0, thumbs = [];

    function setActive(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    }

    // toggling open/closed adds or removes the title row above the image; scroll by the same
    // amount so the image stays exactly where the user clicked it
    function keepImageInPlace(fn) {
      var before = visual.getBoundingClientRect().top;
      fn();
      var delta = visual.getBoundingClientRect().top - before;
      if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
    }

    // glide a title from where the other title was (card corner <-> above the image)
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // a rect measured while a previous fly animation is still running is transformed, which on fast
    // clicking produced wild offsets and made the title look like it vanished. Stop animations first.
    function stillRect(el) {
      if (!el) return null;
      if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
      return el.getBoundingClientRect();
    }
    function flyTitle(el, from, fromColor) {
      if (reduceMotion || !el || !el.animate || !from || from.height < 8) return;
      var to = stillRect(el);
      if (!to || to.height < 8) return;
      var scale = from.height / to.height;
      if (!isFinite(scale) || scale < .2 || scale > 5) return;
      // lift the flying title above the card and let it escape the image's clipping while it travels
      section.classList.add('is-flying');
      el.classList.add('is-flying');
      var anim = el.animate([
        { transformOrigin: '0 0', color: fromColor,
          transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + scale + ')' },
        { transformOrigin: '0 0', color: getComputedStyle(el).color, transform: 'none' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
      var done = function () { el.classList.remove('is-flying'); section.classList.remove('is-flying'); };
      anim.addEventListener('finish', done);
      anim.addEventListener('cancel', done);
    }

    function buildThumbs(images) {
      thumbsHost.innerHTML = '';
      thumbs = images.map(function (src, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'proj-thumb';
        b.setAttribute('aria-label', 'תמונה ' + (k + 1) + ' מתוך ' + images.length);
        // small thumbnail file, filled in batches of 5 (see loadThumbsInBatches)
        b.innerHTML = '<img data-src="' + thumbOf(src) + '" alt="" decoding="async">';
        b.addEventListener('click', function () { setGalleryIndex(k); });
        thumbsHost.appendChild(b);
        return b;
      });
      loadThumbsInBatches(++thumbBatchRun);
    }

    // thumbnails live in assets/projects/thumbs/ with the same file name
    function thumbOf(src) { return src.replace('assets/projects/', 'assets/projects/thumbs/'); }

    // load the thumb strip 5 at a time: the next 5 start only once the current 5 have finished
    var thumbBatchRun = 0;
    function loadThumbsInBatches(run) {
      var imgs = $$('img[data-src]', thumbsHost);
      if (!imgs.length || run !== thumbBatchRun) return;
      var batch = imgs.slice(0, 5), left = batch.length;
      batch.forEach(function (img) {
        var done = function () { if (--left === 0) loadThumbsInBatches(run); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }

    // warm the browser cache for the photos either side of the current one
    function preloadAround(n) {
      [n + 1, n - 1].forEach(function (k) {
        var src = galleryImages[(k + galleryImages.length) % galleryImages.length];
        if (src) { var im = new Image(); im.decoding = 'async'; im.src = src; }
      });
    }

    function setGalleryIndex(n) {
      galleryIndex = (n + galleryImages.length) % galleryImages.length;
      detailImg.src = galleryImages[galleryIndex];
      preloadAround(galleryIndex);
      thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === galleryIndex); });
      // scroll only the thumb strip horizontally (scrollIntoView would also scroll the page)
      var active = thumbs[galleryIndex];
      if (!active) return;
      var hr = thumbsHost.getBoundingClientRect(), tr = active.getBoundingClientRect();
      if (tr.left < hr.left) thumbsHost.scrollBy({ left: tr.left - hr.left - 8, behavior: 'smooth' });
      else if (tr.right > hr.right) thumbsHost.scrollBy({ left: tr.right - hr.right + 8, behavior: 'smooth' });
    }

    function openProject(slide) {
      var key = slide.dataset.project;
      var g = GALLERIES[key];
      if (!g) return;
      openKey = key;
      galleryImages = g.images;
      if (bg) bg.style.backgroundImage = 'url(' + galleryImages[0] + ')';
      titleFloatText.textContent = slide.dataset.title || g.title;
      buildThumbs(galleryImages);
      var cardTitle = $('.proj-slide__title span', slide);
      var from = stillRect(cardTitle);
      var fromColor = getComputedStyle(cardTitle).color;
      keepImageInPlace(function () { section.classList.add('is-open'); });
      flyTitle(titleFloatText, from, fromColor);
      setGalleryIndex(0);
    }
    function closeProject() {
      openKey = null;
      var from = stillRect(titleFloatText);
      var fromColor = getComputedStyle(titleFloatText).color;
      keepImageInPlace(function () { section.classList.remove('is-open'); });
      flyTitle($('.proj-slide.is-active .proj-slide__title span', root), from, fromColor);
    }

    slides.forEach(function (slide) {
      if (!slide.dataset.project) return;
      var frame = $('.proj-slide__frame', slide);
      if (frame && frame.tagName === 'BUTTON') {
        frame.addEventListener('click', function () { openProject(slide); });
      }
    });

    backBtn.addEventListener('click', closeProject);
    // clicking anywhere in the section outside the glass box exits the open project
    section.addEventListener('click', function (e) {
      if (openKey && !e.target.closest('#projCarousel')) closeProject();
    });

    $('#projPrev', root).addEventListener('click', function () {
      nudged();
      if (openKey) setGalleryIndex(galleryIndex - 1);
      else setActive(i - 1);
    });
    $('#projNext', root).addEventListener('click', function () {
      nudged();
      if (openKey) setGalleryIndex(galleryIndex + 1);
      else setActive(i + 1);
    });

    document.addEventListener('keydown', function (e) {
      if (!openKey) return;
      if (e.key === 'Escape') closeProject();
    });

    // swipe the main photo: inside a project it moves through its gallery,
    // outside it moves between projects (touch only, so desktop drag-select is untouched)
    var sx = 0, sy = 0, swiping = false;
    visual.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
    }, { passive: true });
    visual.addEventListener('touchend', function (e) {
      if (!swiping) return;
      swiping = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      var forward = dx < 0;            // RTL: swiping left goes forward
      nudged();
      if (openKey) setGalleryIndex(galleryIndex + (forward ? 1 : -1));
      else setActive(i + (forward ? 1 : -1));
    }, { passive: true });

    // auto-rotate: each project is fully shown for 3s, then a 0.5s fade to the next.
    // Only while browsing (not inside a project), on screen, not hovered, and 3.5s after any manual move
    var ROTATE_MS = 3500, lastMove = Date.now(), onScreen = false, hovered = false;
    function nudged() { lastMove = Date.now(); }
    setInterval(function () {
      if (openKey || !onScreen || hovered || document.hidden) return;
      if (Date.now() - lastMove < ROTATE_MS) return;
      setActive(i + 1);
      lastMove = Date.now();
    }, 250);
    root.addEventListener('mouseenter', function () { hovered = true; });
    root.addEventListener('mouseleave', function () { hovered = false; nudged(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { onScreen = en.isIntersecting; if (onScreen) nudged(); });
      }, { threshold: 0.4 }).observe(root);
    } else {
      onScreen = true;
    }

    setActive(0);
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
    // opens the chat directly, with no pre-filled message
    var waHref = 'https://wa.me/' + CONFIG.whatsapp;
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

  /* ================= HEADER ================= */
  function header() {
    var h = $('#header');
    var onScroll = function () {
      h.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ================= NAV ACTIVE STATE ================= */
  function navSpy() {
    var links = $$('#nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
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
    if (!contact || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        document.body.classList.toggle('at-contact', en.isIntersecting);
      });
    }, { threshold: 0.2 }).observe(contact);
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

  /* ================= BEFORE / AFTER (auto crossfade) ================= */
  function buildBeforeAfter() {
    var host = $('#baList');
    if (!host) return;

    BA_ITEMS.forEach(function (item) {
      var wrap = document.createElement('div');
      wrap.className = 'ba-item';
      wrap.innerHTML =
        '<div class="ba" role="img" aria-label="השוואת לפני ואחרי — ' + item.label + '">' +
          '<img class="ba__after" src="assets/beforeafter/ba' + item.n + '-after.webp" alt="' + item.label + ' — אחרי" loading="lazy" decoding="async">' +
          '<img class="ba__before" src="assets/beforeafter/ba' + item.n + '-before.webp" alt="' + item.label + ' — לפני" loading="lazy" decoding="async">' +
          '<span class="ba__tag">לפני</span>' +
        '</div>';
      host.appendChild(wrap);
    });

    cycleAll($$('.ba', host));
  }

  /* one timer for every pair, so they always flip together:
     before shows for 2.5s, after for 5s, back and forth.
     Clicking any photo flips all of them at once, and the next 2 phases each last 2s longer. */
  var BA_BEFORE_MS = 2500, BA_AFTER_MS = 5000, BA_CLICK_BONUS_MS = 2000;
  function cycleAll(bas) {
    if (!bas.length) return;
    var showingBefore = true;
    var timer = null;
    var bonusPhases = 0;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function phaseMs() {
      var ms = showingBefore ? BA_BEFORE_MS : BA_AFTER_MS;
      if (bonusPhases > 0) { bonusPhases--; ms += BA_CLICK_BONUS_MS; }
      return ms;
    }

    function paint() {
      bas.forEach(function (ba) {
        ba.classList.toggle('is-after', !showingBefore);
        var tag = $('.ba__tag', ba);
        if (tag) tag.textContent = showingBefore ? 'לפני' : 'אחרי';
      });
    }
    function step() {
      showingBefore = !showingBefore;
      paint();
      timer = setTimeout(step, phaseMs());
    }
    function start() { if (!timer && !reduce) timer = setTimeout(step, phaseMs()); }
    function stop() { clearTimeout(timer); timer = null; }

    bas.forEach(function (ba) {
      ba.addEventListener('click', function () {
        stop();
        showingBefore = !showingBefore;
        paint();
        bonusPhases = 2;                       // this phase and the next one are 2s longer
        if (!reduce) timer = setTimeout(step, phaseMs());
      });
    });

    paint();
    var section = document.getElementById('beforeafter') || bas[0];
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { start(); }
          else { stop(); showingBefore = true; paint(); }   // restart in sync next time
        });
      }, { threshold: 0.1 }).observe(section);
    } else {
      start();
    }
  }

  /* ================= LIGHTBOX ================= */
  function lightbox() {
    var box   = $('#lightbox');
    var imgEl = $('#lbImg');
    var titleEl = $('#lbTitle');
    var countEl = $('#lbCount');
    var current = { images: [], i: 0, title: '' };

    function render() {
      imgEl.src = current.images[current.i];
      countEl.textContent = (current.i + 1) + ' / ' + current.images.length;
      titleEl.textContent = current.title;
      // preload neighbours
      [current.i + 1, current.i - 1].forEach(function (n) {
        if (n >= 0 && n < current.images.length) { var p = new Image(); p.src = current.images[n]; }
      });
    }
    function open(key, index) {
      var g = GALLERIES[key];
      if (!g) return;
      current = { images: g.images.slice(), i: index || 0, title: g.title };
      render();
      box.classList.add('open');
      document.body.classList.add('lb-open');
      $('#lbClose').focus();
    }
    function close() {
      box.classList.remove('open');
      document.body.classList.remove('lb-open');
      imgEl.src = '';
    }
    function step(d) {
      current.i = (current.i + d + current.images.length) % current.images.length;
      render();
    }

    // triggers
    $$('[data-gallery]').forEach(function (el) {
      if (el.hasAttribute('disabled')) return;
      el.addEventListener('click', function () {
        open(el.dataset.gallery, parseInt(el.dataset.index || '0', 10));
      });
    });

    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { step(-1); });
    $('#lbNext').addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(-1); // RTL: right = previous
      if (e.key === 'ArrowLeft')  step(1);
    });

    // swipe
    var sx = 0, sy = 0;
    var stage = $('.lightbox__stage');
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    });
  }
})();
