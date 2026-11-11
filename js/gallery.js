// GLOBAL SOLUTIONS — gallery.js
// Catalogue public des réalisations : données Supabase (statut = publié),
// ou photographies fournies par GLOBAL SOLUTIONS si la base est vide ou
// injoignable. Les détails non fournis (lieu, date) ne sont pas inventés.

const FALLBACK_PROJECTS = [
  { titre: 'Chantier de forage', description: 'Foreuse et matériel sur un chantier de forage.', categorie: 'forages', image: 'assets/images/chantier-forage.jpeg' },
  { titre: "Réhabilitation d'un bâtiment", description: "Travaux de réparation d'un mur.", categorie: 'batiments', image: 'assets/images/rehabilitation-batiment.jpeg' },
  { titre: 'Structure métallique', description: 'Structure et couverture métalliques sur un chantier.', categorie: 'metal', image: 'assets/images/structure-metallique.jpeg' },
  { titre: "Ouvrage d'assainissement", description: "Ouvrage d'assainissement avec rampe d'accès.", categorie: 'genie-civil', image: 'assets/images/ouvrage-assainissement.jpeg' },
  { titre: "Aménagement d'un site", description: "Vue d'ensemble d'un site aménagé et de ses ouvrages.", categorie: 'amenagements', image: 'assets/images/amenagement-site.jpeg' },
  { titre: 'Réservoir surélevé', description: 'Réservoir sur une structure métallique surélevée.', categorie: 'hydraulique', image: 'assets/images/reservoir-sureleve.jpeg' },
  { titre: 'Installation solaire', description: 'Panneaux solaires installés sur un site.', categorie: 'solaire', image: 'assets/images/installation-solaire.jpeg' },
  { titre: 'Équipement hydraulique', description: 'Ensemble de canalisations et de vannes.', categorie: 'hydraulique', image: 'assets/images/equipement-hydraulique.jpeg' },
  { titre: "Point d'eau", description: "Robinetterie et point de distribution d'eau.", categorie: 'aeps', image: 'assets/images/point-eau.jpeg' },
  { titre: 'Solaire et accès à l’eau', description: "Panneaux solaires sur un site d'accès à l'eau.", categorie: 'solaire', image: 'assets/images/pompage-solaire.jpeg' }
];
const CATEGORY_LABELS = { batiments: "Bâtiments", hydraulique: "Hydraulique", forages: "Forages", aeps: "Adduction d'eau potable", amenagements: "Aménagements", solaire: "Énergie solaire", "genie-civil": "Génie civil", metal: "Construction métallique" };

