// GLOBAL SOLUTIONS — gallery.js
// Catalogue public des réalisations : données Supabase (statut = publié),
// repli local « à compléter » si la base est vide ou injoignable.
// Chaque fiche ouvre une présentation détaillée : galerie de photos, fiche
// technique, localisation et description.

const FALLBACK_PROJECTS = [
  { titre: "Emplacement à compléter — Bâtiment", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niamey, Niger", categorie: "batiments", annee: "À compléter", image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Hydraulique", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "hydraulique", annee: "À compléter", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Forage", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "forages", annee: "À compléter", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Adduction d'eau potable", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "aeps", annee: "À compléter", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Aménagement", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "amenagements", annee: "À compléter", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Énergie solaire", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "solaire", annee: "À compléter", image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Génie civil", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "genie-civil", annee: "À compléter", image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Construction métallique", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "metal", annee: "À compléter", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop", placeholder: true },
  { titre: "Emplacement à compléter — Projet à documenter", description: "Photographie et fiche projet à fournir par GLOBAL SOLUTIONS. Cet emplacement est volontairement identifié comme contenu à compléter.", localisation: "Niger", categorie: "batiments", annee: "À compléter", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop", placeholder: true }
];
const CATEGORY_LABELS = { batiments: "Bâtiments", hydraulique: "Hydraulique", forages: "Forages", aeps: "Adduction d'eau potable", amenagements: "Aménagements", solaire: "Énergie solaire", "genie-civil": "Génie civil", metal: "Construction métallique" };

// --- Utilitaires -----------------------------------------------------------
function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function photosOf(p) {
  const list = Array.isArray(p.galerie) && p.galerie.length ? p.galerie.slice() : (p.image ? [p.image] : []);
  return list.filter(Boolean);
}
function href(url) { return esc(url).replace(/'/g, '%27'); }

// --- Rendu de la grille ----------------------------------------------------
function renderGallery(items, filter) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const list = filter === 'tous' ? items : items.filter((i) => i.categorie === filter);
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><h3>Aucun projet dans cette catégorie</h3><p>Les fiches projets seront publiées ici dès réception des photographies et informations validées.</p></div>';
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
        <img src="${href(cover)}" alt="${esc(p.titre)}" loading="lazy">
        ${total > 1 ? `<span class="g-count">📷 ${total}</span>` : ''}
        ${p.placeholder ? '<span class="tag-todo">À compléter</span>' : ''}
      </div>
      <div class="g-body">
        <h3>${esc(p.titre)}</h3>
        <p class="g-desc">${esc(p.description)}</p>
        <div class="g-meta">
          <span>${esc(CATEGORY_LABELS[p.categorie] || p.categorie || '—')}</span>
          <span>${esc(p.localisation || 'Niger')}</span>
          <span>${esc(p.annee || '—')}</span>
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
        <img class="project-photo" src="${href(photos[0] || '')}" alt="${esc(p.titre)}">
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
            localisation: d.localisation || 'Niger',
            categorie: d.categorie || 'batiments',
            annee: d.annee || '—',
            image: d.image_url || (Array.isArray(d.galerie) && d.galerie[0]) || FALLBACK_PROJECTS[0].image,
            galerie: Array.isArray(d.galerie) ? d.galerie : [],
            placeholder: false
          }));
        }
      }
    }
  } catch (e) { /* repli local */ }

  renderGallery(projects, 'tous');

  // La note d'avertissement ne concerne que les emplacements provisoires
  const note = document.querySelector('.gallery-note');
  if (note && projects.some((p) => !p.placeholder)) note.hidden = true;

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(projects, btn.dataset.filter);
    });
  });
});
