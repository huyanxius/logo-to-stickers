(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canDrag = matchMedia('(pointer: fine)').matches;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));
  document.documentElement.classList.add('js');

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

  /* ── 首屏：揭开 logo 标签 ──
     --d 是从右下角折起的长度。往左上拖就揭得更多，松手时过了四成就整张揭掉，不到就弹回去。 */
  const slots = [...document.querySelectorAll('.slot')];
  const hint = $('pad-hint'), restick = $('restick');
  const HINTS = ['Drag a corner, or just click.', 'Two more to go.', 'One more.', 'That’s what the skill does with your logo.'];

  function paintStatus() {
    const count = slots.filter(slot => slot.classList.contains('revealed')).length;
    hint.textContent = HINTS[count];
    restick.hidden = count < slots.length;
  }

  async function peel(slot) {
    if (slot.classList.contains('revealed') || slot.dataset.peeling) return;
    slot.dataset.peeling = '1';
    const label = slot.querySelector('.label');
    label.style.setProperty('--d', `${label.offsetWidth * 0.78}px`);
    await sleep(320);
    label.classList.add('gone');
    label.tabIndex = -1;
    label.setAttribute('aria-hidden', 'true');
    slot.classList.add('revealed');
    delete slot.dataset.peeling;
    paintStatus();
  }

  slots.forEach(slot => {
    const label = slot.querySelector('.label');
    let start = null, moved = false;
    label.addEventListener('pointerdown', event => {
      if (slot.classList.contains('revealed') || event.button !== 0) return;
      event.preventDefault();
      label.setPointerCapture(event.pointerId);
      start = { x: event.clientX, y: event.clientY };
      moved = false;
    });
    label.addEventListener('pointermove', event => {
      if (!start) return;
      const pull = (start.x - event.clientX) + (start.y - event.clientY);
      if (!moved && Math.abs(pull) < 5) return;
      moved = true;
      label.classList.add('dragging');
      const size = label.offsetWidth;
      label.style.setProperty('--d', `${Math.max(22, Math.min(size * 1.1, 30 + pull * 0.8))}px`);
    });
    const release = () => {
      if (!start) return;
      start = null;
      label.classList.remove('dragging');
      if (!moved) return peel(slot);
      const d = parseFloat(label.style.getPropertyValue('--d')) || 0;
      if (d > label.offsetWidth * 0.42) peel(slot);
      else label.style.removeProperty('--d');
    };
    label.addEventListener('pointerup', release);
    label.addEventListener('pointercancel', release);
    label.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      peel(slot);
    });

    // 揭出来的角色还能拖着玩；不拖只点一下，就打开它那一套
    const char = slot.querySelector('.char');
    let grab = null, dragged = false;
    char.addEventListener('pointerdown', event => {
      if (!slot.classList.contains('revealed') || event.button !== 0) return;
      event.preventDefault();
      char.setPointerCapture(event.pointerId);
      const style = getComputedStyle(char);
      grab = { x: event.clientX, y: event.clientY, dx: parseFloat(style.getPropertyValue('--dx')) || 0, dy: parseFloat(style.getPropertyValue('--dy')) || 0 };
      dragged = false;
    });
    char.addEventListener('pointermove', event => {
      if (!grab || !canDrag) return;
      const x = event.clientX - grab.x, y = event.clientY - grab.y;
      if (!dragged && Math.hypot(x, y) < 5) return;
      dragged = true;
      char.classList.add('dragging');
      char.style.setProperty('--dx', `${grab.dx + x}px`);
      char.style.setProperty('--dy', `${grab.dy + y}px`);
    });
    const drop = () => {
      if (!grab) return;
      grab = null;
      char.classList.remove('dragging');
      if (!dragged) {
        const index = scenes.findIndex(item => item.brand.id === slot.dataset.brand);
        if (index >= 0) openViewer(index);
      }
    };
    char.addEventListener('pointerup', drop);
    char.addEventListener('pointercancel', drop);
  });

  restick.addEventListener('click', () => {
    slots.forEach(slot => {
      const label = slot.querySelector('.label');
      slot.classList.remove('revealed');
      label.classList.remove('gone');
      label.style.removeProperty('--d');
      label.removeAttribute('aria-hidden');
      label.tabIndex = 0;
      slot.querySelector('.char').style.cssText = '';
    });
    paintStatus();
    slots[0].querySelector('.label').focus({ preventScroll: true });
  });
  paintStatus();

  // 首屏进入视野后，三张从左到右依次自己揭开，最后停在三张贴纸上。
  // 用户正拖着的那张、已经揭开的那张跳过；偏好减少动态时直接显示揭开后的样子。
  async function autoPeel(slot) {
    const label = slot.querySelector('.label');
    if (slot.classList.contains('revealed') || slot.dataset.peeling || label.classList.contains('dragging')) return;
    label.style.transition = '--d .8s cubic-bezier(.45,0,.25,1)';
    label.style.setProperty('--d', `${label.offsetWidth * 0.46}px`);
    await sleep(900);
    label.style.transition = '';
    if (!label.classList.contains('dragging')) peel(slot);
  }
  const padObserver = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    padObserver.disconnect();
    if (reduceMotion) { slots.forEach(peel); return; }
    await sleep(700);
    for (const slot of slots) {
      autoPeel(slot);
      await sleep(650);
    }
  }, { threshold: 0.5 });
  padObserver.observe($('pad'));

  /* ── 例子：每个品牌一张底纸 ── */
  const setsEl = $('sets');
  const examples = document.querySelector('.examples');
  const viewer = $('viewer');
  const scenes = [];

  // 例子区的底色：没点过就跟着系统的浅色/深色走；点过以后只换这一段和大图，不影响整页。
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const surfaceButtons = [...document.querySelectorAll('[data-surface]')];
  let surface = null;
  function paintSurface() {
    const ink = surface ? surface === 'ink' : systemDark.matches;
    [examples, viewer].forEach(node => {
      node.classList.toggle('scheme-dark', surface === 'ink');
      node.classList.toggle('scheme-light', surface === 'paper');
    });
    surfaceButtons.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.surface === 'ink') === ink)));
  }
  surfaceButtons.forEach(button => button.addEventListener('click', () => { surface = button.dataset.surface; paintSurface(); }));
  systemDark.addEventListener('change', paintSurface);
  paintSurface();

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

  const sheetObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    sheetObserver.unobserve(entry.target);
  }), { threshold: 0.3 });

  function renderSets(brands) {
    brands.forEach(brand => {
      const peels = [], stories = [];
      const hot = (i, on) => { peels[i].classList.toggle('hot', on); stories[i].classList.toggle('hot', on); };
      brand.scenes.forEach((scene, i) => {
        const index = scenes.push({ brand, scene, i }) - 1;
        const open = () => openViewer(index);
        const sticker = el('button', { type: 'button', class: `peel p${i}`, style: `--i:${i}`, 'aria-label': `${brand.name}: ${scene.title}. Open larger.` },
          el('img', { src: scene.image, alt: '', width: 800, height: 800, loading: 'lazy', decoding: 'async', draggable: false }));
        const story = el('button', { type: 'button', tabIndex: -1 }, el('span', {}, String(i + 1).padStart(2, '0')), el('span', {}, scene.title));
        [sticker, story].forEach(node => {
          node.addEventListener('click', open);
          node.addEventListener('mouseenter', () => hot(i, true));
          node.addEventListener('mouseleave', () => hot(i, false));
        });
        sticker.addEventListener('focus', () => hot(i, true));
        sticker.addEventListener('blur', () => hot(i, false));
        peels.push(sticker); stories.push(story);
      });
      const sheet = el('div', { class: 'sheet' }, ...peels,
        el('div', { class: 'mark', style: '--i:5' },
          el('span', {}, el('img', { src: brand.logo, alt: `${brand.name} original logo`, width: 68, height: 68 })),
          el('small', {}, 'original')));
      setsEl.append(el('article', { class: 'set', id: `set-${brand.id}`, 'aria-labelledby': `name-${brand.id}` },
        sheet,
        el('div', { class: 'set-info' },
          el('h3', { id: `name-${brand.id}` }, brand.name),
          el('span', { class: 'route' }, (brand.route || '').toLowerCase()),
          el('p', {}, brand.description || brand.subtitle || ''),
          el('ol', { class: 'stories', 'aria-hidden': 'true' }, ...stories.map(story => el('li', {}, story))))));
      sheetObserver.observe(sheet);
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
    $('v-brand').textContent = `${brand.name} · ${(brand.route || '').toLowerCase()}`;
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
