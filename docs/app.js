(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 每张贴纸贴上去的角度：小、正负交替，看起来是手贴的，不是排版排出来的。
  const TILTS = [-3, 2.5, -1.5, 3, -2];

  /* ── 复制 ── */
  const status = $('copy-status');
  function fallbackCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    if (!ok) throw Error('copy failed');
  }
  document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => {
    const text = button.dataset.copy || $(button.dataset.copyFrom).textContent.trim();
    try {
      try { await navigator.clipboard.writeText(text); } catch { fallbackCopy(text); }
      button.textContent = 'Copied';
      if (status) status.textContent = 'Copied to the clipboard.';
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(button.previousElementSibling);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      if (status) status.textContent = 'Selected. Press Command-C or Ctrl-C to copy.';
    }
  }));

  /* ── 首屏：贴纸可以揭下来拖到别处 ── */
  const board = $('board');
  const canDrag = matchMedia('(pointer: fine)').matches;
  let topZ = 10;
  board.querySelectorAll('.sticker').forEach(sticker => {
    let start = null, moved = false, justDragged = false;
    sticker.addEventListener('click', event => {
      if (justDragged) { event.preventDefault(); justDragged = false; }
    });
    if (!canDrag) return;
    sticker.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      sticker.setPointerCapture(event.pointerId);
      const style = getComputedStyle(sticker);
      start = { x: event.clientX, y: event.clientY, dx: parseFloat(style.getPropertyValue('--dx')) || 0, dy: parseFloat(style.getPropertyValue('--dy')) || 0 };
      moved = false;
    });
    sticker.addEventListener('pointermove', event => {
      if (!start) return;
      const x = event.clientX - start.x, y = event.clientY - start.y;
      if (!moved && Math.hypot(x, y) < 4) return;
      if (!moved) {
        moved = true;
        sticker.classList.remove('stuck');
        sticker.classList.add('dragging');
        sticker.style.zIndex = ++topZ;
        board.classList.add('touched');
      }
      sticker.style.setProperty('--dx', `${start.dx + x}px`);
      sticker.style.setProperty('--dy', `${start.dy + y}px`);
    });
    const drop = () => {
      if (!start) return;
      start = null;
      if (!moved) return;
      justDragged = true;
      sticker.classList.remove('dragging');
      sticker.style.setProperty('--r', `${(Math.random() * 22 - 11).toFixed(1)}deg`);
      if (!reduceMotion) {
        sticker.classList.add('stuck');
        sticker.addEventListener('animationend', () => sticker.classList.remove('stuck'), { once: true });
      }
    };
    sticker.addEventListener('pointerup', drop);
    sticker.addEventListener('pointercancel', drop);
    sticker.addEventListener('dragstart', event => event.preventDefault());
  });

  /* ── 例子 ── */
  const setsEl = $('sets');
  const examples = document.querySelector('.examples');
  const viewer = $('viewer');
  let scenes = [];

  document.querySelectorAll('[data-surface]').forEach(button => button.addEventListener('click', () => {
    const ink = button.dataset.surface === 'ink';
    examples.classList.toggle('on-ink', ink);
    viewer.classList.toggle('on-ink', ink);
    document.querySelectorAll('[data-surface]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'class') node.className = value;
      else if (key === 'style') node.setAttribute('style', value);
      else if (key in node) node[key] = value;
      else node.setAttribute(key, value);
    });
    node.append(...children);
    return node;
  }

  function renderSets(brands) {
    const arrow = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('class', 'arrow');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<path d="M4 12h16m-6-6 6 6-6 6"/>';
      return svg;
    };
    brands.forEach(brand => {
      const buttons = brand.scenes.map((scene, i) => {
        const index = scenes.push({ brand, scene, i }) - 1;
        const button = el('button', { type: 'button', class: 'scene', style: `--r:${TILTS[i % TILTS.length]}deg`, 'aria-label': `${brand.name}: ${scene.title}. Open larger.` },
          el('img', { src: scene.image, alt: '', width: 800, height: 800, loading: 'lazy', decoding: 'async', draggable: false }),
          el('span', {}, scene.title));
        button.addEventListener('click', () => openViewer(index));
        return button;
      });
      setsEl.append(el('article', { class: 'set', id: `set-${brand.id}`, 'aria-labelledby': `name-${brand.id}` },
        el('div', { class: 'set-head' },
          el('div', {}, el('h3', { id: `name-${brand.id}` }, brand.name), el('span', { class: 'route' }, brand.route || '')),
          el('p', {}, brand.description || brand.subtitle || '')),
        el('div', { class: 'strip' },
          el('figure', { class: 'origin' },
            el('span', {}, el('img', { src: brand.logo, alt: `${brand.name} original logo`, width: 68, height: 68 })),
            el('span', {}, 'Original mark')),
          arrow(),
          el('div', { class: 'scenes' }, ...buttons))));
    });
  }

  /* ── 大图 ── */
  let current = 0;
  const stage = $('v-stage'), compare = $('v-compare');
  function paintViewer() {
    const { brand, scene, i } = scenes[current];
    const original = compare.getAttribute('aria-pressed') === 'true';
    const image = $('v-image');
    image.src = original ? brand.logo : scene.image;
    image.alt = original ? `${brand.name} original logo` : (scene.alt || `${brand.name}: ${scene.title}`);
    stage.classList.toggle('original', original);
    $('v-brand').textContent = `${brand.name} · ${brand.route || ''}`;
    $('v-count').textContent = `${i + 1} / ${brand.scenes.length}`;
    $('v-title').textContent = scene.title;
    $('v-desc').textContent = scene.description || '';
    $('v-logo').src = brand.logo;
    compare.querySelector('span').textContent = original ? 'Back to the sticker' : 'Show the original mark';
    if (!reduceMotion) { image.style.animation = 'none'; void image.offsetWidth; image.style.animation = ''; }
  }
  function openViewer(index) {
    current = index;
    compare.setAttribute('aria-pressed', 'false');
    paintViewer();
    if (typeof viewer.showModal === 'function') viewer.showModal();
    else viewer.setAttribute('open', '');
  }
  const step = delta => { current = (current + delta + scenes.length) % scenes.length; compare.setAttribute('aria-pressed', 'false'); paintViewer(); };
  $('v-prev').addEventListener('click', () => step(-1));
  $('v-next').addEventListener('click', () => step(1));
  compare.addEventListener('click', () => {
    compare.setAttribute('aria-pressed', String(compare.getAttribute('aria-pressed') !== 'true'));
    paintViewer();
  });
  $('v-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });

  fetch('gallery.json')
    .then(response => { if (!response.ok) throw Error(`gallery.json ${response.status}`); return response.json(); })
    .then(data => {
      const brands = Array.isArray(data) ? data : data.brands;
      if (!Array.isArray(brands) || !brands.length || brands.some(b => !b.id || !b.name || !b.logo || !Array.isArray(b.scenes) || b.scenes.some(s => !s.image || !s.title))) {
        throw Error('Invalid gallery data');
      }
      renderSets(brands);
      if (location.hash.startsWith('#set-')) document.querySelector(location.hash)?.scrollIntoView();
    })
    .catch(() => { $('sets-error').hidden = false; });
})();
