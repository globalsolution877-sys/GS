// GLOBAL SOLUTIONS — gallery.js (filtres réalisations + chargement Supabase avec fallback local)
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
const CATEGORY_LABELS = { batiments:"Bâtiments", hydraulique:"Hydraulique", forages:"Forages", aeps:"Adduction d'eau potable", amenagements:"Aménagements", solaire:"Énergie solaire", "genie-civil":"Génie civil", metal:"Construction métallique" };

function renderGallery(items, filter) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const list = filter === 'tous' ? items : items.filter(i => i.categorie === filter);
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><h3>Aucun projet dans cette catégorie</h3><p>Les fiches projets seront publiées ici dès réception des photographies et informations validées.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(p => `
    <article class="g-item" data-lightbox="${p.image}" data-caption="${p.titre} — ${p.localisation}">
      <img src="${p.image}" alt="${p.titre}" loading="lazy">
      <div class="g-body">
        <h3>${p.titre}</h3>
        <p style="color:var(--grey-mid);font-size:14px;margin-top:6px">${p.description}</p>
        <div class="g-meta"><span>${CATEGORY_LABELS[p.categorie] || p.categorie}</span><span>${p.localisation}</span><span>${p.annee}</span>${p.placeholder ? '<span class="tag-todo">À compléter</span>' : ''}</div>
      </div>
    </article>`).join('');
  // Ré-attacher lightbox
  grid.querySelectorAll('[data-lightbox]').forEach(el => {
    el.addEventListener('click', () => {
      const lb = document.querySelector('.lightbox');
      if (lb) { lb.querySelector('img').src = el.getAttribute('data-lightbox'); lb.querySelector('.lightbox-cap').textContent = el.getAttribute('data-caption'); lb.classList.add('open'); }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  let projects = FALLBACK_PROJECTS;
  // Tentative Supabase (si configuré)
  try {
    const cfg = window.GS_SUPABASE;
    if (cfg && cfg.url) {
      const res = await fetch(`${cfg.url}/rest/v1/realisations?select=*&statut=eq.publie&order=created_at.desc`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          projects = data.map(d => ({ titre: d.titre, description: d.description || '', localisation: d.localisation || 'Niger', categorie: d.categorie || 'batiments', annee: d.annee || '—', image: d.image_url || FALLBACK_PROJECTS[0].image, placeholder: false }));
        }
      }
    }
  } catch (e) { /* fallback local */ }
  renderGallery(projects, 'tous');
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(projects, btn.dataset.filter);
    });
  });
});
