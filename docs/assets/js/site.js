/*
 * emb.org site behaviour.
 *
 * The pages were exported from Squarespace with all of its scripts removed; this
 * file re-creates the behaviour those scripts provided, driving the same CSS hooks
 * (data-active / data-in / data-show / preScale…) so the original stylesheets keep
 * working unchanged. Layout maths for the galleries mirror Squarespace's own
 * (gallery-masonry / gallery-strips / gallery-grid controllers, breakpoints 576/768/992).
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var BP = { sm: 576, md: 768, lg: 992 };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function props(el) {
    try { return JSON.parse(el.getAttribute('data-props') || '{}'); } catch (e) { return {}; }
  }
  function onResize(fn) {
    var t, w = window.innerWidth;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (window.innerWidth !== w) { w = window.innerWidth; } fn(); }, 100);
    });
  }
  function aspect(img) {
    if (!img) return 1;
    var d = (img.getAttribute('data-image-dimensions') || '').split('x');
    if (d[0] && d[1]) return +d[0] / +d[1];
    var w = img.getAttribute('width'), h = img.getAttribute('height');
    return w && h ? +w / +h : 1;
  }
  // Squarespace's responsive column / gutter rules.
  function columnsFor(n) {
    var w = window.innerWidth; n = Math.max(1, n || 1);
    if (n === 1) return 1;
    if (w <= BP.sm) return 2;
    if (w <= BP.md) return Math.max(Math.ceil(n / 2), 2);
    if (w <= BP.lg) return Math.ceil(n * 0.75);
    return n;
  }
  function gutterFor(g) {
    var w = window.innerWidth; if (g <= 20) return g;
    if (w <= BP.sm) return Math.max(20, Math.round(g * 0.25));
    if (w <= BP.md) return Math.max(20, Math.round(g * 0.5));
    if (w <= BP.lg) return Math.max(20, Math.round(g * 0.75));
    return g;
  }
  function inView(nodes, cb) {
    if (!('IntersectionObserver' in window)) { nodes.forEach(cb); return; }
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        cb(e.target, n++);
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  // ------------------------------------------------------------ images
  // A few images only carry data-src, and slideshow/lightbox images ship hidden
  // (display:none) until Squarespace's loader revealed them.
  function images() {
    $$('img[data-src]:not([src])').forEach(function (img) { img.src = img.getAttribute('data-src'); });
    $$('.gallery-slideshow-item img, .gallery-fullscreen-slideshow-item img, .gallery-lightbox-item img').forEach(function (img) {
      if (img.style.display === 'none') img.style.display = 'block';
    });
  }

  // ------------------------------------------------------------ header + mobile menu
  function header() {
    var header = $('header.header');
    if (!header) return;
    var body = document.body;
    var burgers = $$('.header-burger-btn', header);
    var menu = $('.header-menu', header);
    function setOpen(open) {
      body.classList.toggle('header--menu-open', open);
      burgers.forEach(function (b) {
        b.classList.toggle('burger--active', open);
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (menu) menu.style.paddingTop = header.offsetHeight + 'px';
    }
    burgers.forEach(function (b) {
      b.addEventListener('click', function () { setOpen(!body.classList.contains('header--menu-open')); });
    });
    if (menu) $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

    // The first section clears the fixed header by its measured height.
    var first = $('main .page-section');
    function offset() {
      if (header.classList.contains('shrink')) return;
      var h = header.offsetHeight;
      document.documentElement.style.setProperty('--header-height', h + 'px');
      if (first && body.classList.contains('tweak-fixed-header')) first.style.paddingTop = h + 'px';
    }
    offset();
    onResize(function () { if (window.innerWidth > 799) setOpen(false); offset(); });

    // Fixed header: compacts once scrolled; the "scroll back" style also hides it
    // while scrolling down and brings it back on the way up.
    if (!body.classList.contains('tweak-fixed-header')) return;
    var scrollBack = body.classList.contains('tweak-fixed-header-style-scroll-back');
    var lastY = window.pageYOffset;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (body.classList.contains('header--menu-open')) { lastY = y; return; }
      if (y <= 0) {
        header.classList.remove('shrink');
        header.style.transform = '';
      } else {
        header.classList.add('shrink');
        if (scrollBack) {
          if (y > lastY + 2 && y > header.offsetHeight) header.style.transform = 'translateY(-100%)';
          else if (y < lastY - 2) header.style.transform = '';
        }
      }
      lastY = y;
    }, { passive: true });
  }

  // ------------------------------------------------------------ site animations
  // Squarespace's "Scale" site animation: elements start at .preScale and gain
  // .scaleIn as they enter the viewport.
  function animations() {
    var body = document.body;
    if (reduceMotion || !body.classList.contains('tweak-global-animations-enabled')) return;
    var type = (body.className.match(/tweak-global-animations-animation-type-(\w+)/) || [])[1] || 'fade';
    var pre = { fade: 'preFade', scale: 'preScale', slide: 'preSlide', clip: 'preClip', flex: 'preFlex' }[type] || 'preFade';
    var post = { fade: 'fadeIn', scale: 'scaleIn', slide: 'slideIn', clip: 'clipIn', flex: 'flexIn' }[type] || 'fadeIn';
    var nodes = $$('[data-animation-role], .sqs-block-content, .item-pagination-title').filter(function (el) {
      return !el.closest('.gallery-lightbox, .header-menu, .gallery-slideshow-item, .gallery-fullscreen-slideshow-item');
    });
    nodes.forEach(function (el) { el.classList.add(pre); });
    inView(nodes, function (el, i) {
      el.style.transitionTimingFunction = 'ease';
      el.style.transitionDuration = '0.65s';
      el.style.transitionDelay = Math.min(i * 0.02, 0.3).toFixed(2) + 's';
      el.classList.add(post);
    });
  }

  // ------------------------------------------------------------ grid / masonry / strips
  function staggerShow(items) {
    inView(items, function (el, i) {
      setTimeout(function () { el.setAttribute('data-show', 'true'); }, 50 + i * 50);
    });
    items.forEach(function (el) { el.setAttribute('data-loaded', 'true'); });
  }

  function galleryGrid(root) {
    var p = props(root);
    var wrap = $('.gallery-grid-wrapper', root);
    var items = $$('.gallery-grid-item', root);
    function layout() {
      var cols = columnsFor(p.numColumns || +root.getAttribute('data-columns') || 3);
      var g = (p.gutter != null ? p.gutter : 20) / 20;
      var full = root.getAttribute('data-width');
      wrap.setAttribute('style', 'grid-template-columns: repeat(' + cols + ', 1fr); grid-column-gap: ' + g + 'vw; grid-row-gap: ' + g + 'vw;' +
        (full === 'full' || full === 'inset' ? '' : ' padding: 0vw ' + g + 'vw;') + ' width: auto');
    }
    layout(); onResize(layout);
    staggerShow(items);
    lightbox(root, '.gallery-grid-lightbox-link');
  }

  function galleryMasonry(root) {
    var p = props(root);
    var wrap = $('.gallery-masonry-wrapper', root);
    var items = $$('.gallery-masonry-item', root);
    var fullBleed = root.getAttribute('data-width') === 'full-bleed';
    function layout() {
      var cols = columnsFor(p.numColumns || 2);
      var gutter = gutterFor(p.gutter != null ? p.gutter : 10);
      var d = wrap.clientWidth, g = gutter / 20 * (d / 100);
      var x0 = 0, pitch = (d + g) / cols, w = pitch - g;
      if (fullBleed) { x0 = g; pitch = (d - g) / cols; w = pitch - g; }
      var heights = []; for (var c = 0; c < cols; c++) heights.push(0);
      items.forEach(function (item) {
        var col = heights.indexOf(Math.min.apply(null, heights));
        var img = $('img', item), iw = $('.gallery-masonry-item-wrapper', item);
        var h = Math.round(w / aspect(img));
        item.style.position = 'absolute';
        item.style.width = Math.round(w) + 'px';
        item.style.transform = 'translate3d(' + Math.round(x0 + pitch * col) + 'px, ' + Math.round(heights[col]) + 'px, 0)';
        if (img) { img.style.width = '100%'; img.style.height = h + 'px'; }
        if (iw) { iw.style.height = h + 'px'; iw.style.overflow = 'hidden'; }
        heights[col] += h + g;
      });
      wrap.style.height = (Math.max.apply(null, heights) - g) + 'px';
    }
    layout(); onResize(layout);
    setTimeout(function () { wrap.classList.add('gallery-masonry-list--ready'); }, 0);
    staggerShow(items);
    lightbox(root, '.gallery-masonry-lightbox-link');
  }

  function galleryStrips(root) {
    var p = props(root);
    var wrap = $('.gallery-strips-wrapper', root);
    var items = $$('.gallery-strips-item', root);
    function layout() {
      var gutter = p.gutter != null ? p.gutter : 20, target = p.rowHeight || 300;
      var s = wrap.clientWidth, max = s + gutter + 0.25 * target;
      var rows = [{ items: [], width: 0 }];
      items.forEach(function (item) {
        var a = aspect($('img', item)), w = Math.round(a * target), row = rows[rows.length - 1];
        if (row.width + w > max) { row = { items: [], width: 0 }; rows.push(row); }
        row.items.push({ node: item, a: a }); row.width += w;
      });
      var last = rows[rows.length - 1], prev = rows[rows.length - 2];
      if (s > 500 && prev && last.items.length === 1 && prev.items.length > 1) {
        prev.items.push(last.items[0]); prev.width += Math.round(last.items[0].a * target); rows.pop();
      }
      var y = 0;
      rows.forEach(function (row) {
        var h = Math.round((s - gutter * (row.items.length - 1)) / row.width * target), x = 0;
        row.items.forEach(function (it) {
          var w = it.a * h, img = $('img', it.node), iw = $('.gallery-strips-item-wrapper', it.node);
          it.node.style.position = 'absolute';
          it.node.style.transform = 'matrix(1, 0, 0, 1, ' + x + ', ' + y + ')';
          it.node.style.width = Math.round(w) + 'px';
          if (img) { img.style.height = h + 'px'; img.style.width = '100%'; img.style.objectFit = 'cover'; }
          if (iw) { iw.style.height = h + 'px'; iw.style.overflow = 'hidden'; }
          x += w + gutter;
        });
        y += h + gutter;
      });
      wrap.style.height = (y - gutter) + 'px';
    }
    layout(); onResize(layout);
    setTimeout(function () { wrap.classList.add('gallery-strips-list--ready'); }, 0);
    staggerShow(items);
    lightbox(root, '.gallery-strips-lightbox-link');
  }

  // ------------------------------------------------------------ slideshows
  // Mirrors Squarespace's slide state machine: the incoming slide is appended last,
  // marked data-active, then data-in; the outgoing one loses data-in, then data-active.
  function Slides(opts) {
    var slides = opts.slides, idx = -1, timer = null;
    function go(i, instant) {
      var n = slides.length; if (!n) return;
      i = ((i % n) + n) % n;
      if (i === idx) return;
      var forward = idx === -1 || i > idx || (idx === n - 1 && i === 0);
      if (idx > -1) {
        var out = slides[idx];
        out.setAttribute('data-next', String(!forward));
        out.setAttribute('data-in', 'false');
        setTimeout(function (o) { return function () { if (o !== slides[idx]) o.removeAttribute('data-active'); }; }(out), instant ? 0 : 1000);
      }
      var inc = slides[i];
      inc.setAttribute('data-active', 'false');
      inc.setAttribute('data-next', String(forward));
      inc.parentNode.appendChild(inc);
      idx = i;
      setTimeout(function () { inc.setAttribute('data-active', 'true'); }, 0);
      setTimeout(function () { inc.setAttribute('data-in', 'true'); }, instant ? 0 : 30);
      if (opts.onChange) opts.onChange(i);
    }
    function restart() {
      if (!opts.autoplay) return;
      clearInterval(timer);
      timer = setInterval(function () { if (!document.hidden) go(idx + 1); }, opts.duration || 5000);
    }
    if (opts.prev) opts.prev.addEventListener('click', function (e) { e.preventDefault(); go(idx - 1); restart(); });
    if (opts.next) opts.next.addEventListener('click', function (e) { e.preventDefault(); go(idx + 1); restart(); });
    if (opts.swipe) swipe(opts.swipe, function () { go(idx + 1); restart(); }, function () { go(idx - 1); restart(); });
    slides.forEach(function (s) { s.removeAttribute('data-active'); s.removeAttribute('data-in'); });
    go(0, true);
    restart();
    return { go: function (i, instant) { go(i, instant); restart(); }, index: function () { return idx; }, stop: function () { clearInterval(timer); } };
  }

  function swipe(node, onLeft, onRight) {
    var x0 = null, y0 = null;
    node.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    node.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) onLeft(); else onRight(); }
      x0 = null;
    });
  }

  function gallerySlideshow(root) {
    var p = props(root);
    // Size from the gallery's own settings (the server HTML ignores galleryWidth);
    // below 768px Squarespace makes every slideshow a full-width square.
    var sized = $('.gallery-slideshow-wrapper', root);
    function size() {
      if (window.matchMedia('(max-width: ' + (BP.md - 1) + 'px)').matches) {
        root.style.height = '100vw';
        root.style.maxWidth = 'var(--maxPageWidth)';
      } else {
        root.style.height = 'calc(' + (p.galleryHeight || 75) + 'vh + (var(--pagePadding) * 2))';
        root.style.maxWidth = 'calc(var(--maxPageWidth) * (' + (p.galleryWidth || 100) / 100 + '))';
      }
      if (sized) sized.style.height = (sized.clientWidth * 2 / 3) + 'px';
    }
    size(); onResize(size);
    var slides = $$('.gallery-slideshow-item', root);
    var thumbs = $$('.gallery-slideshow-thumbnails-thumb', root);
    thumbs.forEach(function (t) { var i = $('img', t); if (i) i.setAttribute('data-loaded', 'true'); });
    var urls = slides.map(function (s) { return s.getAttribute('data-slide-url'); });
    var show = Slides({
      slides: slides,
      prev: $('[data-previous]', root) || $('.gallery-slideshow-control-btn[data-previous]', root),
      next: $('.gallery-slideshow-control-btn[data-next]', root),
      swipe: $('.gallery-slideshow-list', root),
      autoplay: p.autoplayEnabled, duration: p.slideDurationMs,
      onChange: function (i) {
        var url = urls[i];
        thumbs.forEach(function (t) {
          var on = (t.getAttribute('data-slide-url') || t.getAttribute('data-thumbnail-url')) === url;
          t.setAttribute('data-active', on ? 'true' : 'false');
        });
      }
    });
    thumbs.forEach(function (t, i) { t.addEventListener('click', function (e) { e.preventDefault(); show.go(i); }); });
  }

  function galleryFullscreen(root) {
    var p = props(root);
    var list = $('.gallery-fullscreen-slideshow-list', root);
    function size() { list.style.height = (list.clientWidth * 2 / 3) + 'px'; }
    size(); onResize(size);
    Slides({
      slides: $$('.gallery-fullscreen-slideshow-item', root),
      prev: $('.gallery-fullscreen-slideshow-control-btn[data-previous]', root),
      next: $('.gallery-fullscreen-slideshow-control-btn[data-next]', root),
      swipe: list,
      autoplay: p.autoplayEnabled, duration: p.slideDurationMs
    });
    $$('.gallery-fullscreen-slideshow-item-img', root).forEach(function (el) { el.setAttribute('data-loaded', 'true'); });
    lightbox(root, '.gallery-fullscreen-slideshow-lightbox-link');
  }

  // ------------------------------------------------------------ lightbox
  var CARET = '<svg viewBox="0 0 9 16"><polyline fill="none" stroke-miterlimit="10" points="7.3,14.7 2.5,8 7.3,1.2"></polyline></svg>';
  function lightbox(root, linkSel) {
    var section = root.closest('[data-section-id]');
    var id = section && section.getAttribute('data-section-id');
    var outer = id && $('.gallery-lightbox-outer-wrapper[data-lightbox-section-id="' + id + '"]');
    if (!outer || outer.getAttribute('data-lightbox') !== 'true') return;
    var box = $('.gallery-lightbox', outer);
    var items = $$('.gallery-lightbox-item', box);
    var urls = items.map(function (f) { return f.getAttribute('data-slide-url'); });
    if (!$('.gallery-lightbox-controls', box)) {
      var c = document.createElement('div');
      c.className = 'gallery-lightbox-controls';
      c.innerHTML =
        '<div class="gallery-lightbox-control" data-previous><button class="gallery-lightbox-control-btn" aria-label="Previous Slide"><div class="gallery-lightbox-control-btn-icon"><div class="caret-left-icon--small">' + CARET + '</div></div></button></div>' +
        '<div class="gallery-lightbox-control" data-next><button class="gallery-lightbox-control-btn" aria-label="Next Slide"><div class="gallery-lightbox-control-btn-icon"><div class="caret-right-icon--small" style="transform:scaleX(-1)">' + CARET + '</div></div></button></div>';
      $('.gallery-lightbox-wrapper', box).appendChild(c);
    }
    items.forEach(function (f) {
      var img = $('img', f);
      if (img) img.style.display = 'block';
      var w = $('.gallery-lightbox-item-img', f); if (w) w.setAttribute('data-loaded', 'true');
    });
    var slides = null;
    function open(i) {
      box.setAttribute('data-open', 'true');
      document.body.classList.add('gallery-lightbox-body-hide-overflow');
      if (!slides) slides = Slides({ slides: items, swipe: $('.gallery-lightbox-list', box) });
      slides.go(i, true);
    }
    function close() {
      box.removeAttribute('data-open');
      document.body.classList.remove('gallery-lightbox-body-hide-overflow');
    }
    $('.gallery-lightbox-control[data-previous] button', box).addEventListener('click', function () { slides.go(slides.index() - 1); });
    $('.gallery-lightbox-control[data-next] button', box).addEventListener('click', function () { slides.go(slides.index() + 1); });
    $$('[data-close], .gallery-lightbox-background', box).forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (box.getAttribute('data-open') !== 'true') return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') slides.go(slides.index() + 1);
      if (e.key === 'ArrowLeft') slides.go(slides.index() - 1);
    });
    $$(linkSel, root).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var m = (a.getAttribute('href') || '').match(/itemId=([^&]+)/);
        var i = m ? urls.indexOf(m[1]) : -1;
        open(i < 0 ? 0 : i);
      });
    });
  }

  // ------------------------------------------------------------ video blocks
  function videos() {
    // Squarespace-hosted videos (now plain files): big centred play button until started.
    $$('video.port-video').forEach(function (v) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'port-video-play';
      btn.setAttribute('aria-label', 'Play');
      v.parentNode.insertBefore(btn, v.nextSibling);
      btn.addEventListener('click', function () { v.play(); });
      v.addEventListener('play', function () { btn.hidden = true; });
    });
    $$('.sqs-video-wrapper[data-port-embed]').forEach(function (wrap) {
      var src = wrap.getAttribute('data-port-embed');
      var overlay = $('.sqs-video-overlay', wrap);
      function play() {
        wrap.innerHTML = '<iframe src="' + src + '" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen frameborder="0" title="Video"></iframe>';
        wrap.classList.add('port-video-playing');
      }
      if (!overlay || !$('img', overlay)) {
        wrap.innerHTML = '<iframe src="' + src.replace(/([?&])autoplay=1&?/, '$1').replace(/[?&]$/, '') + '" allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen frameborder="0" title="Video"></iframe>';
        wrap.classList.add('port-video-playing');
        return;
      }
      overlay.style.opacity = '1';
      overlay.addEventListener('click', play);
      var icon = $('.sqs-video-icon', overlay);
      if (icon) icon.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    });
  }

  // ------------------------------------------------------------ forms (PadelSpot contact)
  function forms() {
    $$('form[data-port-mailto]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = $$('input[required], textarea[required]', form), ok = true;
        fields.forEach(function (f) {
          var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value.trim()));
          f.setAttribute('aria-invalid', bad ? 'true' : 'false');
          var item = f.closest('.form-item, .field'); if (item) item.classList.toggle('error', bad);
          if (bad && ok) { ok = false; f.focus(); }
        });
        if (!ok) return;
        var v = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
        var name = (v('fname') + ' ' + v('lname')).trim();
        var body = v('message') + '\n\n— ' + name + (v('email') ? ' <' + v('email') + '>' : '');
        window.location.href = 'mailto:' + form.getAttribute('data-port-mailto') +
          '?subject=' + encodeURIComponent(form.getAttribute('data-port-subject') + (name ? ' from ' + name : '')) +
          '&body=' + encodeURIComponent(body);
        var label = $('.form-submit-button-label', form);
        if (label) label.textContent = 'Opening your email…';
      });
    });
  }

  function init() {
    images();
    header();
    $$('.gallery-grid').forEach(galleryGrid);
    $$('.gallery-masonry').forEach(galleryMasonry);
    $$('.gallery-strips').forEach(galleryStrips);
    $$('.gallery-slideshow').forEach(gallerySlideshow);
    $$('.gallery-fullscreen-slideshow').forEach(galleryFullscreen);
    videos();
    forms();
    animations();
    document.documentElement.classList.add('port-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
