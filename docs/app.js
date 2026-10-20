(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const tabs = $('brand-tabs');
  const panel = $('gallery-panel');
  const picker = $('scene-picker');
  const stage = $('stage');
  const image = $('scene-image');
  const originalButton = $('originals-toggle');
  const surfaceButton = $('surface-toggle');
  const previousButton = $('previous-scene');
  const nextButton = $('next-scene');
  const controls = [originalButton, surfaceButton, previousButton, nextButton];
  let brands = [], brandIndex = 0, sceneIndex = 0, showingOriginal = false;
  let pendingBrand = new URLSearchParams(location.search).get('brand');

  controls.forEach(button => { button.disabled = true; });
  panel.hidden = true;
  $('gallery-status').textContent = 'Loading sticker sets.';
  originalButton.setAttribute('aria-controls', 'stage');
  surfaceButton.setAttribute('aria-controls', 'stage');

  function paint() {
    const brand = brands[brandIndex], scene = brand.scenes[sceneIndex];
    image.src = showingOriginal ? brand.logo : scene.image;
    image.alt = showingOriginal ? `${brand.name} original logo` : (scene.alt || `${brand.name}: ${scene.title}`);
    stage.classList.toggle('is-original', showingOriginal);
    $('scene-title').textContent = showingOriginal ? `${brand.name} original logo` : scene.title;
    $('scene-count').textContent = `${sceneIndex + 1} / ${brand.scenes.length}`;
    $('scene-description').textContent = scene.description || '';
    originalButton.textContent = showingOriginal ? 'Show sticker' : 'Show original';
    originalButton.setAttribute('aria-pressed', String(showingOriginal));
    [...picker.children].forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === sceneIndex));
      button.tabIndex = index === sceneIndex ? 0 : -1;
    });
    $('gallery-status').textContent = showingOriginal
      ? `${brand.name}, original logo.`
      : `${brand.name}: ${scene.title}. Sticker ${sceneIndex + 1} of ${brand.scenes.length}.`;
  }

  function selectScene(index) {
    const length = brands[brandIndex].scenes.length;
    sceneIndex = (index + length) % length;
    showingOriginal = false;
    paint();
    const selected = picker.children[sceneIndex];
    // Keep the active thumbnail in view without moving the rest of the page.
    if (selected && picker.scrollWidth > picker.clientWidth) {
      const start = selected.offsetLeft - picker.offsetLeft;
      if (start < picker.scrollLeft) picker.scrollLeft = start;
      else if (start + selected.offsetWidth > picker.scrollLeft + picker.clientWidth) {
        picker.scrollLeft = start + selected.offsetWidth - picker.clientWidth;
      }
    }
  }

  function selectBrand(index) {
    brandIndex = index;
    sceneIndex = 0;
    showingOriginal = false;
    const brand = brands[index];
    [...tabs.children].forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs.children[index].id);
    panel.dataset.brand = brand.id;
    $('brand-route').textContent = (brand.route || '').replace('→', 'to');
    $('brand-name').textContent = brand.name;
    $('brand-description').textContent = brand.description || brand.subtitle || '';
    $('brand-logo').src = brand.logo;
    $('brand-logo').alt = `${brand.name} original logo`;
    picker.replaceChildren();
    picker.scrollLeft = 0;
    brand.scenes.forEach((scene, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scene-button';
      button.setAttribute('aria-label', `${scene.title}, sticker ${i + 1} of ${brand.scenes.length}`);
      button.title = scene.title;
      const thumb = document.createElement('img');
      thumb.src = scene.image;
      thumb.alt = '';
      thumb.width = 120;
      thumb.height = 120;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      button.append(thumb);
      button.addEventListener('click', () => selectScene(i));
      picker.append(button);
    });
    paint();
  }

  function keyboardIndex(event, current, length) {
    if (event.key === 'ArrowRight') return (current + 1) % length;
    if (event.key === 'ArrowLeft') return (current - 1 + length) % length;
    if (event.key === 'Home') return 0;
    if (event.key === 'End') return length - 1;
    return null;
  }

  tabs.addEventListener('keydown', event => {
    if (!brands.length || !event.target.closest('[role="tab"]')) return;
    const index = keyboardIndex(event, brandIndex, brands.length);
    if (index === null) return;
    event.preventDefault();
    selectBrand(index);
    tabs.children[index].focus();
  });
  picker.addEventListener('keydown', event => {
    if (!brands.length || !event.target.closest('.scene-button')) return;
    const index = keyboardIndex(event, sceneIndex, brands[brandIndex].scenes.length);
    if (index === null) return;
    event.preventDefault();
    selectScene(index);
    picker.children[index].focus();
  });
  previousButton.addEventListener('click', () => selectScene(sceneIndex - 1));
  nextButton.addEventListener('click', () => selectScene(sceneIndex + 1));
  originalButton.addEventListener('click', () => { showingOriginal = !showingOriginal; paint(); });
  surfaceButton.addEventListener('click', () => {
    const dark = stage.classList.toggle('is-dark');
    const label = dark ? 'Light background' : 'Dark background';
    surfaceButton.setAttribute('aria-pressed', String(dark));
    surfaceButton.setAttribute('aria-label', label);
    surfaceButton.title = label;
    surfaceButton.querySelector('.sr-only').textContent = label;
  });
  document.querySelectorAll('[data-brand-preview]').forEach(link => {
    link.addEventListener('click', () => {
      pendingBrand = link.dataset.brandPreview;
      const index = brands.findIndex(brand => brand.id === pendingBrand);
      if (index >= 0) selectBrand(index);
    });
  });

  function fallbackCopy(text) {
    const active = document.activeElement, field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;left:-10000px;top:0';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); }
    finally {
      field.remove();
      if (active instanceof HTMLElement) active.focus();
    }
    if (!copied) throw Error('Clipboard unavailable');
  }
  $('copy-command').addEventListener('click', async () => {
    const command = $('install-command').textContent.trim();
    try {
      try {
        if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(command);
      } catch { fallbackCopy(command); }
      $('copy-status').textContent = 'Command copied.';
    } catch {
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents($('install-command'));
      selection?.removeAllRanges();
      selection?.addRange(range);
      $('copy-status').textContent = 'Select and copy the command above.';
    }
  });

  fetch('gallery.json').then(response => {
    if (!response.ok) throw Error(`Gallery request failed: ${response.status}`);
    return response.json();
  }).then(data => {
    brands = Array.isArray(data) ? data : data.brands;
    if (!Array.isArray(brands) || !brands.length || brands.some(brand =>
      !brand.id || !brand.name || !brand.logo || !Array.isArray(brand.scenes) || !brand.scenes.length ||
      brand.scenes.some(scene => !scene.image || !scene.title))) throw Error('Invalid gallery data');
    brands.forEach((brand, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'brand-tab';
      tab.id = `tab-${brand.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'gallery-panel');
      const logo = document.createElement('img');
      logo.src = brand.logo;
      logo.alt = '';
      logo.width = 25;
      logo.height = 25;
      const label = document.createElement('span');
      label.textContent = brand.name;
      tab.append(logo, label);
      tab.addEventListener('click', () => selectBrand(i));
      tabs.append(tab);
    });
    const initialIndex = brands.findIndex(brand => brand.id === pendingBrand);
    selectBrand(initialIndex < 0 ? 0 : initialIndex);
    panel.hidden = false;
    controls.forEach(button => { button.disabled = false; });
  }).catch(() => {
    brands = [];
    panel.hidden = true;
    $('gallery-error').hidden = false;
    $('gallery-status').textContent = 'Sticker examples could not load.';
  });
})();