// --- Utilitaires -----------------------------------------------------------
function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function photosOf(p) {
  const gallery = Array.isArray(p.galerie) ? p.galerie.filter(Boolean) : [];
  const list = gallery.length ? gallery : (p.image ? [p.image] : []);
  const resolve = window.GS && window.GS.resolvePhoto;
  return resolve ? list.map((url) => resolve(url)) : list;
}
function href(url) { return esc(url).replace(/'/g, '%27'); }

// --- Rendu de la grille ----------------------------------------------------
function renderGallery(items, filter) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const list = filter === 'tous' ? items : items.filter((i) => i.categorie === filter);
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><h3>Aucun projet dans cette catégorie</h3><p>Aucune réalisation ne correspond à ce filtre pour le moment.</p></div>';
    return;
  }
  grid.innerHTML = list.map((p, i) => {
    const photos = photosOf(p);
    const cover = photos[0] || '';
    const total = photos.length;
    return `
    <article class="g-item" data-project="${i}" tabindex="0" role="button"
             aria-label="Voir la présentation de ${esc(p.titre)}">
      <div class="g-thumb">
        ${cover ? `<img src="${href(cover)}" alt="${esc(p.titre)}" loading="lazy">` : '<div class="g-no-photo">Photographie à venir</div>'}
        ${total > 1 ? `<span class="g-count">📷 ${total}</span>` : ''}
      </div>
      <div class="g-body">
        <h3>${esc(p.titre)}</h3>
        <p class="g-desc">${esc(p.description)}</p>
        <div class="g-meta">
          <span>${esc(CATEGORY_LABELS[p.categorie] || p.categorie || '—')}</span>
          ${p.localisation ? `<span>${esc(p.localisation)}</span>` : ''}
          ${p.annee ? `<span>${esc(p.annee)}</span>` : ''}
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('[data-project]').forEach((el) => {
    const open = () => openProject(list[Number(el.dataset.project)]);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

// --- Présentation détaillée (fiche projet) ---------------------------------
function openProject(p) {
  if (!p) return;
  const photos = photosOf(p);
  let current = 0;

  const modal = document.createElement('div');
  modal.className = 'article-modal open project-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="article-modal__panel project-panel">
      <button class="project-close" aria-label="Fermer">×</button>
      <div class="project-viewer">
        ${photos.length ? `<img class="project-photo" src="${href(photos[0])}" alt="${esc(p.titre)}">` : '<div class="project-no-photo">Photographie à venir</div>'}
        ${photos.length > 1 ? `<button class="project-nav prev" aria-label="Photo précédente">‹</button>
        <button class="project-nav next" aria-label="Photo suivante">›</button>
        <div class="project-index">1 / ${photos.length}</div>
        <div class="project-strip">${photos.map((u, i) => `<button class="strip-thumb${i === 0 ? ' active' : ''}" data-i="${i}"><img src="${href(u)}" alt="" loading="lazy" data-full="${href(u)}"></button>`).join('')}</div>` : ''}
      </div>
      <div class="article-modal__body project-body">
        <p class="news-date">${esc(CATEGORY_LABELS[p.categorie] || p.categorie || 'Réalisation')}</p>
        <h2>${esc(p.titre)}</h2>
        <div class="project-facts">
          ${p.localisation ? `<div><span>Localisation</span><strong>${esc(p.localisation)}</strong></div>` : ''}
          ${p.annee ? `<div><span>Année</span><strong>${esc(p.annee)}</strong></div>` : ''}
          ${photos.length ? `<div><span>Photographies</span><strong>${photos.length}</strong></div>` : ''}
        </div>
        <p class="article-lead">${esc(p.description)}</p>
        <div class="project-cta">
          <a class="btn btn-primary" href="contact.html">Un projet similaire ? Parlons-en</a>
          <a class="btn btn-ghost" href="https://wa.me/22799548349" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const photoEl = modal.querySelector('.project-photo');
  const indexEl = modal.querySelector('.project-index');
  const thumbs = Array.from(modal.querySelectorAll('.strip-thumb'));

  function show(i) {
    current = (i + photos.length) % photos.length;
    photoEl.src = photos[current];
    if (indexEl) indexEl.textContent = (current + 1) + ' / ' + photos.length;
    thumbs.forEach((t, k) => t.classList.toggle('active', k === current));
  }

  thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.i))));
  const prev = modal.querySelector('.prev');
  const next = modal.querySelector('.next');
  if (prev) prev.addEventListener('click', () => show(current - 1));
  if (next) next.addEventListener('click', () => show(current + 1));

  function close() {
    modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && photos.length > 1) show(current - 1);
    if (e.key === 'ArrowRight' && photos.length > 1) show(current + 1);
  }
  modal.querySelector('.project-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', onKey);
}

// --- Chargement ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  let projects = FALLBACK_PROJECTS;
  let currentFilter = 'tous';
  // Les photos sont visibles immédiatement, même si le réseau est lent.
  renderGallery(projects, currentFilter);
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery(projects, currentFilter);
    });
  });

  try {
    const cfg = window.GS_SUPABASE;
    if (cfg && cfg.url) {
      const res = await fetch(
        `${cfg.url}/rest/v1/realisations?select=*&statut=eq.publie&order=ordre.asc,created_at.desc`,
        { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          projects = data.map((d) => ({
            titre: d.titre,
            description: d.description || '',
            localisation: d.localisation || '',
            categorie: d.categorie || 'batiments',
            annee: d.annee || '',
            image: d.image_url || (Array.isArray(d.galerie) && d.galerie[0]) || '',
            galerie: Array.isArray(d.galerie) ? d.galerie : []
          }));
          renderGallery(projects, currentFilter);
        }
      }
    }
  } catch (e) { /* les photographies locales restent affichées */ }
});
