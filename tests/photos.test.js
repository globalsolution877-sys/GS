// Vérifications sans dépendance : node --test tests/photos.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const heroUrl = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2000&auto=format&fit=crop';

function loadData() {
  const document = { readyState: 'loading', addEventListener() {}, querySelectorAll() { return []; } };
  const window = {};
  vm.runInNewContext(read('js/gs-data.js'), { window, document, console });
  return { GS: window.GS, document };
}

test('les pages utilisent des photos locales, sauf le bandeau conservé', () => {
  const files = ['index.html', 'a-propos.html', 'expertises.html', 'actualites.html'];
  const external = [];
  let localCount = 0;
  for (const file of files) {
    for (const [tag] of read(file).matchAll(/<img\b[^>]*>/g)) {
      const src = /\ssrc="([^"]*)"/.exec(tag)?.[1] || '';
      if (src.startsWith('assets/images/')) {
        localCount++;
        assert.ok(fs.existsSync(path.join(root, src)), `${file}: ${src} introuvable`);
        assert.match(tag, /\salt="[^"]+"/);
      }
      if (src.includes('images.unsplash.com')) external.push({ file, src });
    }
  }
  assert.equal(localCount, 26);
  assert.deepEqual(external, [{ file: 'index.html', src: heroUrl }]);
});

test('les dix photographies originales sont présentes dans le catalogue local', () => {
  const grid = { innerHTML: '', querySelectorAll() { return []; } };
  const document = { addEventListener() {}, getElementById() { return grid; } };
  const context = { window: {}, document };
  vm.runInNewContext(read('js/gallery.js') + '\nglobalThis.projects = FALLBACK_PROJECTS; globalThis.render = renderGallery;', context);
  const projects = Array.from(context.projects);
  assert.equal(projects.length, 10);
  assert.equal(new Set(projects.map((p) => p.image)).size, 10);
  for (const p of projects) {
    const image = fs.readFileSync(path.join(root, p.image));
    assert.equal(image[0], 0xff);
    assert.equal(image[1], 0xd8);
    assert.ok(!p.localisation && !p.annee, 'ne pas inventer le lieu ou la date');
  }
  context.render(projects, 'solaire');
  assert.equal((grid.innerHTML.match(/class="g-item"/g) || []).length, 2);
  assert.match(grid.innerHTML, /installation-solaire\.jpeg/);
  assert.match(grid.innerHTML, /pompage-solaire\.jpeg/);
});

test('seuls les anciens visuels connus sont remplacés ; le bandeau et les photos personnalisées sont conservés', () => {
  const { GS, document } = loadData();
  const oldPhoto = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80';
  const customPhoto = 'https://example.com/photo-personnelle.jpg';
  assert.equal(GS.resolvePhoto(oldPhoto), 'assets/images/pompage-solaire.jpeg');
  assert.equal(GS.resolvePhoto(oldPhoto, 'assets/images/point-eau.jpeg'), 'assets/images/point-eau.jpeg');
  assert.equal(GS.resolvePhoto(customPhoto), customPhoto);
  assert.equal(GS.resolvePhoto('https://images.unsplash.com/constructor'), 'https://images.unsplash.com/constructor');
  assert.equal(GS.resolvePhoto(null, 'assets/images/point-eau.jpeg'), 'assets/images/point-eau.jpeg');

  let appliedSrc = '';
  const hero = {
    getAttribute() { return 'accueil.hero_image'; },
    setAttribute(name, value) { if (name === 'src') appliedSrc = value; }
  };
  document.querySelectorAll = (selector) => selector === '[data-content-src]' ? [hero] : [];
  GS.applyContent([{ page: 'accueil', cle: 'hero_image', valeur: heroUrl }]);
  assert.equal(appliedSrc, heroUrl);
});

test('les expertises Supabase sans photo utilisent les photos locales et respectent les photos personnalisées', async () => {
  const { GS } = loadData();
  GS.getExpertises = async () => [
    { slug: 'btp', titre: 'Bâtiment', image_url: null },
    { slug: 'aeps', titre: 'Eau', image_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80' },
    { slug: 'energie', titre: 'Solaire', image_url: 'https://example.com/photo-personnelle.jpg' }
  ];
  const home = { innerHTML: '', querySelectorAll: () => [] };
  const details = { innerHTML: '', querySelectorAll: () => [] };
  let boot;
  const document = {
    readyState: 'loading',
    getElementById(id) { return ({ expertisesGrid: home, expertisesList: details })[id] || null; },
    addEventListener(event, fn) { if (event === 'DOMContentLoaded') boot = fn; }
  };
  vm.runInNewContext(read('js/gs-components.js'), { window: { GS }, document, location: { hash: '' }, console, setTimeout });
  boot();
  await new Promise((resolve) => setImmediate(resolve));
  for (const html of [home.innerHTML, details.innerHTML]) {
    assert.match(html, /assets\/images\/rehabilitation-batiment\.jpeg/);
    assert.match(html, /assets\/images\/point-eau\.jpeg/);
    assert.match(html, /https:\/\/example\.com\/photo-personnelle\.jpg/);
    assert.doesNotMatch(html, /images\.unsplash\.com/);
  }
});
