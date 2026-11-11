// ============================================================================
// GLOBAL SOLUTIONS — gs-components.js
// Rendu dynamique des sections à partir de Supabase, avec repli sur le HTML
// déjà présent dans la page (aucun écran vide, aucun contenu inventé).
// ============================================================================
(function () {
  'use strict';
  const GS = window.GS || {};
  const esc = GS.esc || ((s) => String(s == null ? '' : s));
  const resolvePhoto = GS.resolvePhoto || ((url, fallback) => url || fallback || '');

  // Les photos locales complètent les expertises dont l'image n'est pas encore
  // renseignée dans Supabase. Une image personnalisée reste prioritaire.
  const expertisePhotos = {
    btp: { src: 'assets/images/rehabilitation-batiment.jpeg', alt: "Travaux de réhabilitation d'un bâtiment" },
    hydraulique: { src: 'assets/images/equipement-hydraulique.jpeg', alt: 'Canalisations et équipements hydrauliques sur un site' },
    aeps: { src: 'assets/images/point-eau.jpeg', alt: "Point d'eau avec robinets de distribution" },
    energie: { src: 'assets/images/pompage-solaire.jpeg', alt: "Panneaux solaires sur un site d'accès à l'eau" },
    minier: { src: 'assets/images/chantier-forage.jpeg', alt: 'Foreuse et matériel sur un chantier' },
    metal: { src: 'assets/images/structure-metallique.jpeg', alt: 'Structure et couverture métalliques sur un chantier' },
    assainissement: { src: 'assets/images/ouvrage-assainissement.jpeg', alt: "Ouvrage d'assainissement avec rampe d'accès" },
    logistique: { src: 'assets/images/chantier-forage.jpeg', alt: 'Matériel et tiges de forage sur un chantier' },
    equipements: { src: 'assets/images/equipement-hydraulique.jpeg', alt: 'Canalisations et équipements hydrauliques' }
  };

  function expertisePhoto(e) {
    const fallback = expertisePhotos[e.slug];
    const src = resolvePhoto(e.image_url, fallback && fallback.src);
    if (!src) return null;
    return { src, alt: fallback && src === fallback.src ? fallback.alt : e.titre };
  }

  // --- Expertises (cartes d'accueil, liste des expertises) -------------------
  async function renderExpertises() {
    const homeGrid = document.getElementById('expertisesGrid');
    const fullList = document.getElementById('expertisesList');
    if (!homeGrid && !fullList) return;
    const items = await GS.getExpertises();
    if (!items || !items.length) return; // le HTML statique reste affiché

    if (homeGrid) {
      homeGrid.innerHTML = items.map((e, i) => {
        const photo = expertisePhoto(e);
        return `
        <article class="card reveal visible">
          <div class="card-media">
            ${photo ? `<img src="${esc(photo.src)}" alt="${esc(photo.alt)}" loading="lazy">` : ''}
            <span class="card-num">${String(i + 1).padStart(2, '0')}</span>
          </div>
          <div class="card-body">
            <h3>${esc(e.titre)}</h3>
            <p>${esc((e.description || '').slice(0, 165))}${(e.description || '').length > 165 ? '…' : ''}</p>
            <a class="card-link" href="expertises.html#${esc(e.slug)}">En savoir plus →</a>
          </div>
        </article>`;
      }).join('');
    }

    if (fullList) {
      fullList.innerHTML = items.map((e, i) => {
        const photo = expertisePhoto(e);
        return `
        <div class="exp-row${i % 2 ? ' reverse' : ''}" id="${esc(e.slug)}">
          <div class="exp-media">
            ${photo ? `<img src="${esc(photo.src)}" alt="${esc(photo.alt)}" loading="lazy">` : ''}
          </div>
          <div class="exp-body">
            <p class="eyebrow">Expertise ${String(i + 1).padStart(2, '0')}</p>
            <h2>${esc(e.titre)}</h2>
            <p>${esc(e.description || '')}</p>
            ${(e.tags && e.tags.length) ? `<div class="tags">${e.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
            ${e.secteurs ? `<p style="font-size:14px"><strong>Secteurs :</strong> ${esc(e.secteurs)}</p>` : ''}
            <a class="btn btn-dark" href="contact.html" style="margin-top:16px">Demander des renseignements</a>
          </div>
        </div>`;
      }).join('');
      // Respect du lien d'ancre (ex: expertises.html#aeps)
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    }
  }

  // --- Équipe ---------------------------------------------------------------
  async function renderEquipe() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    const items = await GS.getEquipe();
    if (!items || !items.length) return;
    grid.innerHTML = items.map((m) => `
      <article class="member reveal visible">
        ${m.photo_url
          ? `<img class="avatar-img" src="${esc(m.photo_url)}" alt="Portrait de ${esc(m.nom)}" loading="lazy">`
          : `<div class="avatar" aria-hidden="true">${esc(m.initiales || (m.nom || '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</div>`}
        <div>
          <h3>${esc(m.nom)}</h3>
          <p class="role">${esc(m.fonction || '')}</p>
          ${m.bio ? `<p>${esc(m.bio)}</p>` : ''}
        </div>
      </article>`).join('');
  }

  // --- Indicateurs (accueil) -----------------------------------------------
  async function renderStats() {
    const wrap = document.getElementById('statsRow');
    if (!wrap) return;
    const items = await GS.getStats();
    if (!items || !items.length) return;
    wrap.innerHTML = items.map((s) => `
      <div class="stat reveal visible"><strong>${esc(s.valeur)}</strong><span>${esc(s.label)}</span></div>`).join('');
  }

  // --- Réalisations (accueil = 3 dernières, page dédiée = toutes) -----------
  async function renderRealisationsTeaser() {
    const grid = document.getElementById('homeRealisations');
    if (!grid) return;
    const items = await GS.getRealisations();
    if (!items || !items.length) return;
    grid.innerHTML = items.slice(0, 3).map((p) => `
      <article class="g-item reveal visible">
        ${p.image_url ? `<img src="${esc(resolvePhoto(p.image_url))}" alt="${esc(p.titre)}" loading="lazy">` : ''}
        <div class="g-body">
          <h3>${esc(p.titre)}</h3>
          <div class="g-meta"><span>${esc(p.localisation || 'Niger')}</span>${p.annee ? `<span>${esc(p.annee)}</span>` : ''}</div>
        </div>
      </article>`).join('');
  }

  // --- Actualités (accueil = 3 dernières) ----------------------------------
  async function renderNewsTeaser() {
    const grid = document.getElementById('homeNews');
    if (!grid) return;
    const items = await GS.getActualites();
    if (!items || !items.length) return;
    grid.innerHTML = items.slice(0, 3).map((a) => `
      <article class="news-card reveal visible">
        ${a.image_url ? `<img src="${esc(resolvePhoto(a.image_url))}" alt="${esc(a.titre)}" loading="lazy">` : ''}
        <div class="news-body">
          <p class="news-date">${esc(GS.dateFr ? GS.dateFr(a.date_publication) : (a.date_publication || ''))}</p>
          <h3>${esc(a.titre)}</h3>
          <p>${esc(a.extrait || '')}</p>
        </div>
      </article>`).join('');
  }

  // --- Actualités page dédiée (avec lecture de l'article) -------------------
  async function renderActualites() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    const items = await GS.getActualites();
    if (!items || !items.length) return;
    grid.innerHTML = items.map((a, i) => `
      <article class="news-card reveal visible">
        ${a.image_url ? `<img src="${esc(resolvePhoto(a.image_url))}" alt="${esc(a.titre)}" loading="lazy">` : ''}
        <div class="news-body">
          <p class="news-date">${esc(GS.dateFr ? GS.dateFr(a.date_publication) : (a.date_publication || ''))}</p>
          <h3>${esc(a.titre)}</h3>
          <p>${esc(a.extrait || '')}</p>
          <a class="card-link" href="#" data-article="${i}">Lire l'article →</a>
        </div>
      </article>`).join('');

    grid.querySelectorAll('[data-article]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const a = items[Number(link.getAttribute('data-article'))];
        openArticle(a);
      });
    });
  }

  function openArticle(a) {
    let modal = document.getElementById('articleModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'articleModal';
      modal.className = 'article-modal';
      modal.innerHTML = `<div class="article-modal__panel" role="dialog" aria-modal="true" aria-labelledby="articleTitle">
        <button class="article-modal__close" aria-label="Fermer">&times;</button>
        <div class="article-modal__body"></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('article-modal__close')) modal.classList.remove('open');
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('open'); });
    }
    const body = modal.querySelector('.article-modal__body');
    body.innerHTML = `
      ${a.image_url ? `<img src="${esc(resolvePhoto(a.image_url))}" alt="${esc(a.titre)}">` : ''}
      <p class="news-date">${esc(GS.dateFr ? GS.dateFr(a.date_publication) : '')}</p>
      <h2 id="articleTitle">${esc(a.titre)}</h2>
      ${a.extrait ? `<p class="article-lead">${esc(a.extrait)}</p>` : ''}
      ${String(a.contenu || '').split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('')}`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.article-modal__close').addEventListener('click', () => { document.body.style.overflow = ''; });
    modal.addEventListener('click', () => { document.body.style.overflow = ''; }, { once: true });
  }

  // --- Bandeau photo / titres de page déjà gérés par data-content ----------

  function renderAll() {
    renderExpertises();
    renderEquipe();
    renderStats();
    renderRealisationsTeaser();
    renderNewsTeaser();
    renderActualites();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll);
  else renderAll();

  document.addEventListener('gs:ready', renderAll);
})();
