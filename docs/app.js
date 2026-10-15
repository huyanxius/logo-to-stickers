const $ = (selector) => document.querySelector(selector);
const command = 'npx skills add huyanxius/logo-to-stickers';
let brands = [];
let selectedBrand = 0;

function showScene(index) {
  const brand = brands[selectedBrand];
  const scene = brand.scenes[index];
  const image = $('#scene-image');
  image.src = scene.image;
  image.alt = scene.alt;
  image.getAnimations().forEach(animation => animation.cancel());
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) image.animate([{ opacity: 0, transform: 'translateY(8px) rotate(-2deg)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
  $('#scene-title').textContent = scene.title;
  $('#scene-description').textContent = scene.description;
  [...$('#scene-picker').children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}

function showBrand(index) {
  selectedBrand = index;
  const brand = brands[index];
  document.querySelectorAll('[data-brand]').forEach((button, i) => {
    button.setAttribute('aria-selected', String(i === index));
    button.tabIndex = i === index ? 0 : -1;
  });
  $('#brand-panel').setAttribute('aria-labelledby', `tab-${brand.id}`);
  $('#brand-logo').src = brand.logo;
  $('#brand-logo').alt = `Original ${brand.name} logo`;
  $('#brand-route').textContent = brand.route;
  $('#brand-subtitle').textContent = brand.subtitle;
  $('#brand-description').textContent = brand.description;
  $('#scene-picker').replaceChildren(...brand.scenes.map((scene, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', scene.title);
    button.setAttribute('aria-pressed', String(i === 0));
    const image = document.createElement('img');
    image.src = scene.image;
    image.alt = '';
    image.width = 800;
    image.height = 800;
    image.loading = 'lazy';
    button.append(image);
    button.addEventListener('click', () => showScene(i));
    return button;
  }));
  showScene(0);
}

document.querySelectorAll('[data-brand]').forEach((button, i, buttons) => {
  button.addEventListener('click', () => { if (brands.length) showBrand(i); });
  button.addEventListener('keydown', event => {
    if (!brands.length || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    showBrand(next);
    buttons[next].focus();
  });
});

$('#surface-toggle').addEventListener('click', event => {
  const dark = $('#stage').classList.toggle('is-dark');
  event.currentTarget.setAttribute('aria-pressed', String(dark));
  event.currentTarget.textContent = dark ? 'Light paper' : 'Dark paper';
});

$('#originals-toggle').addEventListener('click', event => {
  const original = $('.hero-art').classList.toggle('is-original');
  event.currentTarget.setAttribute('aria-pressed', String(original));
  event.currentTarget.textContent = original ? 'Bring the characters back ↔' : 'Show the original logos ↔';
  const sources = original ? ['logo-qunxue.png', 'logo-multipush.png', 'logo-windup.png'] : ['qunxue-01.webp', 'multipush-01.webp', 'windup-01.webp'];
  const descriptions = original ? ['Original Qunxue four-fragment logo', 'Original MultiPush multi-arrow logo', 'Original Windup mechanical-bird logo'] : ['Four charcoal logo fragments investigating a daisy', 'A many-armed postal writer meeting a deadline', 'A mechanical bird lifted by its own winding key'];
  document.querySelectorAll('.floating').forEach((image, i) => { image.src = `assets/${sources[i]}`; image.alt = descriptions[i]; });
});

$('#copy-command').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(command);
    $('#copy-command').textContent = 'Copied';
    $('#copy-status').textContent = 'Copied. Run it in your terminal, then give your agent a logo.';
  } catch {
    $('#copy-status').textContent = `Copy this command: ${command}`;
  }
});

fetch('gallery.json').then(response => {
  if (!response.ok) throw new Error('Gallery unavailable');
  return response.json();
}).then(data => { brands = data; showBrand(0); }).catch(() => {
  $('#gallery-status').textContent = 'The gallery could not load. You can still see all examples in the GitHub README.';
});
