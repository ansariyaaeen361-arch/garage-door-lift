(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('nav-open'); });
    });
  }

  // Broken image -> placeholder box (keeps layout, shows filename until the real
  // asset is dropped in place with the same filename).
  function showMissing(img) {
    var box = document.createElement('div');
    box.className = img.className ? img.className + ' img-missing' : 'img-missing';
    box.setAttribute('style', img.getAttribute('style') || '');
    box.title = img.alt || '';
    box.textContent = img.getAttribute('src').split('/').pop();
    img.replaceWith(box);
  }
  document.querySelectorAll('img').forEach(function (img) {
    // A same-origin 404 against a local server can resolve before this script
    // (placed at the end of body) runs, so the 'error' event already fired
    // and attaching a fresh listener here would miss it — check img.complete first.
    if (img.complete) {
      if (img.naturalWidth === 0) showMissing(img);
    } else {
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        showMissing(img);
      }, { once: true });
    }
  });

  // Contact form: client-side validation, then posts to the quotes API.
  // If a user is signed in, the backend links the request to their account
  // automatically (via the session cookie) so it shows up on their account page.
  var form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var submitBtn = form.querySelector('button[type=submit]');
      var errorBox = document.getElementById('quote-error');
      if (errorBox) errorBox.classList.remove('show');
      submitBtn.disabled = true;

      var payload = {
        name: document.getElementById('q-name').value.trim(),
        phone: document.getElementById('q-phone').value.trim(),
        email: document.getElementById('q-email').value.trim(),
        product: document.getElementById('quote-product').value,
        city: document.getElementById('q-city').value.trim(),
        message: document.getElementById('q-message').value.trim()
      };

      fetch('/api/quotes', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('request-failed');
        form.style.display = 'none';
        var success = document.getElementById('quote-success');
        if (success) success.style.display = 'block';
      }).catch(function () {
        if (errorBox) {
          errorBox.textContent = 'Could not submit your request right now. Please try again in a moment.';
          errorBox.classList.add('show');
        }
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  }

  // Preselect product line on the contact form from a ?product= query param
  // (used by "REQUEST A QUOTE FOR THIS LINE" links on product detail pages).
  var productSelect = document.getElementById('quote-product');
  if (productSelect) {
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get('product');
    if (wanted) {
      Array.prototype.forEach.call(productSelect.options, function (opt) {
        if (opt.value === wanted) opt.selected = true;
      });
    }
  }

  // Header gets a drop shadow once the page has scrolled past the top.
  var header = document.querySelector('.site-header');
  if (header) {
    var setScrolled = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  // Scroll-reveal: fade (+ slide, for cards) the first time a block enters the
  // viewport. Applied generically by selector so individual pages don't need a
  // class hand-added to every card/row. Shared by both the card-style reveal
  // below and the heading-style reveal further down.
  function setupReveal(targets, opts) {
    opts = opts || {};
    var revealClass = opts.revealClass || 'reveal';
    var revealedClass = opts.revealedClass || 'revealed';
    var stagger = opts.stagger !== false;
    if (!targets.length) return;
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add(revealClass);
      if (stagger) {
        var siblings = el.parentElement ? el.parentElement.children : [];
        var idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = (Math.min(Math.max(idx, 0), 5) * 0.07) + 's';
      }
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add(revealedClass);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add(revealedClass); });
    }
  }

  var revealSelectors = [
    '.section-head', '.line-row', '.line-row-index', '.feature-card', '.model-card',
    '.style-card', '.color-card', '.hardware-card', '.testimonial-card', '.gallery-item',
    '.stat', '.construction-media', '.construction-grid > div:last-child',
    '.about-teaser-media', '.about-teaser-copy', '.about-media img', '.coverage-media',
    '.coverage-copy', '.window-card', '.feature-list-item', '.contact-info-card',
    '.contact-media', '.form'
  ];
  setupReveal(document.querySelectorAll(revealSelectors.join(',')));

  // Headings get their own slightly richer reveal (fade + slide + scale, a
  // touch slower) so they read as a deliberate flourish rather than just
  // another card in the grid. Skipped when a heading already sits inside a
  // `.section-head` block — that block reveals as one unit (eyebrow + heading
  // + description together) above, so animating the heading again inside it
  // would just double up the motion.
  var headingCandidates = document.querySelectorAll('h1:not(.hero-title), .section-title, .cta-title, .spec-title, .about-title');
  var headingTargets = Array.prototype.filter.call(headingCandidates, function (el) {
    return !el.closest('.section-head');
  });
  setupReveal(headingTargets, { revealClass: 'heading-reveal', stagger: false });
})();
