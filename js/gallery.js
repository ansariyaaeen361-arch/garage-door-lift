(function () {
  'use strict';

  const overlay = document.getElementById('lightbox');
  if (!overlay) return;

  const imgEl = document.getElementById('lightbox-img');
  const counterEl = document.getElementById('lightbox-counter');
  const items = Array.from(document.querySelectorAll('.gallery-item img'));
  let currentIndex = 0;

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    const src = items[currentIndex].getAttribute('src');
    imgEl.src = src;
    imgEl.alt = items[currentIndex].getAttribute('alt') || '';
    counterEl.textContent = `${currentIndex + 1} / ${items.length}`;
  }

  function open(index) {
    show(index);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  items.forEach((img, index) => {
    img.addEventListener('click', () => open(index));
  });

  overlay.querySelector('[data-lightbox-close]').addEventListener('click', close);
  overlay.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(currentIndex - 1));
  overlay.querySelector('[data-lightbox-next]').addEventListener('click', () => show(currentIndex + 1));

  // Clicking the dark backdrop (not the image or the nav buttons) also closes it.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(currentIndex - 1);
    if (e.key === 'ArrowRight') show(currentIndex + 1);
  });
})();
